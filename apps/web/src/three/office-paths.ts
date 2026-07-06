/**
 * Pre-traced patrol paths for the office scene.
 *
 * Waypoints are hand-placed in walkable aisles, avoiding:
 * - Desk rows (front z≈-4.5, back z≈1.5, width 3 each)
 * - Meeting table (center 0,7 — radius ~1.7)
 * - Corner plants (±11.5, ±9.5 / ±8.5)
 * - Walls (|x|>12, |z|>10)
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
    id: "central-aisle",
    loop: true,
    waypoints: [
      { x: -7, z: -1.2 },
      { x: -3.5, z: -1.2 },
      { x: 0, z: -1.2 },
      { x: 3.5, z: -1.2 },
      { x: 7, z: -1.2 },
      { x: 7, z: 0.2 },
      { x: 3.5, z: 0.2 },
      { x: 0, z: 0.2 },
      { x: -3.5, z: 0.2 },
      { x: -7, z: 0.2 },
    ],
  },
  {
    id: "left-corridor",
    loop: true,
    waypoints: [
      { x: -9, z: -7 },
      { x: -9, z: -3 },
      { x: -9, z: 0.5 },
      { x: -9, z: 4 },
      { x: -6.5, z: 4 },
      { x: -6.5, z: 0.5 },
      { x: -6.5, z: -3 },
      { x: -9, z: -7 },
    ],
  },
  {
    id: "right-corridor",
    loop: true,
    waypoints: [
      { x: 9, z: -7 },
      { x: 9, z: -3 },
      { x: 9, z: 0.5 },
      { x: 9, z: 4 },
      { x: 6.5, z: 4 },
      { x: 6.5, z: 0.5 },
      { x: 6.5, z: -3 },
      { x: 9, z: -7 },
    ],
  },
  {
    id: "front-aisle",
    loop: true,
    waypoints: [
      { x: -7, z: -6.2 },
      { x: -3.5, z: -6.2 },
      { x: 0, z: -6.2 },
      { x: 3.5, z: -6.2 },
      { x: 7, z: -6.2 },
      { x: 7, z: -5 },
      { x: 0, z: -5 },
      { x: -7, z: -5 },
    ],
  },
  {
    id: "meeting-approach",
    loop: false,
    waypoints: [
      { x: 0, z: 0.2 },
      { x: 0, z: 2.5 },
      { x: 0, z: 4.8 },
      { x: 3, z: 5.2, activity: "coffee" },
      { x: 0, z: 4.8 },
      { x: 0, z: 2.5 },
      { x: 0, z: 0.2, activity: "look" },
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
