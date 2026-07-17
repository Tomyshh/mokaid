import type { AgentArchetype } from "@/api/types";

const EXTRA_ALIASES: Record<string, string[]> = {
  developer: ["code", "coding", "software", "github", "engineering", "api", "typescript", "python"],
  data_scientist: ["data", "analytics", "sql", "ml", "metrics", "spreadsheet"],
  research: ["research", "competitor", "literature", "arxiv"],
  finance: ["finance", "budget", "forecast", "accounting", "revenue"],
  marketing: ["marketing", "seo", "campaign", "growth", "brand"],
  sales: ["sales", "pipeline", "crm", "outbound", "deal"],
  sciences: ["science", "lab", "biology", "chemistry", "physics", "scientific"],
  legal: ["legal", "contract", "compliance", "gdpr", "policy"],
  ops_hr: ["ops", "hr", "hiring", "sop", "people", "operations"],
  product: ["product", "roadmap", "prd", "prioritization"],
  design: ["design", "figma", "ux", "ui", "branding"],
  writer_content: ["writing", "content", "copy", "blog", "slides", "presentation"],
  security: ["security", "vuln", "owasp", "appsec", "threat"],
  devops: ["devops", "kubernetes", "docker", "terraform", "cicd", "sre"],
  support_cs: ["support", "customer", "ticket", "helpdesk", "success"],
  media_video: ["video", "media", "podcast", "youtube", "audio"],
};

/** Score specialist packs against a user brief (company + agent needs). */
export function recommendAgentPacks(
  archetypes: AgentArchetype[],
  brief: string,
  limit = 3,
): AgentArchetype[] {
  const text = brief.toLowerCase();
  const specialists = archetypes.filter(
    (a) => a.tier === "specialist" || (a.tier == null && a.key !== "blank"),
  );
  if (!text.trim()) return specialists.slice(0, limit);

  const scored = specialists.map((a) => {
    let score = 0;
    const extras = EXTRA_ALIASES[a.key] ?? [];
    const hay = [
      a.key,
      a.name,
      a.description,
      a.domain ?? "",
      ...(a.tags ?? []),
      ...extras,
    ]
      .join(" ")
      .toLowerCase();

    for (const token of hay.split(/[^a-z0-9+&]+/).filter((t) => t.length > 2)) {
      if (text.includes(token)) score += 2;
    }
    for (const tag of [...(a.tags ?? []), ...extras]) {
      if (text.includes(tag.toLowerCase())) score += 4;
    }
    // prefer packs with richer corpora when scores tie
    score += Math.min(3, Math.floor((a.corpus_doc_count ?? 0) / 50));
    return { a, score };
  });

  scored.sort((x, y) => y.score - x.score);
  const positive = scored.filter((s) => s.score > 0).map((s) => s.a);
  if (positive.length >= limit) return positive.slice(0, limit);
  return scored.map((s) => s.a).slice(0, limit);
}
