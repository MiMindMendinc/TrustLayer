# TrustLayer Roadmap

TrustLayer is being hardened from a practical prototype into a cleaner local-first LLM safety gateway demo.

## Near-Term

- [ ] Add Dockerfile and docker-compose example
- [x] Add `.env.example` with safe placeholder values
- [ ] Add modular policy configuration
- [ ] Add demo GIF showing PII redaction
- [ ] Add architecture diagram
- [ ] Add local Ollama / LiteLLM routing example
- [ ] Expand tests for streaming behavior

## Hardening

- [ ] Add authentication guidance
- [ ] Add rate limiting guidance
- [ ] Add audit-log retention controls
- [ ] Add dependency scanning workflow
- [ ] Add fuzz-style tests for redaction patterns
- [ ] Add safer log mode that avoids raw prompt retention

## Demo / Portfolio Polish

- [ ] Add screenshots of `npm test`
- [ ] Add screenshot of `/health`
- [ ] Add screenshot or GIF of redaction behavior
- [ ] Add one-page architecture card
- [ ] Add short video script for recruiters/sponsors

## Production Review Before Sensitive Use

Before real use with regulated or sensitive data, TrustLayer needs security, privacy, legal, and deployment review. The project should remain honest about prototype status until those reviews exist.
