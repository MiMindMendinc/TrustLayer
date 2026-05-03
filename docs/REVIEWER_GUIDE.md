# TrustLayer Reviewer Guide

Use this guide if you are reviewing TrustLayer as a recruiter, sponsor, partner, or technical evaluator.

## What This Project Shows

TrustLayer demonstrates hands-on AI safety engineering for LLM applications:

- PII redaction patterns
- prompt-injection / jailbreak detection
- restricted-topic checks
- OpenAI-compatible gateway design
- audit logging direction
- local / private model gateway thinking

## Best First Read

1. `README.md` — project overview and quick demo
2. `docs/STATUS.md` — current working status and non-claims
3. `docs/THREAT_MODEL.md` — risks, trust boundaries, and hardening backlog
4. `docs/PRIVACY_AND_SAFETY.md` — privacy and deployment notes
5. `SECURITY.md` — responsible disclosure and security scope

## What To Run

```bash
npm ci
npm test
npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

## What To Look For

- Does the project clearly reduce risk before model calls?
- Are privacy claims tied to visible code and docs?
- Are prototype limits clearly stated?
- Are tests and CI present or planned?
- Is the architecture understandable enough to extend?

## Current Evaluation

TrustLayer should be evaluated as a strong prototype and portfolio signal, not as a certified production security product. It is best understood as a practical starting point for local-first or on-prem LLM safety middleware.
