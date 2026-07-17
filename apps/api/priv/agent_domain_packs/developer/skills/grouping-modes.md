---
name: grouping-modes
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/efcore-d2-db-diagram/references/grouping-modes.md
license: MIT
domain: developer
---

# grouping-modes

# Grouping Modes

## bounded-context

Group tables by domain area using folder, namespace and naming clues.

Examples:

- Clients
- Offers
- Freelances
- Billing
- Audit
- Identity

## schema

Group by database schema from `ToTable` or migrations.

## namespace

Group by C# namespace.

## flat

Do not create containers.

Use flat mode for small schemas or when the user wants maximum compatibility.
