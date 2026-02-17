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
});
