/**
 * Pre-traced patrol paths for the office scene.
 *
 * Waypoints are hand-placed in walkable aisles, avoiding:
 * - Desk pods (front-left ≈ -6,-5.5 / front-right ≈ 6,-5.5 / back-center ≈ 0,2)
 * - Glass meeting room (back-right corner, ≈ 9.5,7.5)
 * - Lounge sofa (back-left corner, ≈ -9.5,7.5)
 * - Foosball table (front-center, ≈ 0,-8.7)
 * - Walls (|x|>12.3, |z|>10.3)
 *
 * The full layout (desks + zones + these paths) is collision-validated by
 * scratchpad/layout_v3.mjs.
 */

import { Vector3 } from "@babylonjs/core";

export interface PathWaypoint {
  x: number;
  z: number;
  /** Optional pause activity at this stop. */
  activity?: "coffee" | "scrolling" | "stretch" | "look";
}

export interface OfficePath {
  id: string;
  waypoints: PathWaypoint[];
  loop: boolean;
}

/** All patrol routes — agents only move along these polylines. */
export const OFFICE_PATHS: OfficePath[] = [
  {
    // Big loop hugging the walls, dipping between the front pods and back pod.
    id: "perimeter",
    loop: true,
    waypoints: [
      { x: -11.5, z: -8.5 },
      { x: -11.5, z: 0 },
      { x: -11.5, z: 4.5 },
      { x: -5, z: 4.5 },
      { x: -2, z: -1.5 },
      { x: 2, z: -1.5 },
      { x: 5, z: 4.5 },
      { x: 11.5, z: 4.5 },
      { x: 11.5, z: 0 },
      { x: 11.5, z: -8.5 },
      { x: 8, z: -8.5 },
      { x: 2.5, z: -8.5 },
      { x: -2.5, z: -8.5 },
      { x: -8, z: -8.5 },
      { x: -11.5, z: -8.5 },
    ],
  },
  {
    // Straight aisle between the front pods (z≈-5.5) and back pod (z≈2).
    id: "mid-aisle",
    loop: true,
    waypoints: [
      { x: -11, z: -1.5 },
      { x: -6, z: -1.5 },
      { x: 0, z: -1.5 },
      { x: 6, z: -1.5 },
      { x: 11, z: -1.5 },
      { x: 6, z: -1.5 },
      { x: -6, z: -1.5 },
    ],
  },
  {
    // Aisle behind the back-center pod, along the two annex zones.
    id: "back-aisle",
    loop: true,
    waypoints: [
      { x: -6, z: 5.5 },
      { x: 0, z: 5.5 },
      { x: 6, z: 5.5 },
      { x: 6, z: 4.5 },
      { x: -6, z: 4.5 },
      { x: -6, z: 5.5 },
    ],
  },
  {
    id: "lounge-approach",
    loop: false,
    waypoints: [
      { x: -6, z: 4.5 },
      { x: -8, z: 5.5 },
      { x: -9.5, z: 5.2, activity: "stretch" },
      { x: -8, z: 5.5 },
      { x: -6, z: 4.5, activity: "look" },
    ],
  },
  {
    id: "meeting-approach",
    loop: false,
    waypoints: [
      { x: 6, z: 4.5 },
      { x: 8, z: 5.5 },
      { x: 9.5, z: 5.2, activity: "coffee" },
      { x: 8, z: 5.5 },
      { x: 6, z: 4.5, activity: "look" },
    ],
  },
  {
    id: "foosball-approach",
    loop: false,
    waypoints: [
      { x: -2.5, z: -8.5 },
      { x: -1.5, z: -7, activity: "look" },
      { x: 1.5, z: -7 },
      { x: 2.5, z: -8.5 },
      { x: -2.5, z: -8.5 },
    ],
  },
];

export type IdleActivity = "coffee" | "scrolling" | "stretch" | "look";

export function pathToVectors(path: OfficePath): Vector3[] {
  return path.waypoints.map((wp) => new Vector3(wp.x, 0, wp.z));
}

/** Pick the path whose first waypoint is closest to the agent. */
export function pickPathNear(x: number, z: number, excludeId?: string): OfficePath {
  let best = OFFICE_PATHS[0];
  let bestDist = Infinity;

  for (const path of OFFICE_PATHS) {
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

/** Index of the nearest waypoint on a given path. */
export function nearestWaypointIndex(path: OfficePath, x: number, z: number): number {
  let best = 0;
  let bestDist = Infinity;
  path.waypoints.forEach((wp, i) => {
    const d = (wp.x - x) ** 2 + (wp.z - z) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}
