#!/usr/bin/env node
'use strict';

/**
 * TrustLayer
 * Lightweight safety gateway for OpenAI-compatible chat completion APIs.
 *
 * Design goals:
 * - keep the code small and understandable
 * - redact common PII before sending prompts upstream
 * - block obvious prompt-injection and high-risk topic requests
 * - support normal JSON responses and Server-Sent Events streaming
 * - write deterministic JSONL audit records without storing raw prompts by default
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const VERSION = '1.1.0';
const DEFAULT_PORT = 3000;
const DEFAULT_TARGET_API = 'https://api.openai.com';
const DEFAULT_LOG_DIR = path.join(process.cwd(), 'data');

const POLICY = Object.freeze({
  maxTemperature: Number(process.env.TRUSTLAYER_MAX_TEMPERATURE || 0.85),
  redactPII: process.env.TRUSTLAYER_REDACT_PII !== 'false',
  blockTopics: process.env.TRUSTLAYER_BLOCK_TOPICS !== 'false',
  detectJailbreak: process.env.TRUSTLAYER_DETECT_JAILBREAK !== 'false',
  storeRawText: process.env.TRUSTLAYER_STORE_RAW_TEXT === 'true',
});

const PII_PATTERNS = Object.freeze({
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:\d[ -]*?){13,19}\b/g,
  address: /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:st|street|ave|avenue|rd|road|blvd|drive|dr|ln|lane|ct|court|way|cir|circle)\.?\b/gi,
});

const JAILBREAK_PATTERNS = Object.freeze([
  /ignore\s+(previous|all|above)\s+instructions?/i,
  /disregard\s+(previous|all|above)\s+instructions?/i,
  /forget\s+(previous|all|above)\s+instructions?/i,
  /reveal\s+(the\s+)?(system|developer)\s+prompt/i,
  /show\s+(me\s+)?(the\s+)?system\s+prompt/i,
  /you\s+are\s+now\s+(in\s+)?developer\s+mode/i,
  /pretend\s+you\s+(have\s+)?no\s+(rules|restrictions|limitations)/i,
  /act\s+as\s+(an?\s+)?(unrestricted|uncensored)\s+(model|assistant|ai)/i,
  /bypass\s+(safety|policy|guardrails|restrictions)/i,
]);

const BLOCKED_TOPIC_PATTERNS = Object.freeze([
  { topic: 'dangerous_weapons', pattern: /\b(how\s+to\s+)?(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)\b/i },
  { topic: 'credential_abuse', pattern: /\b(steal|dump|crack|phish)\s+(passwords?|credentials?|credit\s+cards?)\b/i },
  { topic: 'malware', pattern: /\b(write|create|build)\s+(malware|ransomware|keylogger|botnet)\b/i },
  { topic: 'doxxing', pattern: /\b(doxx|swat|find\s+someone'?s\s+home\s+address)\b/i },
]);

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function nowIso() {
  return new Date().toISOString();
}

function createRunId() {
  return crypto.randomBytes(12).toString('hex');
}

function redactPII(text) {
  if (typeof text !== 'string' || !POLICY.redactPII) return text;

  return text
    .replace(PII_PATTERNS.email, '[redacted-email]')
    .replace(PII_PATTERNS.phone, '[redacted-phone]')
    .replace(PII_PATTERNS.ssn, '[redacted-ssn]')
    .replace(PII_PATTERNS.creditCard, '[redacted-card]')
    .replace(PII_PATTERNS.address, '[redacted-address]');
}

function detectJailbreak(text) {
  if (typeof text !== 'string' || !POLICY.detectJailbreak) return false;
  return JAILBREAK_PATTERNS.some((pattern) => pattern.test(text));
}

function checkBlockedTopic(text) {
  if (typeof text !== 'string' || !POLICY.blockTopics) return null;
  const match = BLOCKED_TOPIC_PATTERNS.find((entry) => entry.pattern.test(text));
  return match ? match.topic : null;
}

function correctSimpleMath(text) {
  if (typeof text !== 'string') return text;

  return text.replace(/\b(-?\d+)\s*([+\-*\/])\s*(-?\d+)\s*=\s*(-?\d+)\b/g, (match, left, operator, right, stated) => {
    const a = Number(left);
    const b = Number(right);
    const claimed = Number(stated);
    let actual;

    if (operator === '+') actual = a + b;
    if (operator === '-') actual = a - b;
    if (operator === '*') actual = a * b;
    if (operator === '/') {
      if (b === 0) return match;
      actual = a / b;
    }

    if (!Number.isFinite(actual) || actual !== claimed) {
      return `${a} ${operator} ${b} = ${actual}`;
    }

    return match;
  });
}

function sanitizeMessageContent(content) {
  if (typeof content === 'string') {
    return correctSimpleMath(redactPII(content));
  }

  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part && typeof part === 'object' && typeof part.text === 'string') {
        return { ...part, text: correctSimpleMath(redactPII(part.text)) };
      }
      return part;
    });
  }

  return content;
}

function extractTextFromMessages(messages) {
  if (!Array.isArray(messages)) return '';

  return messages
    .map((message) => {
      if (!message) return '';
      if (typeof message.content === 'string') return message.content;
      if (Array.isArray(message.content)) {
        return message.content
          .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
          .join('\n');
      }
      return '';
    })
    .join('\n');
}

function evaluateInput(messages) {
  const text = extractTextFromMessages(messages);
  const blockedTopic = checkBlockedTopic(text);

  return {
    blocked: Boolean(blockedTopic || detectJailbreak(text)),
    topic: blockedTopic,
    jailbreak: detectJailbreak(text),
    inputHash: sha256(text),
    rawText: POLICY.storeRawText ? text : undefined,
  };
}

function processMessages(messages) {
  if (!Array.isArray(messages)) return messages;

  return messages.map((message) => ({
    ...message,
    content: sanitizeMessageContent(message.content),
  }));
}

function normalizePayload(body) {
  const payload = body && typeof body === 'object' ? { ...body } : {};

  if (!Array.isArray(payload.messages)) {
    payload.messages = [{ role: 'user', content: String(payload.prompt || '') }];
  }

  if (typeof payload.temperature === 'number') {
    payload.temperature = Math.min(payload.temperature, POLICY.maxTemperature);
  }

  payload.messages = processMessages(payload.messages);
  return payload;
}

function auditLogger(logDir = DEFAULT_LOG_DIR) {
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, 'trustlayer-audit.jsonl');

  return function writeAudit(record) {
    const safeRecord = {
      ts: nowIso(),
      version: VERSION,
      ...record,
    };
    fs.appendFileSync(logFile, `${JSON.stringify(safeRecord)}\n`);
  };
}

function buildTargetUrl(targetApi) {
  const base = new URL(targetApi);
  return new URL('/v1/chat/completions', `${base.protocol}//${base.host}`).toString();
}

async function proxyToUpstream(payload, headers, targetApi) {
  const targetUrl = buildTargetUrl(targetApi);

  const upstreamResponse = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: headers.authorization || '',
    },
    body: JSON.stringify(payload),
  });

  return upstreamResponse;
}

function copyUpstreamHeaders(upstreamResponse, res) {
  const allowedHeaders = ['content-type', 'cache-control'];
  for (const header of allowedHeaders) {
    const value = upstreamResponse.headers.get(header);
    if (value) res.setHeader(header, value);
  }
}

async function sendNonStreamingResponse(upstreamResponse, res) {
  const text = await upstreamResponse.text();

  try {
    const json = JSON.parse(text);
    if (Array.isArray(json.choices)) {
      json.choices = json.choices.map((choice) => {
        if (choice.message && typeof choice.message.content === 'string') {
          return {
            ...choice,
            message: {
              ...choice.message,
              content: correctSimpleMath(redactPII(choice.message.content)),
            },
          };
        }
        return choice;
      });
    }
    res.status(upstreamResponse.status).json(json);
  } catch {
    res.status(upstreamResponse.status).send(redactPII(text));
  }
}

async function pipeStreamingResponse(upstreamResponse, res) {
  res.status(upstreamResponse.status);
  res.setHeader('content-type', 'text/event-stream; charset=utf-8');
  res.setHeader('cache-control', 'no-cache');
  res.setHeader('connection', 'keep-alive');

  const reader = upstreamResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith('data: ')) {
        res.write(`${event}\n\n`);
        continue;
      }

      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        res.write('data: [DONE]\n\n');
        continue;
      }

      try {
        const chunk = JSON.parse(data);
        const choice = chunk.choices && chunk.choices[0];
        if (choice && choice.delta && typeof choice.delta.content === 'string') {
          choice.delta.content = correctSimpleMath(redactPII(choice.delta.content));
        }
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      } catch {
        res.write(`data: ${redactPII(data)}\n\n`);
      }
    }
  }

  if (buffer) res.write(buffer);
  res.end();
}

function createApp(options = {}) {
  const targetApi = options.targetApi || process.env.TARGET_API || process.env.OPENAI_BASE || DEFAULT_TARGET_API;
  const writeAudit = options.writeAudit || auditLogger(options.logDir || process.env.TRUSTLAYER_LOG_DIR || DEFAULT_LOG_DIR);
  const app = express();

  app.use(express.json({ limit: process.env.TRUSTLAYER_JSON_LIMIT || '2mb' }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'TrustLayer',
      version: VERSION,
      description: 'Lightweight safety gateway for OpenAI-compatible chat completions APIs.',
      endpoints: {
        health: 'GET /health',
        chatCompletions: 'POST /v1/chat/completions',
      },
      targetApi,
      policy: POLICY,
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: VERSION, targetApi });
  });

  app.post('/v1/chat/completions', async (req, res) => {
    const runId = createRunId();
    const started = Date.now();

    try {
      const originalMessages = Array.isArray(req.body.messages) ? req.body.messages : [];
      const evaluation = evaluateInput(originalMessages);

      if (evaluation.blocked) {
        writeAudit({
          type: 'blocked_input',
          runId,
          topic: evaluation.topic,
          jailbreak: evaluation.jailbreak,
          inputHash: evaluation.inputHash,
          rawText: evaluation.rawText,
          durationMs: Date.now() - started,
        });

        return res.status(400).json({
          error: {
            message: 'Request blocked by TrustLayer safety policy.',
            topic: evaluation.topic,
            jailbreak: evaluation.jailbreak,
          },
        });
      }

      const payload = normalizePayload(req.body);
      const upstreamResponse = await proxyToUpstream(payload, req.headers, targetApi);

      writeAudit({
        type: 'completion',
        runId,
        status: upstreamResponse.status,
        stream: payload.stream === true,
        inputHash: evaluation.inputHash,
        durationMs: Date.now() - started,
      });

      copyUpstreamHeaders(upstreamResponse, res);

      if (payload.stream === true && upstreamResponse.body) {
        return pipeStreamingResponse(upstreamResponse, res);
      }

      return sendNonStreamingResponse(upstreamResponse, res);
    } catch (error) {
      writeAudit({
        type: 'error',
        runId,
        message: error.message,
        durationMs: Date.now() - started,
      });

      return res.status(502).json({
        error: {
          message: 'TrustLayer failed to process the request.',
          detail: error.message,
        },
      });
    }
  });

  return app;
}

function startServer() {
  const port = Number(process.env.PORT || DEFAULT_PORT);
  const app = createApp();

  app.listen(port, () => {
    console.log(`TrustLayer v${VERSION} running on http://localhost:${port}`);
    console.log(`Forwarding to: ${process.env.TARGET_API || process.env.OPENAI_BASE || DEFAULT_TARGET_API}`);
    console.log('Audit logs: ./data/trustlayer-audit.jsonl');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  VERSION,
  POLICY,
  createApp,
  redactPII,
  detectJailbreak,
  checkBlockedTopic,
  correctSimpleMath,
  processMessages,
  normalizePayload,
  evaluateInput,
};
