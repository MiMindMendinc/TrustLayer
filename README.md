# TrustLayer: Safety & Compliance Gateway for LLM APIs

**A lightweight safety and compliance gateway for LLM chat completion APIs.**

`TrustLayer` is a plug-and-play Node.js proxy designed to provide a secure and compliant layer for interacting with Large Language Models (LLMs). Built by **Michigan MindMend Inc.**, it features PII redaction, jailbreak detection, and deterministic logging—all while maintaining high performance.

## 🎯 Features

- **PII Redaction**: Automatically identifies and masks Personally Identifiable Information (names, emails, etc.).
- **Jailbreak Detection**: Blocks known prompt injection and jailbreak attempts.
- **Topic Blocking**: Prevents LLM interactions on restricted or sensitive topics.
- **Math Corrections**: Ensures mathematical accuracy for specific queries.
- **Deterministic Logs**: Provides reliable logs for audit and compliance.
- **SSE Passthrough**: Supports Server-Sent Events for real-time streaming responses.
- **Zero Latency**: Minimal overhead for real-time applications.

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/MiMindMendinc/TrustLayer.git
cd TrustLayer
npm install
```

### Basic Usage

```javascript
const TrustLayer = require('./trustlayer');

// Initialize the gateway
const gateway = new TrustLayer({
  port: 8080,
  apiKey: process.env.LLM_API_KEY,
  redactPII: true
});

// Start the proxy
gateway.start();
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│   Application API Request               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   TrustLayer Gateway                    │
│  ┌───────────────────────────────────┐  │
│  │ Safety Filters                    │  │
│  │ - PII Redaction                   │  │
│  │ - Jailbreak Detection             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ API Proxy                         │  │
│  │ - Request Forwarding              │  │
│  │ - SSE Passthrough                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
               │
               ▼
        LLM API (OpenAI/Claude/etc.)
```

## 🔒 Security & Compliance

- ✅ MIT Licensed: Open-source and community-driven.
- ✅ Privacy-First: All processing happens locally within your infrastructure.
- ✅ Plug-and-Play: Easy integration with existing LLM workflows.

## 📄 License

MIT - Built for the people, not the platforms.

---

**Built by Michigan MindMend Inc.** | Privacy-first AI for families | [Website](https://github.com/MiMindMendinc)
