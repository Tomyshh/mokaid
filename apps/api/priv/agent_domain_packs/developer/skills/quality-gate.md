---
name: quality-gate
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/efcore-d2-db-diagram/references/quality-gate.md
license: MIT
domain: developer
---

# quality-gate

# Quality Gate

Before delivery:

- Confirm the selected DbContext.
- Confirm source files inspected.
- Validate table names against Fluent API and migrations.
- Include primary keys.
- Include foreign keys.
- Include cardinalities.
- Include join tables unless hidden by user choice.
- Include owned types according to user choice.
- Hide technical tables only if configured and list them in the summary.
- Run `d2 fmt` when available.
- Use full dot-notation for edges inside containers.
- Provide render command.
