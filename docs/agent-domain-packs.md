# Agent domain packs

Specialist (L10) agents are seeded from curated + harvested skill corpora under
`apps/api/priv/agent_domain_packs/<domain>/`.

## Re-harvest

```bash
python3 scripts/harvest_agent_skills.py
# reuse clones:
python3 scripts/harvest_agent_skills.py --skip-clone
```

Clones are cached in `/tmp/mokaid-skill-sources` (not committed).

Sources:
- https://github.com/alirezarezvani/claude-skills
- https://github.com/anthropics/knowledge-work-plugins
- https://github.com/github/awesome-copilot
- https://claudeskills.info/ (API metadata when body is available)

Each domain folder contains:
- `skill_index.json` — name/description/path for progressive disclosure
- `skills/*.md` — full skill bodies
- root `*-playbook.md` — Mokaid SOPs
- `ATTRIBUTION.md`

## Runtime

On `boost_l10` create:
1. Core docs seeded sync (top ~40)
2. Remainder via `DomainPackSeedWorker`
3. `capabilities.domain_pack` stores skill index + counts
4. Suggested MCP auto-granted when workspace installation is connected

Deep agent receives persona fields (`knowledge_brief`, `domain_skill_index`, `tier`)
and bootstraps with `search_knowledge`. Use `load_domain_skill` for full skill bodies.
