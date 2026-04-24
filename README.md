# TrustLayer

**A lightweight LLM safety gateway for privacy-aware chat-completion apps.**

TrustLayer is a Michigan MindMend Inc. prototype that sits between an application and an OpenAI-style `/v1/chat/completions` endpoint. It demonstrates practical safety middleware for LLM systems: PII redaction, jailbreak/prompt-injection detection, topic blocking, streaming passthrough, and deterministic audit logging.

This repo is built as a portfolio-quality example of **AI safety engineering**, **privacy-first product thinking**, and **local/edge-friendly LLM infrastructure**.

---

## Why it matters

LLM apps should not send sensitive user data straight to a model provider without a safety layer. TrustLayer explores a simple pattern:

```text
App → TrustLayer safety gateway → LLM provider or local model server → TrustLayer response checks → App
```

The goal is not to replace full enterprise security review. The goal is to show how a small, understandable gateway can reduce risk before and after model calls.

---

## What it does

- **PII redaction** for common sensitive data patterns such as emails, phone numbers, SSNs, cards, and addresses.
- **Jailbreak / prompt-injection detection** using configurable pattern checks.
- **Topic blocking** for restricted or high-risk request categories.
- **Streaming support** through Server-Sent Events passthrough.
- **Audit logging** with hashed request/response records for reproducibility and debugging.
- **OpenAI-style endpoint compatibility** for apps that already call `/v1/chat/completions`.
- **Local-model friendly design** through configurable upstream base URLs.

---

## Tech stack

- Node.js
- HTTP proxy / middleware pattern
- OpenAI-compatible chat-completions routing
- JSONL audit logs
- Regex-based policy checks
- Streaming response handling

---

## Current status

**Active prototype / portfolio project.**

This repository demonstrates the architecture and safety ideas, but it is not yet a hardened production package. The next cleanup pass should separate the experimental proxy paths into modules, add automated tests, and standardize the runtime style.

Known engineering cleanup targets:

- Split policy, redaction, logging, and proxy code into separate files.
- Choose one runtime style and keep it consistent across the codebase.
- Add unit tests for PII redaction, topic blocking, jailbreak detection, and streaming behavior.
- Add example configs for OpenAI-compatible local servers such as Ollama/LiteLLM/vLLM.
- Add Docker support and a simple demo app.

---

## Quick start

```bash
git clone https://github.com/MiMindMendinc/TrustLayer.git
cd TrustLayer
npm install
npm start
```

Default local endpoint:

```text
http://localhost:3000/v1/chat/completions
```

Health check:

```bash
curl http://localhost:3000/health
```

Example request:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "My email is test@example.com. Summarize this safely."}
    ]
  }'
```

---

## What I built / modified

This project shows hands-on work in:

- LLM middleware design
- privacy and safety filters
- API gateway routing
- streaming response handling
- deterministic logging concepts
- safety-first product documentation

---

## Recruiter notes

TrustLayer is the clearest example of my work in **LLM safety infrastructure**. It connects directly to roles involving AI safety, trust and safety automation, LLM evaluation, privacy engineering, AI product prototyping, and responsible AI systems.

---

## Roadmap

- [ ] Modularize the gateway internals
- [ ] Add Jest or Node test runner coverage
- [ ] Add Dockerfile and compose example
- [ ] Add local model examples
- [ ] Add policy configuration file
- [ ] Add benchmark and latency notes
- [ ] Add screenshots / demo video

---

## Built by

**Lyle Perrien II**  
Founder, **Michigan MindMend Inc.**  
Owosso, Michigan

Building privacy-first, offline-first AI tools for youth safety, family wellness, and responsible local automation.

## License

MIT
