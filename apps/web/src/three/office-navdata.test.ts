/**
 * Navigation invariants: agents must never cross furniture, walls, chairs,
 * lamps or planters. Obstacles are generated from office.blend; paths run on
 * the occupancy grid.
 */
import { describe, expect, it } from "vitest";
import {
  findPath,
  isWalkable,
  OFFICE_DESK_SLOTS,
  OFFICE_NAV_NODES,
  OFFICE_OBSTACLES,
  OFFICE_POIS,
  pointHitsObstacle,
  resolveCollision,
  segmentIsWalkable,
} from "./office-navdata";
import { OFFICE_PATHS } from "./office-paths";

/** Every consecutive pair of a polyline must be clear of obstacles. */
function pathIsClear(pts: { x: number; z: number }[], skipLastLeg = false): boolean {
  const end = skipLastLeg ? pts.length - 2 : pts.length - 1;
  for (let i = 0; i < end; i++) {
    if (!segmentIsWalkable(pts[i], pts[i + 1])) return false;
  }
  return true;
}

describe("office-navdata", () => {
  it("exposes nine unique desk seats", () => {
    expect(OFFICE_DESK_SLOTS).toHaveLength(9);
    const keys = new Set(OFFICE_DESK_SLOTS.map((s) => `${s.x.toFixed(3)},${s.z.toFixed(3)}`));
    expect(keys.size).toBe(9);
  });

  it("keeps every aisle anchor walkable", () => {
    for (const n of OFFICE_NAV_NODES) {
      expect(isWalkable(n), `anchor ${n.id} blocked`).toBe(true);
    }
  });

  it("covers the full furniture inventory (walls, desks, chairs, planters…)", () => {
    expect(OFFICE_OBSTACLES.length).toBeGreaterThan(50);
    // Walls with openings are split, not one giant box.
    const giant = OFFICE_OBSTACLES.filter(
      (o) => (o.maxX - o.minX) * (o.maxZ - o.minZ) > 20,
    );
    expect(giant).toHaveLength(0);
  });

  it("reaches every desk seat from the coffee corner without crossing furniture", () => {
    const from = { x: -1.99, z: -4.7 };
    for (const [i, seat] of OFFICE_DESK_SLOTS.entries()) {
      const path = findPath(from, seat, { allowGoalInObstacle: true });
      expect(path.length, `desk ${i} unreachable`).toBeGreaterThan(1);
      // Whole path minus the final in-desk snap must be clear.
      expect(pathIsClear(path, true), `desk ${i} path crosses furniture`).toBe(true);
      expect(path[path.length - 1]).toEqual(seat);
    }
  });

  it("reaches every POI slot from every desk", () => {
    for (const [i, seat] of OFFICE_DESK_SLOTS.entries()) {
      for (const poi of OFFICE_POIS) {
        for (const slot of poi.slots) {
          const allow = slot.animation === "sitting_sofa";
          const path = findPath(seat, slot.position, { allowGoalInObstacle: allow });
          expect(path.length, `desk ${i} -> ${slot.id} unreachable`).toBeGreaterThan(1);
          // Skip first leg (leaving the desk) and last leg when sitting.
          const inner = path.slice(1);
          expect(
            pathIsClear(inner, allow),
            `desk ${i} -> ${slot.id} crosses furniture`,
          ).toBe(true);
        }
      }
    }
  });

  it("keeps foosball & coffee stand-points walkable, sofa seats inside cushions", () => {
    const foos = OFFICE_POIS.find((p) => p.kind === "foosball")!;
    for (const slot of foos.slots) {
      expect(isWalkable(slot.position), `${slot.id} not walkable`).toBe(true);
    }
    const coffee = OFFICE_POIS.find((p) => p.kind === "coffee")!;
    expect(isWalkable(coffee.slots[0].position)).toBe(true);
    const sofa = OFFICE_POIS.find((p) => p.kind === "sofa")!;
    for (const slot of sofa.slots) {
      expect(pointHitsObstacle(slot.position), `${slot.id} should be on cushion`).toBe(true);
    }
    for (const poi of OFFICE_POIS) {
      for (const a of poi.approach) {
        expect(isWalkable(a), `approach of ${poi.id} blocked`).toBe(true);
      }
      for (const q of poi.queueSlots ?? []) {
        expect(isWalkable(q), `queue of ${poi.id} blocked`).toBe(true);
      }
    }
  });

  it("separates the two foosball players by the table (no straight line through)", () => {
    const foos = OFFICE_POIS.find((p) => p.kind === "foosball")!;
    expect(segmentIsWalkable(foos.slots[0].position, foos.slots[1].position)).toBe(false);
  });

  it("keeps every patrol loop segment obstacle-free", () => {
    for (const path of OFFICE_PATHS) {
      expect(path.waypoints.length).toBeGreaterThan(2);
      const pts = path.loop ? [...path.waypoints, path.waypoints[0]] : path.waypoints;
      for (let i = 0; i < pts.length - 1; i++) {
        expect(
          segmentIsWalkable(pts[i], pts[i + 1]),
          `${path.id} leg ${i} crosses furniture`,
        ).toBe(true);
      }
    }
  });

  it("never returns a path crossing furniture even for blocked goals", () => {
    const insideMeetingTable = { x: 5.7, z: 3.9 };
    expect(pointHitsObstacle(insideMeetingTable)).toBe(true);
    const path = findPath({ x: -5.85, z: -0.8 }, insideMeetingTable);
    // Goal is dropped (not allowGoalInObstacle) and the rest stays clear.
    expect(pathIsClear(path)).toBe(true);
  });

  it("resolveCollision slides a point out of any obstacle", () => {
    for (const probe of [
      { x: 5.7, z: 3.9 },   // meeting table
      { x: 1.8, z: 4.7 },   // foosball table
      { x: -5.0, z: 0.7 },  // desk0
      { x: 1.79, z: -6.0 }, // sofa
    ]) {
      expect(pointHitsObstacle(probe)).toBe(true);
      expect(pointHitsObstacle(resolveCollision(probe))).toBe(false);
    }
  });

  it("defines foosball, sofa and coffee POIs with capacity", () => {
    expect(OFFICE_POIS.find((p) => p.kind === "foosball")?.capacity).toBe(2);
    expect(OFFICE_POIS.find((p) => p.kind === "sofa")?.capacity).toBe(3);
    expect(OFFICE_POIS.find((p) => p.kind === "coffee")?.capacity).toBe(1);
  });
});
