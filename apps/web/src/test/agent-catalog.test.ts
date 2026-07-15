import { describe, expect, it } from "vitest";
import type { CreateAgentPayload, AgentCatalog } from "@/api/types";

describe("agent catalog contracts", () => {
  it("accepts a strict create payload without progression fields", () => {
    const payload: CreateAgentPayload = {
      display_name: "Nova",
      kind: "ai",
      archetype_key: "developer",
      boost_key: "boost_l3",
      knowledge_brief: "Prefers TypeScript",
    };

    expect(payload.display_name).toBe("Nova");
    expect(payload).not.toHaveProperty("level");
    expect(payload).not.toHaveProperty("skills");
  });

  it("describes free archetypes and credit boosts", () => {
    const catalog: AgentCatalog = {
      archetypes: [
        {
          key: "generalist",
          name: "Generalist",
          domain: null,
          description: "Starts from scratch",
          role_title: "Generalist",
          department: "Operations",
          skills: [
            { name: "research", level: 40 },
            { name: "planning", level: 40 },
          ],
        },
      ],
      boosts: [
        {
          key: "boost_l3",
          name: "Head start",
          description: "Start at level 3",
          credits: 500,
          target_level: 3,
          skill_bonus: 15,
        },
      ],
    };

    expect(catalog.archetypes).toHaveLength(1);
    expect(catalog.boosts[0].credits).toBe(500);
  });
});
