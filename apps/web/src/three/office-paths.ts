/**
 * Patrol / idle helpers built on office-navdata.
 * Patrol loops are routed through the occupancy-grid pathfinder so every
 * segment is guaranteed obstacle-free (chairs, lamps, walls, planters…).
 */

import { Vector3 } from "@babylonjs/core";
import {
  OFFICE_DESK_SLOTS,
  OFFICE_NAV_NODES,
  findPath,
  type NavPoint,
  type SecondaryActivity,
} from "./office-navdata";

export { OFFICE_DESK_SLOTS };

export type IdleActivity =
  | "coffee"
  | "scrolling"
  | "stretch"
  | "look"
  | "playing"
  | "sitting";

export interface PathWaypoint {
  x: number;
  z: number;
  activity?: IdleActivity;
}

export interface OfficePath {
  id: string;
  waypoints: PathWaypoint[];
  loop: boolean;
}

const NODE = new Map(OFFICE_NAV_NODES.map((n) => [n.id, { x: n.x, z: n.z }]));

/** Route through anchor ids; every leg uses the grid pathfinder. */
function chain(ids: string[]): PathWaypoint[] {
  const out: PathWaypoint[] = [];
  for (let k = 0; k < ids.length - 1; k++) {
    const a = NODE.get(ids[k])!;
    const b = NODE.get(ids[k + 1])!;
    const leg = findPath(a, b);
    for (const p of leg) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 0.05) {
        out.push({ x: p.x, z: p.z });
      }
    }
  }
  return out;
}

/** Patrol loops derived from the aisle anchors (obstacle-free by build). */
export const OFFICE_PATHS: OfficePath[] = [
  {
    id: "perimeter",
    loop: true,
    waypoints: chain([
      "nw", "n_lounge", "n_mid", "n_sofa", "ne", "e_door", "se",
      "s_coffee", "s_mid", "sw", "w_aisle", "nw",
    ]),
  },
  {
    id: "mid-aisle",
    loop: true,
    waypoints: chain([
      "w_aisle", "mid_w", "mid_c", "mid_e", "e_door", "mid_e", "mid_c", "mid_w", "w_aisle",
    ]),
  },
  {
    id: "back-aisle",
    loop: true,
    waypoints: chain(["sw", "s_mid", "s_coffee", "se", "s_coffee", "s_mid", "sw"]),
  },
];

export function pathToVectors(path: OfficePath): Vector3[] {
  return path.waypoints.map((wp) => new Vector3(wp.x, 0, wp.z));
}

export function pickPathNear(
  x: number,
  z: number,
  excludeId?: string,
  paths: OfficePath[] = OFFICE_PATHS,
): OfficePath {
  let best = paths[0];
  let bestDist = Infinity;
  for (const path of paths) {
    if (path.id === excludeId) continue;
    const wp = path.waypoints[0];
    const d = (wp.x - x) ** 2 + (wp.z - z) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = path;
    }
  }
  return best;
}

export function nearestWaypointIndex(path: OfficePath, x: number, z: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.waypoints.length; i++) {
    const wp = path.waypoints[i];
    const d = (wp.x - x) ** 2 + (wp.z - z) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export function pathFromPoints(id: string, pts: NavPoint[]): OfficePath {
  return { id, loop: false, waypoints: pts.map((p) => ({ x: p.x, z: p.z })) };
}

export function routeTo(x: number, z: number, target: NavPoint): OfficePath {
  return pathFromPoints(`route-${Date.now()}`, findPath({ x, z }, target));
}

export function patrolNodeIds(): string[] {
  return OFFICE_NAV_NODES.map((n) => n.id);
}

export function activityToSecondary(activity?: IdleActivity): SecondaryActivity {
  switch (activity) {
    case "coffee":
      return "preparing_coffee";
    case "playing":
      return "playing_foosball";
    case "sitting":
      return "sitting_sofa";
    case "scrolling":
      return "scrolling";
    case "stretch":
      return "stretching";
    case "look":
      return "looking_around";
    default:
      return null;
  }
}
