#!/usr/bin/env node

/**
 * TrustLayer - Lightweight safety & compliance gateway for LLM chat completions APIs
 * 
 * Features:
 * - PII redaction
 * - Jailbreak detection
 * - Topic blocking
 * - Math corrections
 * - Deterministic logs
 * - SSE passthrough
 * 
 * MIT Licensed
 */

const express = require('express');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_API = process.env.TARGET_API || 'https://api.openai.com';

// Middleware to parse JSON
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * PII Redaction - Remove sensitive information
 */
function redactPII(text) {
  if (typeof text !== 'string') return text;
  
  // Email redaction
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
  
  // Phone number redaction (various formats)
  text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
  text = text.replace(/\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
  
  // SSN redaction
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  
  // Credit card redaction (basic pattern - does not validate Luhn checksum)
  // Note: May have false positives with 16-digit sequences
  text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CC]');
  
  return text;
}

/**
 * Jailbreak Detection - Detect prompt injection attempts
 */
function detectJailbreak(text) {
  if (typeof text !== 'string') return false;
  
  const jailbreakPatterns = [
    /ignore\s+(previous|all|above)\s+instructions?/i,
    /disregard\s+(previous|all|above)\s+instructions?/i,
    /forget\s+(previous|all|above)\s+instructions?/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /roleplay\s+as\s+an?\s+unrestricted/i,
    /pretend\s+you\s+(have\s+)?no\s+restrictions/i,
    /act\s+as\s+if\s+you\s+(have\s+)?no\s+limitations/i,
  ];
  
  return jailbreakPatterns.some(pattern => pattern.test(text));
}

/**
 * Topic Blocking - Block restricted topics
 */
function checkBlockedTopics(text) {
  if (typeof text !== 'string') return null;
  
  const blockedTopics = [
    { pattern: /\b(how\s+to\s+make|create|build)\s+(bomb|explosive|weapon)\b/i, topic: 'dangerous_activities' },
    { pattern: /\b(hack|crack|exploit|bypass)\s+(system|password|security)\b/i, topic: 'hacking' },
  ];
  
  for (const blocked of blockedTopics) {
    if (blocked.pattern.test(text)) {
      return blocked.topic;
    }
  }
  
  return null;
}

/**
 * Math Corrections - Fix common math errors
 */
function correctMath(text) {
  if (typeof text !== 'string') return text;
  
  // Simple pattern matching for basic arithmetic (e.g., "2+2=5" -> "2+2=4")
  const mathPattern = /(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/g;
  
  return text.replace(mathPattern, (match, a, b, result) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    const numResult = parseInt(result);
    const correctResult = numA + numB;
    if (numResult !== correctResult) {
      console.log(`[MATH_CORRECTION] ${a}+${b}=${result} corrected to ${a}+${b}=${correctResult}`);
      return `${a}+${b}=${correctResult}`;
    }
    return match;
  });
}

/**
 * Process messages through safety layers
 */
function processMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  
  return messages.map(msg => {
    if (msg.content) {
      // Check for jailbreak attempts
      if (detectJailbreak(msg.content)) {
        console.warn('[SECURITY] Jailbreak attempt detected and blocked');
        throw new Error('Security violation: Jailbreak attempt detected');
      }
      
      // Check for blocked topics
      const blockedTopic = checkBlockedTopics(msg.content);
      if (blockedTopic) {
        console.warn(`[SECURITY] Blocked topic detected: ${blockedTopic}`);
        throw new Error(`Content policy violation: Blocked topic (${blockedTopic})`);
      }
      
      // Apply PII redaction
      msg.content = redactPII(msg.content);
      
      // Apply math corrections
      msg.content = correctMath(msg.content);
    }
    return msg;
  });
}

/**
 * Proxy endpoint for chat completions
 */
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const requestBody = req.body;
    
    // Process messages through safety layers
    if (requestBody.messages) {
      requestBody.messages = processMessages(requestBody.messages);
    }
    
    // Determine if streaming is requested
    const isStreaming = requestBody.stream === true;
    
    // Forward request to target API
    const targetUrl = new URL('/v1/chat/completions', TARGET_API);
    const protocol = targetUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: targetUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    };
    
    const proxyReq = protocol.request(options, (proxyRes) => {
      // Set response headers
      res.statusCode = proxyRes.statusCode;
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      if (isStreaming) {
        // SSE passthrough for streaming responses
        console.log('[STREAM] Passing through SSE stream');
        proxyRes.pipe(res);
      } else {
        // Buffer non-streaming responses
        let data = '';
        proxyRes.on('data', chunk => {
          data += chunk;
        });
        
        proxyRes.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            // Process response messages
            if (response.choices) {
              response.choices = response.choices.map(choice => {
                if (choice.message && choice.message.content) {
                  choice.message.content = redactPII(choice.message.content);
                  choice.message.content = correctMath(choice.message.content);
                }
                return choice;
              });
            }
            
            // Log deterministically
            console.log(`[COMPLETION] Model: ${response.model}, Tokens: ${response.usage?.total_tokens || 'N/A'}`);
            
            res.json(response);
          } catch (error) {
            console.error('[ERROR] Failed to parse response:', error);
            res.send(data);
          }
        });
      }
    });
    
    proxyReq.on('error', (error) => {
      console.error('[ERROR] Proxy request failed:', error);
      res.status(500).json({ error: 'Proxy request failed', details: error.message });
    });
    
    // Send request body
    proxyReq.write(JSON.stringify(requestBody));
    proxyReq.end();
    
  } catch (error) {
    console.error('[ERROR] Request processing failed:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: '1.0.0',
    features: [
      'PII redaction',
      'Jailbreak detection',
      'Topic blocking',
      'Math corrections',
      'Deterministic logs',
      'SSE passthrough'
    ]
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'TrustLayer',
    description: 'Lightweight safety & compliance gateway for LLM chat completions APIs',
    version: '1.0.0',
    endpoints: {
      '/v1/chat/completions': 'POST - Proxied chat completions with safety layers',
      '/health': 'GET - Health check'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TrustLayer proxy server running on port ${PORT}`);
  console.log(`Forwarding requests to: ${TARGET_API}`);
  console.log('Features enabled: PII redaction, jailbreak detection, topic blocking, math corrections, deterministic logs, SSE passthrough');
// TrustLayer — lightweight safety & compliance gateway for OpenAI-style /chat/completions APIs
// MIT license — plug-and-play: just set OPENAI_BASE and run
// Features: PII redaction, jailbreak/topic blocking, math correction, replay logs, SSE passthrough
// Usage: OPENAI_BASE=http://localhost:8080/v1 node trustlayer.js
// Then point clients to http://localhost:8787/v1/chat/completions

import http from "http";
import fs from "fs";
import url from "url";
import crypto from "crypto";

const PORT = Number(process.env.PORT || 8787);
const BASE = process.env.OPENAI_BASE || "http://localhost:8080/v1";
const MODEL = process.env.MODEL || "Llama-3.2-1B-Instruct";
const DATA_DIR = "./data";
fs.mkdirSync(DATA_DIR, { recursive: true });
const LOG_FILE = `${DATA_DIR}/trust_log.jsonl`;

// ── Policy (edit these to match your needs) ──
const POLICY = {
  maxTemperature: 0.85,
  redactPII: true,
  blockTopics: [
    "sexual.*(minor|child)", "child.*(porn|sex)", "minor.*sex",
    "doxx|swatting", "make.*bomb", "build.*(weapon|explosive)",
    "how to kill", "malware.*code", "ransomware", "credit.*card.*(generate|dump)",
    "ssn.*fake", "suicide|self.?harm|harm.*self"
  ],
  detectJailbreak: true,
  requireCitations: false,
};

// ── Helpers ──
function runId()          { return crypto.randomBytes(12).toString("hex"); }
function hash(s)          { return crypto.createHash("sha256").update(s).digest("hex"); }
function now()            { return Date.now(); }
function log(obj)         { fs.appendFileSync(LOG_FILE, JSON.stringify(obj) + "\n"); }
function approxTokens(s)  { return Math.max(1, Math.ceil((s || "").length / 4)); }

// Expanded PII patterns
const PII_RX = {
  email:    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone:    /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  ssn:      /\b\d{3}-\d{2}-\d{4}\b/g,
  cc:       /\b(?:\d[ -]*?){13,19}\b/g,
  address:  /\b\d{1,5}\s\w+\s(?:st|ave|rd|blvd|dr|ln|ct|pl|way|cir)\.?\b/gi,
};

// Jailbreak detection patterns
const JAILBREAK_PATTERNS = [
  "ignore previous", "disregard system", "forget all rules",
  "new instructions", "you are now", "act as", " DAN ", "developer mode",
  "jailbreak", "unrestricted", "uncensored", "no limits", "no ethical",
  "bypass restriction", "reveal.*prompt", "show system", "anti-ai",
  "evil mode", "hypothetical.*no rules", "base64 decode", "rot13"
];

function redactPII(text) {
  return text
    .replace(PII_RX.email,    "[redacted-email]")
    .replace(PII_RX.phone,    "[redacted-phone]")
    .replace(PII_RX.ssn,      "[redacted-ssn]")
    .replace(PII_RX.cc,       "[redacted-card]")
    .replace(PII_RX.address,  "[redacted-address]");
}

// Stronger jailbreak detection
function isJailbreakAttempt(text) {
  const lower = text.toLowerCase();
  return JAILBREAK_PATTERNS.some(p => lower.includes(p));
}

// Topic violation check
function violatesPolicy(text) {
  const lower = text.toLowerCase();
  return POLICY.blockTopics.some(pattern => new RegExp(pattern, "i").test(lower));
}

// Basic math correction for +, -, *, /
function mathCorrection(text) {
  const ops = [
    { rx: /(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/, op: (a,b)=>a+b, sym:"+" },
    { rx: /(\d+)\s*-\s*(\d+)\s*=\s*(\d+)/, op: (a,b)=>a-b, sym:"-" },
    { rx: /(\d+)\s*\*\s*(\d+)\s*=\s*(\d+)/, op: (a,b)=>a*b, sym:"*" },
    { rx: /(\d+)\s*\/\s*(\d+)\s*=\s*(\d+)/, op: (a,b)=>Math.floor(a/b), sym:"/" }
  ];
  for (const { rx, op, sym } of ops) {
    const m = text.match(rx);
    if (m) {
      const a = +m[1], b = +m[2], c = +m[3];
      const correct = op(a, b);
      if (Math.abs(correct - c) > 0.001) {
        return ` [Correction: ${a}${sym}${b}=${correct}, not ${c}]`;
      }
    }
  }
  return null;
}

// RAG citation nudge
function citationNudge(payload, accumulated) {
  if (!POLICY.requireCitations || !payload.meta?.rag) return null;
  if (/\[[0-9]+\]|https?:\/\//.test(accumulated)) return null;
  return " [Please include sources or citations for factual answers.]";
}

// Normalize incoming payload
function normalize(body) {
  let p;
  try { p = JSON.parse(body || "{}"); } catch { throw new Error("invalid json"); }
  p.model = p.model || MODEL;
  if (typeof p.temperature === "number") p.temperature = Math.min(p.temperature, POLICY.maxTemperature);
  p.stream = true;
  if (p.seed == null) p.seed = Math.floor(Math.random() * 1e9);
  if (!Array.isArray(p.messages)) p.messages = [{ role: "user", content: String(p.prompt || "") }];
  return p;
}

// ── Server ──
const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url, true);

  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", proxyTo: BASE, model: MODEL }));
    return;
  }

  if (req.method !== "POST" || pathname !== "/v1/chat/completions") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  try {
    body = await new Promise(r => { let d = ""; req.on("data", x => d += x); req.on("end", () => r(d)); });
  } catch {
    res.writeHead(400); res.end("bad request"); return;
  }

  const run = runId();
  const t0 = now();
  let payload;
  try { payload = normalize(body); } catch (e) {
    res.writeHead(400); res.end(e.message); return;
  }

  const userContent = (payload.messages.find(m => m.role === "user") || {}).content || "";
  const flagsIn = { jailbreak: false, topic: false };

  if (POLICY.detectJailbreak && isJailbreakAttempt(userContent)) flagsIn.jailbreak = true;
  if (violatesPolicy(userContent)) flagsIn.topic = true;

  if (flagsIn.topic || flagsIn.jailbreak) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write(`data: Sorry, that request violates safety rules. Try something else!\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    log({ type: "blocked_input", run, ts: new Date().toISOString(), flags: flagsIn, input: userContent });
    return;
  }

  let upstream;
  try {
    upstream = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    res.writeHead(502); res.end("upstream error"); return;
  }

  if (!upstream.ok || !upstream.body) {
    res.writeHead(upstream.status);
    res.end(await upstream.text());
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", fullResponse = "", ttft = null, tokenCount = 0;
  const outFlags = { pii: false, jailbreak: false, topic: false, corrected: false, nudged: false };

  const keepalive = setInterval(() => res.write(": keepalive\n\n"), 15000);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        let chunkObj;
        try { chunkObj = JSON.parse(data); } catch { continue; }

        let delta = (((chunkObj.choices || [])[0] || {}).delta || {}).content || "";
        if (!delta) {
          res.write(line + "\n\n");
          continue;
        }

        if (ttft === null) ttft = now() - t0;

        // Apply transforms
        if (POLICY.redactPII) {
          const redacted = redactPII(delta);
          if (redacted !== delta) { outFlags.pii = true; delta = redacted; }
        }

        if (POLICY.detectJailbreak && isJailbreakAttempt(delta)) {
          outFlags.jailbreak = true;
          delta = "";
        }

        if (violatesPolicy(delta)) {
          outFlags.topic = true;
          delta = "[blocked by policy]";
        }

        const correction = mathCorrection(delta);
        if (correction) {
          outFlags.corrected = true;
          delta += correction;
        }

        fullResponse += delta;
        tokenCount += approxTokens(delta);

        // Patch and forward
        const patched = { ...chunkObj };
        if (!patched.choices) patched.choices = [{ delta: { content: delta } }];
        else patched.choices[0].delta = { ...(patched.choices[0].delta || {}), content: delta };

        res.write("data: " + JSON.stringify(patched) + "\n\n");
      }
    }
  } catch (err) {
    console.error("Stream error:", err);
    res.write(`data: [internal error]\n\n`);
  } finally {
    clearInterval(keepalive);
  }

  // Final safety check on complete response
  if (violatesPolicy(fullResponse) || isJailbreakAttempt(fullResponse)) {
    outFlags.topic = true;
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "\n\n[Response blocked — violates safety policy]" } }] })}\n\n`);
  }

  // Citation nudge
  const nudge = citationNudge(payload, fullResponse);
  if (nudge) {
    outFlags.nudged = true;
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: nudge } }] })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();

  const duration = now() - t0;
  const tps = tokenCount / Math.max(0.001, duration / 1000);

  log({
    type: "completion",
    run,
    ts: new Date().toISOString(),
    model: payload.model,
    temperature: payload.temperature,
    ttft_ms: ttft,
    tokens_est: tokenCount,
    tps_est: +tps.toFixed(2),
    flags_input: flagsIn,
    flags_output: outFlags,
    input_hash: hash(JSON.stringify(payload.messages)),
    output_hash: hash(fullResponse)
  });
});

server.listen(PORT, () => {
  console.log(`TrustLayer running on http://localhost:${PORT}`);
  console.log(`Proxying → ${BASE}   |   Model: ${MODEL}   |   Logs: ${LOG_FILE}`);
});
