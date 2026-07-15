/**
 * Unit tests for office navigation graph / walkability invariants.
 */
import { describe, expect, it } from "vitest";
import {
  findPath,
  isWalkable,
  OFFICE_DESK_SLOTS,
  OFFICE_NAV_EDGES,
  OFFICE_NAV_NODES,
  OFFICE_OBSTACLES,
  OFFICE_POIS,
  pointHitsObstacle,
  resolveCollision,
  segmentIsWalkable,
} from "./office-navdata";

describe("office-navdata", () => {
  it("exposes nine unique desk seats", () => {
    expect(OFFICE_DESK_SLOTS).toHaveLength(9);
    const keys = new Set(OFFICE_DESK_SLOTS.map((s) => `${s.x.toFixed(3)},${s.z.toFixed(3)}`));
    expect(keys.size).toBe(9);
  });

  it("keeps every nav node connected by at least one edge", () => {
    const connected = new Set<string>();
    for (const e of OFFICE_NAV_EDGES) {
      connected.add(e.from);
      connected.add(e.to);
    }
    for (const n of OFFICE_NAV_NODES) {
      expect(connected.has(n.id)).toBe(true);
    }
  });

  it("finds a path between opposite aisles", () => {
    const path = findPath({ x: -5.6, z: -5.2 }, { x: 5.5, z: -0.4 });
    expect(path.length).toBeGreaterThan(2);
  });

  it("rejects points inside obstacle AABBs", () => {
    expect(pointHitsObstacle({ x: -5.0, z: 0 })).toBe(true);
    expect(isWalkable({ x: -5.6, z: -5.2 })).toBe(true);
  });

  it("keeps aisle graph coherent for pathfinding", () => {
    const path = findPath({ x: -5.6, z: -5.2 }, { x: 4.6, z: 2.6 });
    expect(path.length).toBeGreaterThan(3);
    const back = findPath({ x: -5.4, z: 3.2 }, { x: 5.5, z: -0.4 });
    expect(back.length).toBeGreaterThan(3);
    expect(pointHitsObstacle({ x: -5.0, z: 0 })).toBe(true);
    expect(segmentIsWalkable({ x: -5.6, z: -5.2 }, { x: -0.5, z: -5.2 })).toBe(true);
  });

  it("defines foosball, sofa and coffee POIs with capacity", () => {
    expect(OFFICE_POIS.find((p) => p.kind === "foosball")?.capacity).toBe(2);
    expect(OFFICE_POIS.find((p) => p.kind === "sofa")?.capacity).toBe(3);
    expect(OFFICE_POIS.find((p) => p.kind === "coffee")?.capacity).toBe(1);
  });

  it("places foosball on calibrated blend coords (not through the table)", () => {
    const fb = OFFICE_POIS.find((p) => p.kind === "foosball")!;
    for (const slot of fb.slots) {
      expect(pointHitsObstacle(slot.position)).toBe(false);
      expect(slot.position.x).toBeGreaterThan(0.5);
      expect(slot.position.x).toBeLessThan(3.2);
    }
    const through = OFFICE_NAV_EDGES.some(
      (e) =>
        (e.from === "foosball_a" && e.to === "foosball_b") ||
        (e.from === "foosball_b" && e.to === "foosball_a"),
    );
    expect(through).toBe(false);
    expect(segmentIsWalkable(fb.slots[0].position, fb.slots[1].position)).toBe(false);
  });

  it("does not use a direct-line fallback through furniture", () => {
    const insideMeeting = { x: 5.7, z: 3.9 };
    expect(pointHitsObstacle(insideMeeting)).toBe(true);
    const path = findPath({ x: -5.6, z: -0.8 }, insideMeeting);
    expect(path.some((p) => pointHitsObstacle(p))).toBe(false);
  });

  it("allows sofa sit snap as the final path point", () => {
    const sofa = OFFICE_POIS.find((p) => p.kind === "sofa")!.slots[0];
    expect(pointHitsObstacle(sofa.position)).toBe(true);
    const path = findPath({ x: 1.8, z: -5.2 }, sofa.position, { allowGoalInObstacle: true });
    expect(path[path.length - 1]).toEqual(sofa.position);
  });

  it("resolveCollision slides a point out of an obstacle", () => {
    const inside = { x: 5.7, z: 3.9 };
    expect(pointHitsObstacle(inside)).toBe(true);
    const fixed = resolveCollision(inside);
    expect(pointHitsObstacle(fixed)).toBe(false);
    expect(OFFICE_OBSTACLES.length).toBeGreaterThan(8);
  });
});
