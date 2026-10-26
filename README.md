# TrustLayer

**Lightweight LLM safety and privacy gateway for OpenAI-compatible applications.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933)](package.json)
[![CI](https://github.com/MiMindMendinc/TrustLayer/actions/workflows/ci.yml/badge.svg)](https://github.com/MiMindMendinc/TrustLayer/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

TrustLayer is a small Node.js proxy that sits between an app and any OpenAI-compatible `/v1/chat/completions` endpoint, including local model servers. Before a prompt leaves your network it redacts common PII, blocks obvious prompt-injection attempts and a fixed set of high-risk topics, and caps temperature. On the way back it applies the same redaction to the model's reply (including streamed chunks) and writes a JSONL audit record that stores a SHA-256 hash of the input instead of the raw text. The whole gateway is one readable file, [`trustlayer.js`](trustlayer.js), so a reviewer can audit every rule.

Built by **Michigan MindMend Inc.** as a demonstration of hands-on, privacy-first AI safety engineering.

---

## Problem

LLM apps often send sensitive user text directly to a model provider. That creates risk when prompts contain emails, phone numbers, family details, credentials, crisis language, or instructions designed to bypass policy.

Teams need a small, understandable safety layer they can inspect, run locally, and adapt before traffic reaches a model.

## How it works

```text
App
  → TrustLayer input checks   (block jailbreak / restricted topic → HTTP 400 + audit record)
  → PII redaction + arithmetic correction + temperature cap
  → OpenAI-compatible provider or local model server
  → TrustLayer response checks (PII redaction + arithmetic correction on JSON or SSE chunks)
  → App
```

---

## Key features

- **PII redaction** — regex rules for emails, phone numbers, SSNs, card-like digit runs, and street addresses, replaced with tags such as `[redacted-email]`. Applied to requests and to responses.
- **Jailbreak / prompt-injection detection** — rule-based checks for common bypass phrasing ("ignore previous instructions", "reveal the system prompt", "developer mode", and similar).
- **Restricted-topic blocking** — built-in categories: `dangerous_weapons`, `credential_abuse`, `malware`, and `doxxing`. Blocked requests return HTTP 400 and are never forwarded.
- **Temperature cap** — requested `temperature` values above the configured maximum are lowered.
- **Arithmetic correction** — `correctSimpleMath` finds simple integer statements of the form `a + b = c` (also `-`, `*`, `/`) and, when the stated result is wrong, rewrites it with the computed result (for example `2 + 2 = 5` becomes `2 + 2 = 4`). It runs on request messages and on model replies, including each streamed chunk. Division by zero is left unchanged. **It is always on in v1.1.0:** there is no environment variable to disable it, and it still runs when PII redaction is turned off.
- **Streaming support** — Server-Sent Events passthrough, with redaction applied chunk by chunk.
- **Deterministic audit logging** — JSONL records in `./data/trustlayer-audit.jsonl` with run ID, outcome, duration, and a SHA-256 input hash. Raw text is stored only if you opt in.
- **OpenAI-compatible API** — accepts `/v1/chat/completions` requests and forwards the caller's `Authorization` header upstream.
- **Local / edge friendly** — point `TARGET_API` at a local OpenAI-compatible server (for example Ollama on port 11434).

PII redaction, topic blocking, and jailbreak detection can each be switched on or off with an environment variable (see [Configuration](#configuration)). The rule lists themselves live in `trustlayer.js`; there is no separate policy file yet.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Name, version, target API, and active policy flags |
| `GET` | `/health` | Health check |
| `POST` | `/v1/chat/completions` | Safety-checked proxy to the upstream model |

---

## Tech stack

- Node.js 18+ (uses the built-in `fetch`)
- [Express 4](https://expressjs.com/) — the only runtime dependency
- Node's built-in `crypto` for SHA-256 audit hashes
- Native Node test runner (`node --test`)
- GitHub Actions CI

## Project layout

```text
trustlayer.js            # the gateway: policy rules, redaction, proxy, audit log
test/trustlayer.test.js  # unit tests (node --test)
.env.example             # configuration template
docs/                    # status, threat model, privacy notes, reviewer guide, roadmap
```

---

## Quick start

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

Example request that exercises the PII redaction path:

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

## Configuration

TrustLayer is configured entirely through environment variables. All are optional; the defaults below apply when a variable is unset. A ready-to-copy template is provided in [`.env.example`](.env.example).

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port TrustLayer listens on. |
| `TARGET_API` | `https://api.openai.com` | Upstream OpenAI-compatible base URL. The host is used and `/v1/chat/completions` is appended automatically. |
| `OPENAI_BASE` | — | Accepted as an alias for `TARGET_API`. |
| `TRUSTLAYER_MAX_TEMPERATURE` | `0.85` | Requested `temperature` values above this are capped. |
| `TRUSTLAYER_REDACT_PII` | `true` | Set to `false` to disable PII redaction. |
| `TRUSTLAYER_BLOCK_TOPICS` | `true` | Set to `false` to disable restricted-topic blocking. |
| `TRUSTLAYER_DETECT_JAILBREAK` | `true` | Set to `false` to disable jailbreak / prompt-injection detection. |
| `TRUSTLAYER_STORE_RAW_TEXT` | `false` | Set to `true` to store raw input text in audit logs. Otherwise only a SHA-256 hash is stored. |
| `TRUSTLAYER_LOG_DIR` | `./data` | Directory for JSONL audit logs (created if missing). |
| `TRUSTLAYER_JSON_LIMIT` | `2mb` | Maximum accepted JSON request body size. |

The upstream API key is not read from the environment; it is forwarded from the incoming request's `Authorization` header (for example, `Authorization: Bearer YOUR_API_KEY`).

To point TrustLayer at a local model gateway:

```bash
TARGET_API=http://localhost:11434 npm start
```

---

## Tests & CI

Run tests locally:

```bash
npm test
```

CI runs on pushes and pull requests using `.github/workflows/ci.yml`.

Currently tested areas:

- PII redaction
- jailbreak / prompt-injection detection
- blocked-topic detection
- arithmetic correction utility
- payload normalization
- input safety evaluation

---

## Documentation

Deeper context for reviewers and contributors lives in [`docs/`](docs/):

- [Status](docs/STATUS.md) — what works today and what is explicitly not claimed.
- [Threat Model](docs/THREAT_MODEL.md) — assets, trust boundaries, and hardening backlog.
- [Privacy & Safety Notes](docs/PRIVACY_AND_SAFETY.md) — privacy principles and a deployment checklist.
- [Reviewer Guide](docs/REVIEWER_GUIDE.md) — how to evaluate the project quickly.
- [Roadmap](docs/ROADMAP.md) — near-term and hardening plans.

---

## Status and limits

**Prototype, v1.1.0.** The checks are regex and rule based: they reduce risk but do not guarantee complete PII detection or jailbreak prevention, and they are not a substitute for a security, privacy, or legal review. TrustLayer makes no HIPAA, clinical, or production-security certification claims, and does not guarantee zero data egress in every deployment. Use with regulated, youth, medical, or other high-risk data needs professional review first.

## Roadmap

- [ ] Add Dockerfile and docker-compose example
- [ ] Add modular policy config file
- [ ] Expand test coverage for streaming behavior
- [ ] Add local model examples for Ollama / LiteLLM / vLLM
- [ ] Add latency benchmark notes with reproducible setup
- [ ] Add screenshots and short demo video
- [ ] Split policy, redaction, logging, and proxy internals into modules

---

## Built by

**Lyle Perrien II**  
Founder, **Michigan MindMend Inc.**  
Michigan  
X: [@p_perrien](https://x.com/p_perrien)

## License

[MIT](LICENSE)
