# TrustLayer Threat Model

## Purpose

TrustLayer is a lightweight safety and privacy gateway placed between an application and an OpenAI-compatible model endpoint. This document describes the main risks the project is designed to reduce and the risks it does not solve by itself.

## Assets to Protect

- user prompts and responses
- API keys and provider tokens
- personal information such as emails, phone numbers, addresses, and identifiers
- audit logs
- policy configuration
- local model or provider endpoint configuration
- application availability and trust

## Trust Boundaries

```text
User / App
  -> TrustLayer input checks
  -> Model provider or local model server
  -> TrustLayer output checks
  -> App response
```

Important boundaries:

- user input is untrusted
- model output is untrusted
- external model providers may receive data if configured
- local logs must be treated as sensitive
- environment variables and API keys must never be exposed to users

## Primary Threats

### Sensitive Data Exposure

Risk: prompts, responses, or logs may contain private information.

Mitigations:

- PII redaction before model routing where possible
- avoid raw sensitive logging
- document data retention clearly
- use synthetic test data

### Prompt Injection / Jailbreak Attempts

Risk: a user attempts to override safety behavior, reveal policy text, or force unsafe output.

Mitigations:

- rule-based input checks
- restricted-topic detection
- output checks where applicable
- test cases for common bypass language

### Misconfigured Provider Routing

Risk: users believe the system is local-only while traffic is actually routed to a remote endpoint.

Mitigations:

- clear environment configuration
- startup logs that show configured provider mode
- README warnings about deployment verification

### Unsafe Audit Logging

Risk: logs preserve private user content, secrets, or regulated information.

Mitigations:

- hash or redact sensitive fields
- document log location
- add retention controls before production use

### Overclaiming Safety or Compliance

Risk: users rely on TrustLayer as if it were certified, clinically validated, or legally compliant.

Mitigations:

- explicit non-claims in README and docs
- status document
- security policy
- require professional review for regulated deployment

## Out of Scope

TrustLayer alone does not solve:

- endpoint compromise
- malicious administrators
- full DLP coverage
- clinical risk assessment
- legal compliance certification
- model hallucination generally
- all prompt-injection attacks
- physical device security

## Production Hardening Backlog

- [ ] authentication and authorization
- [ ] rate limiting
- [ ] structured policy config
- [ ] safer audit-log retention controls
- [ ] Docker and deployment examples
- [ ] dependency scanning
- [ ] fuzz tests for redaction and policy checks
- [ ] reproducible benchmark notes
- [ ] security review before sensitive deployment
