#!/usr/bin/env python3
"""Full build-time harvest of Claude/Copilot skills into domain packs.

Clones upstream repos (shallow), parses SKILL.md / instruction files, optionally
enriches via claudeskills.info search API, and writes:

  apps/api/priv/agent_domain_packs/<domain>/
    skills/<slug>.md
    skill_index.json
    ATTRIBUTION.md

Usage:
  python3 scripts/harvest_agent_skills.py
  python3 scripts/harvest_agent_skills.py --skip-clone   # reuse cache
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKS = ROOT / "apps" / "api" / "priv" / "agent_domain_packs"
CACHE = Path(os.environ.get("MOKAID_SKILL_CACHE", "/tmp/mokaid-skill-sources"))

REPOS = [
    {
        "name": "claude-skills",
        "url": "https://github.com/alirezarezvani/claude-skills.git",
        "license": "check-repo",
    },
    {
        "name": "knowledge-work-plugins",
        "url": "https://github.com/anthropics/knowledge-work-plugins.git",
        "license": "Apache-2.0",
    },
    {
        "name": "awesome-copilot",
        "url": "https://github.com/github/awesome-copilot.git",
        "license": "MIT",
    },
]

DOMAINS = [
    "developer",
    "data_scientist",
    "research",
    "finance",
    "marketing",
    "sales",
    "sciences",
    "legal",
    "ops_hr",
    "product",
    "design",
    "writer_content",
    "security",
    "devops",
    "support_cs",
    "media_video",
]

# path / name / category keywords → domain
KEYWORD_DOMAIN = [
    (r"secur|owasp|vuln|threat|cve|semgrep|codeql|pentest", "security"),
    (r"devops|kubernetes|k8s|docker|terraform|ci[-_]?cd|sre|observab", "devops"),
    (r"support|customer[-_ ]?success|helpdesk|zendesk|ticket", "support_cs"),
    (r"video|podcast|ffmpeg|media[-_ ]edit|transcription|youtube", "media_video"),
    (r"financ|account|budget|trading|invest|fp&a|invoice", "finance"),
    (r"market|seo|growth|campaign|brand|social", "marketing"),
    (r"sales|outbound|crm|pipeline|negotiat", "sales"),
    (r"legal|compliance|contract|gdpr|policy", "legal"),
    (r"design|figma|ui[-_/ ]?ux|frontend[-_ ]design|palette", "design"),
    (r"product|roadmap|prd|priorit", "product"),
    (r"data[-_ ]?sci|analy|sql|spreadsheet|ml|machine[-_ ]learn", "data_scientist"),
    # sciences before research so bio-research / scientific-* land correctly
    (r"bio[-_]|sciences?|biology|chemistry|physics|lab[-_ ]|allotrope|scientific|instrument-data", "sciences"),
    (r"research|arxiv|literature|competitor", "research"),
    (r"writ|content|copy|blog|article|present|slide|docs", "writer_content"),
    (r"hr|ops|sop|productivity|meeting|hiring|people", "ops_hr"),
    (r"code|dev|test|debug|github|api|agent|typescript|python|react", "developer"),
]

MIN_BODY = 200

# Strong path-prefix overrides (checked before keyword heuristics)
PATH_OVERRIDES = [
    ("bio-research/", "sciences"),
    ("/sciences/", "sciences"),
    ("/science/", "sciences"),
    ("research/", "research"),
    ("finance/", "finance"),
    ("marketing", "marketing"),
    ("compliance", "legal"),
    ("legal", "legal"),
    ("engineering", "developer"),
    ("product-team", "product"),
    ("productivity", "ops_hr"),
    ("business-operations", "ops_hr"),
    ("commercial", "sales"),
    ("security", "security"),
    ("devops", "devops"),
]
CORE_PLAYBOOKS_KEEP = True


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:90] or "skill"


def map_domain(*parts: str) -> str:
    blob = " ".join(p for p in parts if p).lower().replace("\\", "/")
    for prefix, domain in PATH_OVERRIDES:
        if prefix.lower() in blob:
            return domain
    for pattern, domain in KEYWORD_DOMAIN:
        if re.search(pattern, blob):
            return domain
    return "developer"


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    if not raw.startswith("---"):
        return {}, raw
    end = raw.find("\n---", 3)
    if end < 0:
        return {}, raw
    fm_raw = raw[3:end].strip()
    body = raw[end + 4 :].lstrip("\n")
    meta: dict = {}
    for line in fm_raw.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip().lower()] = v.strip().strip('"').strip("'")
    return meta, body


def useful_body(body: str) -> bool:
    text = re.sub(r"\s+", " ", body or "").strip()
    return len(text) >= MIN_BODY


def clone_repos(skip: bool) -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    for repo in REPOS:
        dest = CACHE / repo["name"]
        if skip and dest.is_dir():
            print(f"reuse clone: {dest}")
            continue
        if dest.exists():
            shutil.rmtree(dest)
        print(f"cloning {repo['url']} → {dest}")
        subprocess.run(
            ["git", "clone", "--depth", "1", "--quiet", repo["url"], str(dest)],
            check=True,
        )


def find_skill_files(repo_dir: Path) -> list[Path]:
    patterns = [
        "**/SKILL.md",
        "**/skill.md",
        "**/instructions.md",
        "**/AGENTS.md",
        "**/*.instructions.md",
        "**/prompt.md",
    ]
    found: list[Path] = []
    for pat in patterns:
        found.extend(repo_dir.glob(pat))
    # awesome-copilot often uses agents/*.md and instructions/*.md
    for sub in ("agents", "instructions", "prompts", "skills"):
        d = repo_dir / sub
        if d.is_dir():
            found.extend(d.rglob("*.md"))
    # dedupe
    uniq = {}
    for p in found:
        if "node_modules" in p.parts or ".git" in p.parts:
            continue
        if p.name.upper() in {"README.MD", "LICENSE.MD", "CHANGELOG.MD", "CONTRIBUTING.MD"}:
            continue
        uniq[p.resolve()] = p
    return sorted(uniq.values(), key=lambda p: str(p))


def append_references(skill_path: Path, body: str) -> str:
    extras = []
    for name in ("reference.md", "REFERENCES.md", "examples.md", "EXAMPLES.md"):
        ref = skill_path.parent / name
        if ref.is_file():
            try:
                extras.append(f"\n\n## Reference ({name})\n\n" + ref.read_text(encoding="utf-8", errors="ignore")[:12000])
            except OSError:
                pass
    return body + "".join(extras)


def collect_from_repos() -> list[dict]:
    items: list[dict] = []
    for repo in REPOS:
        repo_dir = CACHE / repo["name"]
        if not repo_dir.is_dir():
            print(f"warn: missing clone {repo_dir}")
            continue
        files = find_skill_files(repo_dir)
        print(f"{repo['name']}: {len(files)} candidate md files")
        for path in files:
            try:
                raw = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            meta, body = parse_frontmatter(raw)
            body = append_references(path, body)
            if not useful_body(body) and not useful_body(raw):
                # keep shorter instruction cards if they have a clear name+desc
                if len((meta.get("description") or "") + body) < 120:
                    continue
            name = meta.get("name") or path.parent.name if path.name.lower() == "skill.md" else path.stem
            if name.lower() in {"readme", "license", "changelog"}:
                continue
            desc = meta.get("description") or ""
            rel = str(path.relative_to(repo_dir))
            domain = map_domain(name, desc, rel, meta.get("category", ""))
            items.append(
                {
                    "name": name.replace("_", " ").strip(),
                    "description": desc,
                    "body": body if useful_body(body) else raw,
                    "domain": domain,
                    "source": f"https://github.com/{'alirezarezvani/claude-skills' if repo['name']=='claude-skills' else ('anthropics/knowledge-work-plugins' if repo['name']=='knowledge-work-plugins' else 'github/awesome-copilot')}/blob/main/{rel}",
                    "license": repo["license"],
                    "repo": repo["name"],
                    "path": rel,
                    "stars": 0,
                    "tags": [domain, repo["name"]],
                }
            )
    return items


def fetch_api_cards() -> list[dict]:
    queries = [
        "development", "testing", "security", "devops",
        "data analysis", "machine learning", "research",
        "finance", "marketing seo", "sales",
        "science", "legal compliance", "productivity",
        "product", "design ui", "writing content",
        "customer support", "video media", "agents",
    ]
    cards: list[dict] = []
    for q in queries:
        for offset in (0, 25, 50):
            url = "https://claudeskills.info/api/v1/search?" + urllib.parse.urlencode(
                {"q": q, "limit": "25", "offset": str(offset)}
            )
            req = urllib.request.Request(url, headers={"User-Agent": "mokaid-harvest/2.0"})
            try:
                with urllib.request.urlopen(req, timeout=25) as resp:
                    payload = json.loads(resp.read().decode("utf-8"))
            except Exception as exc:  # noqa: BLE001
                print(f"warn: api {q}@{offset}: {exc}")
                break
            items = payload if isinstance(payload, list) else None
            if isinstance(payload, dict):
                for key in ("results", "skills", "items", "data"):
                    if isinstance(payload.get(key), list):
                        items = payload[key]
                        break
            if not items:
                break
            for item in items:
                if not isinstance(item, dict):
                    continue
                name = item.get("name") or item.get("title") or "unnamed"
                desc = item.get("description") or item.get("summary") or ""
                source = item.get("url") or item.get("repo") or item.get("html_url") or "https://claudeskills.info/"
                # Prefer linking to upstream; body only if API returns content
                body = item.get("content") or item.get("body") or item.get("readme") or ""
                if not useful_body(body):
                    # metadata card — skip body write if we already have repo content;
                    # keep as discovery stub only when body is rich enough later
                    continue
                domain = map_domain(name, desc, str(item.get("category") or ""), q)
                cards.append(
                    {
                        "name": str(name),
                        "description": str(desc),
                        "body": body,
                        "domain": domain,
                        "source": str(source),
                        "license": "check-upstream",
                        "repo": "claudeskills.info",
                        "path": "",
                        "stars": int(item.get("stars") or item.get("stargazers_count") or 0),
                        "tags": [domain, "claudeskills"],
                    }
                )
    print(f"api rich cards: {len(cards)}")
    return cards


def dedupe(items: list[dict]) -> list[dict]:
    best: dict[str, dict] = {}
    for it in items:
        key = slugify(it["name"]) + "|" + it["domain"]
        # also collapse near-identical names across domains to longest body in mapped domain
        alt = slugify(it["name"])
        existing = best.get(key) or best.get(alt)
        score = len(it.get("body") or "") + int(it.get("stars") or 0)
        if existing is None:
            best[key] = it
            continue
        ex_score = len(existing.get("body") or "") + int(existing.get("stars") or 0)
        if score > ex_score:
            best[key] = it
    # second pass by slug alone keep longest
    by_slug: dict[str, dict] = {}
    for it in best.values():
        s = slugify(it["name"])
        prev = by_slug.get(s)
        if prev is None or len(it.get("body") or "") > len(prev.get("body") or ""):
            by_slug[s] = it
    return list(by_slug.values())


def preserve_playbooks(domain_dir: Path) -> list[tuple[str, str]]:
    """Keep hand-curated playbooks at domain root (not under skills/)."""
    kept = []
    if not domain_dir.is_dir():
        return kept
    for path in domain_dir.glob("*.md"):
        if path.name == "ATTRIBUTION.md":
            continue
        kept.append((path.name, path.read_text(encoding="utf-8", errors="ignore")))
    return kept


def write_packs(items: list[dict]) -> None:
    # Preserve existing root playbooks before wipe of skills/
    saved_playbooks: dict[str, list[tuple[str, str]]] = {}
    for domain in DOMAINS:
        d = PACKS / domain
        saved_playbooks[domain] = preserve_playbooks(d)

    # Clean skill trees but keep blank
    for domain in DOMAINS:
        d = PACKS / domain
        skills = d / "skills"
        if skills.exists():
            shutil.rmtree(skills)
        d.mkdir(parents=True, exist_ok=True)
        (d / "skills").mkdir(exist_ok=True)
        # restore playbooks
        for name, body in saved_playbooks.get(domain, []):
            (d / name).write_text(body, encoding="utf-8")

    by_domain: dict[str, list[dict]] = defaultdict(list)
    for it in items:
        domain = it["domain"] if it["domain"] in DOMAINS else map_domain(it["name"], it.get("description", ""))
        if domain not in DOMAINS:
            domain = "developer"
        by_domain[domain].append(it)

    for domain in DOMAINS:
        d = PACKS / domain
        index = []
        attr_lines = [
            f"# Attribution — {domain}\n",
            "\nBuilt by `scripts/harvest_agent_skills.py` from public upstream skill repos.\n",
            "Executable third-party scripts are not imported.\n\n",
            "## Skills\n",
        ]
        for it in sorted(by_domain.get(domain, []), key=lambda x: (-len(x.get("body") or ""), x["name"])):
            slug = slugify(it["name"])
            rel_path = f"skills/{slug}.md"
            out = d / rel_path
            header = (
                f"---\n"
                f"name: {it['name']}\n"
                f"description: {it.get('description', '').replace(chr(10), ' ')[:400]}\n"
                f"source: {it.get('source', '')}\n"
                f"license: {it.get('license', '')}\n"
                f"domain: {domain}\n"
                f"---\n\n"
                f"# {it['name']}\n\n"
            )
            desc = it.get("description") or ""
            if desc and desc not in (it.get("body") or ""):
                header += f"> {desc}\n\n"
            body = it.get("body") or desc
            # strip nested frontmatter duplication
            if body.lstrip().startswith("---"):
                _, body = parse_frontmatter(body.lstrip())
            out.write_text(header + body.strip() + "\n", encoding="utf-8")
            index.append(
                {
                    "name": it["name"],
                    "slug": slug,
                    "description": desc[:500],
                    "path": rel_path,
                    "source": it.get("source", ""),
                    "license": it.get("license", ""),
                    "tags": it.get("tags") or [domain],
                    "stars": it.get("stars") or 0,
                    "chars": len(body),
                }
            )
            attr_lines.append(f"- `{slug}` ← {it.get('source', '')} ({it.get('license', '')})\n")

        (d / "skill_index.json").write_text(
            json.dumps(
                {
                    "domain": domain,
                    "pack_version": hashlib.sha1(
                        json.dumps(index, sort_keys=True).encode()
                    ).hexdigest()[:12],
                    "skill_count": len(index),
                    "skills": index,
                },
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        (d / "ATTRIBUTION.md").write_text("".join(attr_lines), encoding="utf-8")
        print(f"{domain}: {len(index)} skills")

    # blank pack
    blank = PACKS / "blank"
    blank.mkdir(exist_ok=True)
    (blank / "skill_index.json").write_text(
        json.dumps({"domain": "blank", "pack_version": "0", "skill_count": 0, "skills": []}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    (blank / "ATTRIBUTION.md").write_text(
        "# Blank agent\n\nNo domain corpus — trains from missions only.\n", encoding="utf-8"
    )


def ensure_core_playbooks() -> None:
    """Ensure each specialist domain has at least one Mokaid SOP playbook."""
    stubs = {
        "security": "# Security playbook\n\nThreat-model first. Prefer least privilege, secret hygiene, and verifiable fixes.\n",
        "devops": "# DevOps playbook\n\nAutomate safely. Measure deploy health. Document runbooks and rollbacks.\n",
        "support_cs": "# Support & CS playbook\n\nEmpathy + clarity. Capture issue, impact, repro, and next update time.\n",
        "media_video": "# Media & video playbook\n\nBrief → script → assets → edit → captions → delivery checklist.\n",
    }
    for domain, body in stubs.items():
        path = PACKS / domain / f"{domain.replace('_', '-')}-playbook.md"
        if not path.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(body, encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-clone", action="store_true")
    ap.add_argument("--skip-api", action="store_true")
    args = ap.parse_args()

    clone_repos(skip=args.skip_clone)
    items = collect_from_repos()
    if not args.skip_api:
        items.extend(fetch_api_cards())
    print(f"raw items: {len(items)}")
    items = dedupe(items)
    print(f"after dedupe: {len(items)}")
    write_packs(items)
    ensure_core_playbooks()
    total = sum(
        json.loads((PACKS / d / "skill_index.json").read_text()).get("skill_count", 0)
        for d in DOMAINS
        if (PACKS / d / "skill_index.json").exists()
    )
    print(f"done: {total} indexed skills across {len(DOMAINS)} domains")


if __name__ == "__main__":
    main()
