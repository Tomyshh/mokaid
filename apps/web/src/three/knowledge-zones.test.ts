import { describe, expect, it } from "vitest";
import { OFFICE_ZONE_LAYOUT, zoneForCommunity } from "./knowledge-zones";

describe("knowledge-zones", () => {
  it("maps known office zones", () => {
    const zone = zoneForCommunity({
      id: "1",
      label: "Billing",
      slug: "billing",
      node_count: 3,
      god_score: 2,
      office_zone: "finance",
    });
    expect(zone.label).toBe("Finance");
    expect(zone.color).toBe(OFFICE_ZONE_LAYOUT.finance.color);
  });

  it("falls back to lobby", () => {
    const zone = zoneForCommunity({
      id: "2",
      label: "Misc",
      slug: "misc",
      node_count: 1,
      god_score: 0,
      office_zone: null,
    });
    expect(zone.label).toBe("Lobby");
  });
});
