# Contributing to TrustLayer

Thank you for your interest in TrustLayer.

TrustLayer is a Michigan MindMend Inc. prototype for practical LLM safety and privacy middleware. Contributions should keep the project simple, inspectable, and honest about its limits.

## Project Goals

TrustLayer should remain:

- small enough to understand
- easy to run locally
- compatible with OpenAI-style chat completion APIs
- useful with local or private model gateways
- careful with sensitive data
- honest about prototype status

## Good Contributions

Helpful contributions include:

- clearer PII redaction tests
- stronger prompt-injection test cases
- safer audit logging behavior
- Docker and compose improvements
- local model examples for Ollama, LiteLLM, or vLLM
- documentation fixes
- threat model improvements
- reproducible benchmark notes

## Before Opening a Pull Request

Run:

```bash
npm ci
npm test
npm audit
```

A good PR should include:

- clear problem statement
- small focused change
- tests for new behavior
- documentation updates when behavior changes
- no secrets, API keys, private logs, or real user data

## Safety Rules

Do not add code or examples that:

- collect sensitive user data unnecessarily
- log raw secrets or private family/medical/youth content
- claim compliance without evidence
- bypass safety checks without a clear maintainer reason
- present the project as a clinical, legal, or emergency tool

## Reporting Security Issues

Do not open public issues for vulnerabilities. Use the process in `SECURITY.md`.

## License

By contributing, you agree that your contribution will be licensed under the MIT License used by this repository.
