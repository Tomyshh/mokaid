---
name: production-guardrails
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/phoenix-evals/references/production-guardrails.md
license: MIT
domain: product
---

# production-guardrails

# Production: Guardrails vs Evaluators

Guardrails block in real-time. Evaluators measure asynchronously.

## Key Distinction

```
Request → [INPUT GUARDRAIL] → LLM → [OUTPUT GUARDRAIL] → Response
                                            │
                                            └──→ ASYNC EVALUATOR (background)
```

## Guardrails

| Aspect | Requirement |
| ------ | ----------- |
| Timing | Synchronous, blocking |
| Latency | < 100ms |
| Purpose | Prevent harm |
| Type | Code-based (deterministic) |

**Use for:** PII detection, prompt injection, profanity, length limits, format validation.

## Evaluators

| Aspect | Characteristic |
| ------ | -------------- |
| Timing | Async, background |
| Latency | Can be seconds |
| Purpose | Measure quality |
| Type | Can use LLMs |

**Use for:** Helpfulness, faithfulness, tone, completeness, citation accuracy.

## Decision

| Question | Answer |
| -------- | ------ |
| Must block harmful content? | Guardrail |
| Measuring quality? | Evaluator |
| Need LLM judgment? | Evaluator |
| < 100ms required? | Guardrail |
| False positives = angry users? | Evaluator |

## LLM Guardrails: Rarely

Only use LLM guardrails if:
- Latency budget > 1s
- Error cost >> LLM cost
- Low volume
- Fallback exists

**Key Principle:** Guardrails prevent harm (block). Evaluators measure quality (log).
