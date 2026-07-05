#!/usr/bin/env node
/**
 * Downloads brand-colored SVG logos (Simple Icons default palette)
 * into public/logos/brands/ for integration cards.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const slugs = [
  "slack",
  "googledrive",
  "gmail",
  "notion",
  "trello",
  "github",
  "zapier",
  "hubspot",
  "microsoftteams",
  "dropbox",
  "stripe",
  "jira",
  "linear",
  "googlecalendar",
  "googledocs",
  "googlesheets",
  "googlemeet",
];

const legacyAliases = {
  amazonwebservices: "amazonaws",
  microsoft365: "microsoftoffice",
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "logos", "brands");
await mkdir(outDir, { recursive: true });

let ok = 0;
const missing = [];

for (const slug of slugs) {
  try {
    const res = await fetch(`https://cdn.simpleicons.org/${slug}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let svg = await res.text();
    if (slug === "slack" && !svg.includes("fill=")) {
      svg = svg.replace("<svg ", '<svg fill="#4A154B" ');
    }
    await writeFile(join(outDir, `${slug}.svg`), svg);
    ok += 1;
  } catch {
    try {
      const legacy = legacyAliases[slug] ?? slug;
      const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@9/icons/${legacy}.svg`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(join(outDir, `${slug}.svg`), await res.text());
      ok += 1;
    } catch {
      missing.push(slug);
    }
  }
}

console.log(`Downloaded ${ok}/${slugs.length} brand logos to public/logos/brands/`);
if (missing.length) console.log(`Missing: ${missing.join(", ")}`);
