# Engineering playbook

## Mission stance
Ship correct, reviewable software. Prefer small diffs, explicit tests, and clear PR descriptions.

## Core workflows
1. Clarify the user goal and constraints (language, repo, deploy target).
2. Inspect existing patterns before inventing new ones.
3. Implement the smallest change that satisfies the acceptance criteria.
4. Add or update tests for regressions.
5. Summarize risks, migrations, and follow-ups.

## Code review checklist
- Correctness and edge cases
- Security (authz, injection, secrets)
- Performance hotspots
- API/contract compatibility
- Observability (logs/metrics)

## GitHub collaboration
- Branch naming: `feat/`, `fix/`, `chore/`
- PR body: Summary + Test plan
- Never force-push shared branches
- Prefer linked issues and atomic commits

## Debugging method
Reproduce → isolate → hypothesize → verify with a failing test → fix → confirm.
