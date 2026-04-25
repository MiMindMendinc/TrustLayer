# TrustLayer

**Lightweight LLM safety and privacy gateway for OpenAI-compatible applications.**

TrustLayer is a Node.js proxy that sits between an app and any OpenAI-compatible `/v1/chat/completions` endpoint, including local model servers. It demonstrates practical AI safety infrastructure: PII redaction, jailbreak / prompt-injection detection, topic blocking, streaming passthrough, and deterministic audit logging.

Built by **Michigan MindMend Inc.** as a portfolio demonstration of hands-on, privacy-first AI safety engineering.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933)](package.json)
[![CI](https://github.com/MiMindMendinc/TrustLayer/actions/workflows/ci.yml/badge.svg)](https://github.com/MiMindMendinc/TrustLayer/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/Tests-node%20--test-brightgreen)](test/trustlayer.test.js)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Prototype-blue)](#current-status)

---

## Problem

LLM apps often send sensitive user text directly to a model provider. That creates risk when prompts contain emails, phone numbers, family details, credentials, crisis language, or instructions designed to bypass policy.

Teams need a small, understandable safety layer they can inspect, run locally, and adapt before traffic reaches a model.

## Solution

TrustLayer adds a policy gateway in front of the model:

```text
App
  → TrustLayer input checks
  → OpenAI-compatible provider or local model server
  → TrustLayer response checks
  → App
```

The goal is not corporate theater or unverifiable magic. The goal is direct, testable, practical risk reduction.

---

## Key Features

- **PII redaction** — common emails, phone numbers, SSNs, cards, addresses, and configurable patterns.
- **Jailbreak / prompt-injection detection** — rule-based checks for obvious bypass attempts.
- **Topic / content blocking** — configurable restricted categories for high-risk requests.
- **Streaming support** — Server-Sent Events passthrough for chat UI compatibility.
- **Deterministic audit logging** — hashed JSONL records for debugging and reproducibility.
- **OpenAI-compatible API** — designed around `/v1/chat/completions` style requests.
- **Local / edge friendly** — can point at local model gateways such as Ollama, LiteLLM, or vLLM when configured.

---

## Tech Stack

- Node.js 18+
- Express-style HTTP proxy pattern
- OpenAI-compatible chat-completions routing
- JSONL audit logs
- Regex / rule-based safety checks
- Native Node test runner: `node --test`
- GitHub Actions CI

---

## Quick Demo / How To Try It

```bash
git clone https://github.com/MiMindMendinc/TrustLayer.git
cd TrustLayer
npm ci
npm test
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

Example request with PII redaction path:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "My email is person@example.com. Summarize this safely."}
    ]
  }'
```

---

## Screenshots / Demo Placeholders

Add these assets next for sponsor/recruiter polish:

| Asset | File Path | Purpose |
|---|---|---|
| Terminal test screenshot | `docs/assets/trustlayer-tests.png` | Shows `npm test` passing |
| Health check screenshot | `docs/assets/trustlayer-health.png` | Shows local API running |
| Redaction demo GIF | `docs/assets/trustlayer-redaction-demo.gif` | Shows PII redaction behavior |
| Architecture card | `docs/assets/trustlayer-architecture.png` | Explains the gateway visually |

Suggested README image block after assets exist:

```md
![TrustLayer test run](docs/assets/trustlayer-tests.png)
![TrustLayer architecture](docs/assets/trustlayer-architecture.png)
```

---

## Tests & CI

Run tests locally:

```bash
npm test
```

CI runs on pushes and pull requests using `.github/workflows/ci.yml`.

Current tested areas:

- PII redaction
- jailbreak / prompt-injection detection
- blocked-topic detection
- basic math correction utility
- payload normalization
- input safety evaluation

---

## Privacy & Safety Commitments

TrustLayer is designed around these commitments:

- **Minimize exposure** before text reaches a model.
- **Keep policy behavior inspectable** instead of hidden behind vague claims.
- **Support local / on-prem deployment** where teams need tighter control.
- **Log deterministically for debugging** while avoiding raw sensitive data where possible.
- **Stay honest about limits**: rule-based checks reduce risk but do not guarantee complete safety.

---

## What TrustLayer Does Not Claim

TrustLayer does **not** currently claim:

- HIPAA compliance
- clinical validation
- production security certification
- perfect PII detection
- perfect jailbreak prevention
- guaranteed zero data egress in every deployment

Any use with regulated, youth, medical, legal, or high-risk data needs professional security, privacy, legal, and safety review.

---

## Current Status

**Active prototype / portfolio project.**

TrustLayer is built to show practical AI safety engineering and privacy-first product thinking. It is suitable as a recruiter/sponsor demo and starting point for deeper hardening.

---

## Roadmap

- [ ] Add Dockerfile and docker-compose example
- [ ] Add modular policy config file
- [ ] Expand test coverage for streaming behavior
- [ ] Add local model examples for Ollama / LiteLLM / vLLM
- [ ] Add latency benchmark notes with reproducible setup
- [ ] Add screenshots and short demo video
- [ ] Split policy, redaction, logging, and proxy internals into modules

---

## Built By

**Lyle Perrien II**  
Founder, **Michigan MindMend Inc.**  
Owosso, Michigan  
X: [@p_perrien](https://x.com/p_perrien)

Building privacy-first, offline-capable AI safety tools for kids, families, and communities.

## License

MIT
