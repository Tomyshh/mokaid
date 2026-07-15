/**
 * Office navigation data (raw GLB / Blender-local Y-up space).
 *
 * Generated / curated from office.blend layout. OfficeScene subtracts the
 * environment AABB center so runtime positions live in the centered frame.
 *
 * Regenerating: blender --background office.blend --python scripts/dump_blender_nav.py
 * then merge dumps into this module (named empties POI_* / DESK_* preferred).
 */

export interface NavPoint {
  x: number;
  z: number;
}

export interface NavNode extends NavPoint {
  id: string;
}

export interface NavEdge {
  from: string;
  to: string;
}

export interface Aabb2 {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type OfficePoiKind = "foosball" | "sofa" | "coffee";

export type SecondaryActivity =
  | "walking"
  | "preparing_coffee"
  | "playing_foosball"
  | "sitting_sofa"
  | "scrolling"
  | "stretching"
  | "looking_around"
  | null;

export interface OfficePoiSlot {
  id: string;
  position: NavPoint;
  /** Radians, Babylon Y rotation (0 faces +Z). */
  facing: number;
  animation: SecondaryActivity;
  /** Vertical root offset while seated (meters). Sit clip handles hip drop. */
  lift?: number;
}

export interface OfficePoi {
  id: string;
  kind: OfficePoiKind;
  capacity: number;
  slots: OfficePoiSlot[];
  /** Approach points in aisle space before locking a slot. */
  approach: NavPoint[];
  /** Optional queue positions when all slots are taken. */
  queueSlots?: NavPoint[];
}

export interface FindPathOptions {
  /** Allow the final point inside an obstacle (sofa sit snap). */
  allowGoalInObstacle?: boolean;
}

/** Agent collision radius used to inflate obstacle AABBs (meters). */
export const AGENT_RADIUS = 0.35;

/** Max agents that share the 3D office (one desk each). */
export const MAX_OFFICE_SEATS = 9;

/**
 * Desk seats in raw GLB space (before centering).
 * Index 0..8 maps 1:1 to agent.seat_index.
 */
export const OFFICE_DESK_SLOTS: NavPoint[] = [
  { x: -5.169, z: 0.76 },
  { x: -5.169, z: -2.0 },
  { x: -1.681, z: -3.42 },
  { x: -2.682, z: -0.66 },
  { x: 2.032, z: -2.82 },
  { x: 0.899, z: 0.34 },
  { x: 5.72, z: 0.17 },
  { x: 0.284, z: 3.18 },
  { x: -2.913, z: 2.56 },
];

/** Approximate flat floor height (Y) once the GLB is planted at y=0. */
export const OFFICE_FLOOR_Y = 0;

/**
 * Exterior walkable polygon (office footprint, counterclockwise).
 * Used for point-in-floor tests; graphs still drive pathfinding.
 */
export const OFFICE_WALKABLE_POLYGON: NavPoint[] = [
  { x: -6.4, z: -6.4 },
  { x: 6.6, z: -6.4 },
  { x: 6.8, z: 5.6 },
  { x: -6.2, z: 5.6 },
];

const R = AGENT_RADIUS;

/**
 * Furniture AABBs inflated by AGENT_RADIUS. Agents must not path through these.
 * Calibrated from office.blend mesh bounds (glTF Y-up).
 */
export const OFFICE_OBSTACLES: Aabb2[] = [
  // Left desk cluster (keep aisles at x≈-5.6 and z≈-0.8 clear)
  { minX: -5.5, maxX: -4.5, minZ: -2.5, maxZ: 1.2 },
  // Center-left desks
  { minX: -3.1, maxX: -1.3, minZ: -3.7, maxZ: -0.1 },
  { minX: -3.3, maxX: -2.0, minZ: 2.0, maxZ: 3.1 },
  // Center desks
  { minX: 0.4, maxX: 1.4, minZ: -0.3, maxZ: 0.9 },
  { minX: 1.5, maxX: 2.6, minZ: -3.3, maxZ: -2.2 },
  // Right desks
  { minX: 5.1, maxX: 6.3, minZ: -0.4, maxZ: 0.8 },
  // Kitchenette counter Cube.002
  { minX: -3.25 - R, maxX: -0.73 + R, minZ: -6.44 - R, maxZ: -5.65 + R },
  // Main sofa Cube.021
  { minX: 0.92 - R, maxX: 2.66 + R, minZ: -6.35 - R, maxZ: -5.64 + R },
  // Back-left shelving / secondary sofa Cube.012
  { minX: -6.49 - R, maxX: -4.46 + R, minZ: -6.38 - R, maxZ: -5.74 + R },
  // Back-right Rack
  { minX: 5.12 - R, maxX: 7.14 + R, minZ: -6.48 - R, maxZ: -5.8 + R },
  // Foosball soccer table.001 (center ≈ 1.85, 4.67)
  { minX: 1.42 - R, maxX: 2.27 + R, minZ: 4.13 - R, maxZ: 5.21 + R },
  // Meeting table 2 + surrounding chairs / photocopier
  { minX: 3.9, maxX: 6.55, minZ: 2.4, maxZ: 5.1 },
];

/** Graph nodes covering every aisle agents can patrol. */
export const OFFICE_NAV_NODES: NavNode[] = [
  { id: "nw", x: -5.6, z: -5.2 },
  { id: "n_lounge", x: -3.5, z: -5.2 },
  { id: "n_mid", x: -0.5, z: -5.2 },
  { id: "n_sofa", x: 1.8, z: -5.2 },
  { id: "ne", x: 5.4, z: -5.2 },
  { id: "w_aisle", x: -5.6, z: -0.8 },
  { id: "mid_w", x: -3.0, z: -1.6 },
  { id: "mid_c", x: 0.4, z: -1.8 },
  { id: "mid_e", x: 3.5, z: -1.4 },
  { id: "e_aisle", x: 5.5, z: -0.4 },
  { id: "sw", x: -5.4, z: 3.2 },
  { id: "s_mid", x: -1.0, z: 3.4 },
  { id: "s_coffee", x: 2.2, z: 3.4 },
  { id: "se", x: 4.6, z: 2.6 },
  // Foosball: stand on short (X) sides — long axis is Z.
  { id: "foosball_a", x: 0.97, z: 4.67 },
  { id: "foosball_b", x: 2.72, z: 4.67 },
  { id: "foosball_q", x: 1.85, z: 3.55 },
  // Standing points in front of the main sofa cushions (aisle, walkable)
  { id: "sofa_a", x: 1.27, z: -5.25 },
  { id: "sofa_b", x: 1.79, z: -5.25 },
  { id: "sofa_c", x: 2.31, z: -5.25 },
  // In front of the kitchenette / coffee machine
  { id: "coffee", x: -1.99, z: -5.2 },
  // Desk approach nodes (near each seat, in aisle)
  { id: "desk0", x: -4.6, z: 0.76 },
  { id: "desk1", x: -4.6, z: -2.0 },
  { id: "desk2", x: -1.0, z: -3.42 },
  { id: "desk3", x: -2.0, z: -0.66 },
  { id: "desk4", x: 2.6, z: -2.82 },
  { id: "desk5", x: 1.5, z: 0.34 },
  { id: "desk6", x: 5.1, z: 0.17 },
  { id: "desk7", x: 0.9, z: 3.18 },
  { id: "desk8", x: -2.2, z: 2.56 },
];

/** Undirected edges between nav nodes (aisles only — never through furniture). */
export const OFFICE_NAV_EDGES: NavEdge[] = [
  { from: "nw", to: "n_lounge" },
  { from: "n_lounge", to: "n_mid" },
  { from: "n_mid", to: "n_sofa" },
  { from: "n_sofa", to: "ne" },
  { from: "nw", to: "w_aisle" },
  { from: "ne", to: "e_aisle" },
  { from: "w_aisle", to: "mid_w" },
  { from: "mid_w", to: "mid_c" },
  { from: "mid_c", to: "mid_e" },
  { from: "mid_e", to: "e_aisle" },
  { from: "w_aisle", to: "sw" },
  { from: "sw", to: "s_mid" },
  { from: "s_mid", to: "s_coffee" },
  { from: "s_coffee", to: "se" },
  { from: "se", to: "e_aisle" },
  // Foosball approach from south only — no edge through the table.
  { from: "s_coffee", to: "foosball_q" },
  { from: "foosball_q", to: "foosball_a" },
  { from: "foosball_q", to: "foosball_b" },
  { from: "n_sofa", to: "sofa_a" },
  { from: "n_sofa", to: "sofa_b" },
  { from: "n_sofa", to: "sofa_c" },
  { from: "sofa_a", to: "sofa_b" },
  { from: "sofa_b", to: "sofa_c" },
  { from: "n_lounge", to: "coffee" },
  { from: "n_mid", to: "coffee" },
  { from: "w_aisle", to: "desk0" },
  { from: "w_aisle", to: "desk1" },
  { from: "mid_w", to: "desk2" },
  { from: "mid_w", to: "desk3" },
  { from: "mid_e", to: "desk4" },
  { from: "mid_c", to: "desk5" },
  { from: "e_aisle", to: "desk6" },
  { from: "s_mid", to: "desk7" },
  { from: "sw", to: "desk8" },
  { from: "mid_c", to: "s_mid" },
  { from: "n_mid", to: "mid_c" },
];

export const OFFICE_POIS: OfficePoi[] = [
  {
    id: "foosball",
    kind: "foosball",
    capacity: 2,
    // soccer table.001 center ≈ (1.85, 4.67); long axis Z — players on ±X.
    approach: [{ x: 1.85, z: 3.55 }],
    queueSlots: [{ x: 1.0, z: 3.3 }],
    slots: [
      {
        id: "foosball_a",
        position: { x: 0.97, z: 4.67 },
        facing: Math.PI / 2,
        animation: "playing_foosball",
      },
      {
        id: "foosball_b",
        position: { x: 2.72, z: 4.67 },
        facing: -Math.PI / 2,
        animation: "playing_foosball",
      },
    ],
  },
  {
    id: "sofa_main",
    kind: "sofa",
    capacity: 3,
    // Cube.021 cushions; approach stays in the walkable aisle.
    approach: [{ x: 1.79, z: -5.2 }],
    slots: [
      {
        id: "sofa_a",
        position: { x: 1.27, z: -6.07 },
        facing: 0,
        animation: "sitting_sofa",
        lift: 0.05,
      },
      {
        id: "sofa_b",
        position: { x: 1.79, z: -6.07 },
        facing: 0,
        animation: "sitting_sofa",
        lift: 0.05,
      },
      {
        id: "sofa_c",
        position: { x: 2.31, z: -6.07 },
        facing: 0,
        animation: "sitting_sofa",
        lift: 0.05,
      },
    ],
  },
  {
    id: "coffee",
    kind: "coffee",
    capacity: 1,
    approach: [{ x: -1.99, z: -4.7 }],
    queueSlots: [
      { x: -1.0, z: -4.6 },
      { x: -0.5, z: -4.3 },
    ],
    slots: [
      {
        id: "coffee_active",
        position: { x: -1.99, z: -5.2 },
        facing: Math.PI,
        animation: "preparing_coffee",
      },
    ],
  },
];

export function dist2(a: NavPoint, b: NavPoint): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export function pointInPolygon(p: NavPoint, poly: NavPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i].z;
    const yj = poly[j].z;
    const xi = poly[i].x;
    const xj = poly[j].x;
    const intersect =
      yi > p.z !== yj > p.z && p.x < ((xj - xi) * (p.z - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointHitsObstacle(p: NavPoint, obstacles: Aabb2[] = OFFICE_OBSTACLES): boolean {
  for (const o of obstacles) {
    if (p.x >= o.minX && p.x <= o.maxX && p.z >= o.minZ && p.z <= o.maxZ) return true;
  }
  return false;
}

export function isWalkable(p: NavPoint): boolean {
  if (!pointInPolygon(p, OFFICE_WALKABLE_POLYGON)) return false;
  if (pointHitsObstacle(p)) return false;
  return true;
}

/** Sample along a segment; true if every sample is walkable (or on a known nav edge). */
export function segmentIsWalkable(a: NavPoint, b: NavPoint, steps = 8): boolean {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    if (!isWalkable(p)) return false;
  }
  return true;
}

/**
 * Push a candidate point out of the nearest obstacle AABB (axis-aligned slide).
 * Returns the original point when already clear.
 */
export function resolveCollision(p: NavPoint, obstacles: Aabb2[] = OFFICE_OBSTACLES): NavPoint {
  let { x, z } = p;
  for (const o of obstacles) {
    if (x < o.minX || x > o.maxX || z < o.minZ || z > o.maxZ) continue;
    const left = x - o.minX;
    const right = o.maxX - x;
    const bottom = z - o.minZ;
    const top = o.maxZ - z;
    const min = Math.min(left, right, bottom, top);
    if (min === left) x = o.minX - 0.02;
    else if (min === right) x = o.maxX + 0.02;
    else if (min === bottom) z = o.minZ - 0.02;
    else z = o.maxZ + 0.02;
  }
  return { x, z };
}

function buildAdjacency(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const n of OFFICE_NAV_NODES) map.set(n.id, []);
  for (const e of OFFICE_NAV_EDGES) {
    map.get(e.from)?.push(e.to);
    map.get(e.to)?.push(e.from);
  }
  return map;
}

const ADJACENCY = buildAdjacency();
const NODE_BY_ID = new Map(OFFICE_NAV_NODES.map((n) => [n.id, n]));

export function nearestNavNode(x: number, z: number, preferWalkable = true): NavNode {
  let best = OFFICE_NAV_NODES[0];
  let bestD = Infinity;
  for (const n of OFFICE_NAV_NODES) {
    if (preferWalkable && pointHitsObstacle(n)) continue;
    const d = dist2(n, { x, z });
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

/** A* on the curated aisle graph. Returns polyline of world points including start. */
export function findPath(from: NavPoint, to: NavPoint, opts: FindPathOptions = {}): NavPoint[] {
  const start = nearestNavNode(from.x, from.z);
  const goal = nearestNavNode(to.x, to.z);
  if (start.id === goal.id) {
    return finishPath([from], to, opts);
  }

  const open = new Set<string>([start.id]);
  const came = new Map<string, string>();
  const gScore = new Map<string, number>([[start.id, 0]]);
  const fScore = new Map<string, number>([[start.id, Math.sqrt(dist2(start, goal))]]);

  while (open.size > 0) {
    let current = "";
    let bestF = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = id;
      }
    }
    if (current === goal.id) {
      const ids = [current];
      while (came.has(ids[0])) ids.unshift(came.get(ids[0])!);
      const pts: NavPoint[] = [from];
      for (const id of ids) {
        const n = NODE_BY_ID.get(id)!;
        pts.push({ x: n.x, z: n.z });
      }
      return finishPath(pts, to, opts);
    }

    open.delete(current);
    const curNode = NODE_BY_ID.get(current)!;
    for (const next of ADJACENCY.get(current) ?? []) {
      const nextNode = NODE_BY_ID.get(next)!;
      const tentative = (gScore.get(current) ?? Infinity) + Math.sqrt(dist2(curNode, nextNode));
      if (tentative < (gScore.get(next) ?? Infinity)) {
        came.set(next, current);
        gScore.set(next, tentative);
        fScore.set(next, tentative + Math.sqrt(dist2(nextNode, goal)));
        open.add(next);
      }
    }
  }

  // No graph path — stop at the nearest walkable start node (never cut furniture).
  return [{ x: from.x, z: from.z }, { x: start.x, z: start.z }];
}

function finishPath(pts: NavPoint[], to: NavPoint, opts: FindPathOptions): NavPoint[] {
  if (opts.allowGoalInObstacle || isWalkable(to) || !pointHitsObstacle(to)) {
    pts.push(to);
    return pts;
  }
  // Goal inside furniture without sit exception: stop at last walkable node.
  return pts;
}

export function floorYAt(_x: number, _z: number): number {
  return OFFICE_FLOOR_Y;
}

export function poiById(id: string): OfficePoi | undefined {
  return OFFICE_POIS.find((p) => p.id === id);
}

export function secondaryActivityLabel(activity: SecondaryActivity): string | null {
  switch (activity) {
    case "walking":
      return "Walking";
    case "preparing_coffee":
      return "Preparing coffee";
    case "playing_foosball":
      return "Playing foosball";
    case "sitting_sofa":
      return "Sitting on sofa";
    case "scrolling":
      return "On phone";
    case "stretching":
      return "Stretching";
    case "looking_around":
      return "Looking around";
    default:
      return null;
  }
}
