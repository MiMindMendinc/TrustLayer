# Security Policy

TrustLayer is a prototype / portfolio project for practical LLM safety and privacy middleware. It is designed to demonstrate risk-reduction patterns, not to certify production security by itself.

## Supported Status

Current status: **active prototype**.

Security reports are welcome for the current `main` branch.

## Reporting a Vulnerability

Please report security concerns privately through GitHub private vulnerability reporting:

**https://github.com/MiMindMendinc/TrustLayer/security/advisories/new**

Please include:

- affected file or component
- steps to reproduce
- expected behavior
- actual behavior
- potential impact
- suggested fix, if known

Please do not publicly disclose exploitable issues until there has been reasonable time to review and respond.

## Scope

In scope:

- PII redaction bypasses
- prompt-injection / jailbreak filter bypasses
- unsafe logging of sensitive content
- request/response handling bugs
- dependency or configuration risks
- issues that could expose secrets, tokens, or user data

Out of scope:

- social engineering
- denial-of-service against public infrastructure not controlled by this project
- reports without reproducible impact
- claims that require production certification unless tied to repo code

## Security Boundaries

TrustLayer does not currently claim:

- HIPAA compliance
- clinical validation
- production security certification
- perfect PII detection
- perfect jailbreak prevention
- guaranteed zero data egress in every deployment

Any use with regulated, youth, medical, legal, financial, or other sensitive data requires professional security, privacy, legal, and compliance review.

## Dependency Hygiene

Recommended maintainer checks before release:

```bash
npm ci
npm audit
npm test
```

## Responsible Use

TrustLayer is meant to reduce risk before and after model calls. It should be used as one layer in a broader safety system, not as the only control for high-risk deployments.
