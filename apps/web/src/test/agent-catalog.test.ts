import { describe, expect, it } from "vitest";
import type { CreateAgentPayload, AgentCatalog } from "@/api/types";
import { recommendAgentPacks } from "@/lib/recommend-agent-packs";

describe("agent catalog contracts", () => {
  it("accepts a strict create payload without progression fields", () => {
    const payload: CreateAgentPayload = {
      display_name: "Nova",
      kind: "ai",
      archetype_key: "developer",
      boost_key: "boost_l10",
      knowledge_brief: "Prefers TypeScript",
    };

    expect(payload.display_name).toBe("Nova");
    expect(payload).not.toHaveProperty("level");
    expect(payload).not.toHaveProperty("skills");
  });

  it("describes blank and specialist archetypes with L10 boost", () => {
    const catalog: AgentCatalog = {
      archetypes: [
        {
          key: "blank",
          name: "New agent",
          domain: null,
          tier: "blank",
          description: "Starts from scratch",
          role_title: "Trainee",
          department: "Operations",
          tags: ["blank"],
          corpus_doc_count: 0,
          skills: [
            { name: "research", level: 15 },
            { name: "planning", level: 15 },
          ],
        },
        {
          key: "developer",
          name: "Developer",
          domain: "code",
          tier: "specialist",
          description: "Coding specialist",
          role_title: "Software Engineer",
          department: "Engineering",
          tags: ["code", "github"],
          corpus_doc_count: 12,
          credits_for_specialist: 5000,
          skills: [{ name: "coding", level: 40 }],
        },
      ],
      boosts: [
        {
          key: "boost_l10",
          name: "Specialist ready",
          description: "Start at level 10",
          credits: 5000,
          target_level: 10,
          skill_bonus: 50,
        },
      ],
      specialist_boost_key: "boost_l10",
      specialist_credits: 5000,
    };

    expect(catalog.archetypes).toHaveLength(2);
    expect(catalog.boosts[0].credits).toBe(5000);
    expect(catalog.specialist_credits).toBe(5000);
  });

  it("recommends packs from a user brief", () => {
    const packs = recommendAgentPacks(
      [
        {
          key: "blank",
          name: "New agent",
          domain: null,
          tier: "blank",
          description: "",
          role_title: "Trainee",
          department: "Operations",
          skills: [],
          tags: [],
        },
        {
          key: "developer",
          name: "Developer",
          domain: "code",
          tier: "specialist",
          description: "coding github",
          role_title: "Software Engineer",
          department: "Engineering",
          skills: [],
          tags: ["code", "github", "software"],
        },
        {
          key: "finance",
          name: "Finance",
          domain: "finance",
          tier: "specialist",
          description: "budgeting",
          role_title: "Finance Analyst",
          department: "Finance",
          skills: [],
          tags: ["finance", "accounting"],
        },
      ],
      "We need a github coding agent for software delivery",
      2,
    );
    expect(packs[0].key).toBe("developer");
  });
});
