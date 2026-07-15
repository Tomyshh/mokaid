#!/usr/bin/env python3
"""
Generate the complete OFFICE_OBSTACLES list from scratchpad/blender_obstacles.json.

- Inflates boxes by agent clearance (more for tall walls, less for low props).
- Drops boxes fully contained in another.
- Verifies nav nodes / edges / patrol waypoints / POI approaches stay walkable;
  conflicting boxes are trimmed back to raw (uninflated) before failing.

Usage: python3 scripts/gen_office_obstacles.py [--check-only]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

SRC = Path("scratchpad/blender_obstacles.json")

# Protected navigation data (raw GLB space) — mirror of office-navdata.ts.
NAV_NODES = {
    "nw": (-5.6, -5.2), "n_lounge": (-3.5, -5.2), "n_mid": (-0.5, -5.2),
    "n_sofa": (1.8, -5.2), "ne": (5.4, -5.2), "w_aisle": (-5.6, -0.8),
    "mid_w": (-3.0, -1.6), "mid_c": (0.4, -1.8), "mid_e": (3.5, -1.4),
    "e_aisle": (5.5, -0.4), "sw": (-5.4, 3.2), "s_mid": (-1.0, 3.4),
    "s_coffee": (2.2, 3.4), "se": (4.6, 2.6),
    "foosball_a": (0.97, 4.67), "foosball_b": (2.72, 4.67), "foosball_q": (1.85, 3.55),
    "sofa_a": (1.27, -5.25), "sofa_b": (1.79, -5.25), "sofa_c": (2.31, -5.25),
    "coffee": (-1.99, -5.2),
    "desk0": (-4.6, 0.76), "desk1": (-4.6, -2.0), "desk2": (-1.0, -3.42),
    "desk3": (-2.0, -0.66), "desk4": (2.6, -2.82), "desk5": (1.5, 0.34),
    "desk6": (5.1, 0.17), "desk7": (0.9, 3.18), "desk8": (-2.2, 2.56),
}
NAV_EDGES = [
    ("nw", "n_lounge"), ("n_lounge", "n_mid"), ("n_mid", "n_sofa"), ("n_sofa", "ne"),
    ("nw", "w_aisle"), ("ne", "e_aisle"), ("w_aisle", "mid_w"), ("mid_w", "mid_c"),
    ("mid_c", "mid_e"), ("mid_e", "e_aisle"), ("w_aisle", "sw"), ("sw", "s_mid"),
    ("s_mid", "s_coffee"), ("s_coffee", "se"), ("se", "e_aisle"),
    ("s_coffee", "foosball_q"), ("foosball_q", "foosball_a"), ("foosball_q", "foosball_b"),
    ("n_sofa", "sofa_a"), ("n_sofa", "sofa_b"), ("n_sofa", "sofa_c"),
    ("sofa_a", "sofa_b"), ("sofa_b", "sofa_c"),
    ("n_lounge", "coffee"), ("n_mid", "coffee"),
    ("w_aisle", "desk0"), ("w_aisle", "desk1"), ("mid_w", "desk2"), ("mid_w", "desk3"),
    ("mid_e", "desk4"), ("mid_c", "desk5"), ("e_aisle", "desk6"), ("s_mid", "desk7"),
    ("sw", "desk8"), ("mid_c", "s_mid"), ("n_mid", "mid_c"),
]
PATROLS = [
    [(-5.6, -5.2), (-0.5, -5.2), (5.4, -5.2), (5.5, -0.4), (4.6, 2.6), (-1.0, 3.4), (-5.4, 3.2), (-5.6, -0.8), (-5.6, -5.2)],
    [(-5.6, -0.8), (-3.0, -1.6), (0.4, -1.8), (3.5, -1.4), (5.5, -0.4), (3.5, -1.4), (-3.0, -1.6), (-5.6, -0.8)],
    [(-5.4, 3.2), (-1.0, 3.4), (2.2, 3.4), (4.6, 2.6), (2.2, 3.4), (-5.4, 3.2)],
]
POI_APPROACH = [(1.85, 3.55), (1.0, 3.3), (1.79, -5.2), (-1.99, -4.7), (-1.0, -4.6), (-0.5, -4.3)]

TALL_PAD = 0.30   # walls, racks, partitions
LOW_PAD = 0.15    # chairs, small furniture, lamps


def inflate(b: dict, pad: float) -> dict:
    return {
        **b,
        "minX": b["minX"] - pad, "maxX": b["maxX"] + pad,
        "minZ": b["minZ"] - pad, "maxZ": b["maxZ"] + pad,
    }


def contains_2d(outer: dict, inner: dict) -> bool:
    return (
        outer["minX"] <= inner["minX"] and outer["maxX"] >= inner["maxX"]
        and outer["minZ"] <= inner["minZ"] and outer["maxZ"] >= inner["maxZ"]
    )


def point_in(b: dict, x: float, z: float) -> bool:
    return b["minX"] <= x <= b["maxX"] and b["minZ"] <= z <= b["maxZ"]


def seg_hits(b: dict, a: tuple, c: tuple, steps: int = 24) -> bool:
    for i in range(steps + 1):
        t = i / steps
        x = a[0] + (c[0] - a[0]) * t
        z = a[1] + (c[1] - a[1]) * t
        if point_in(b, x, z):
            return True
    return False


def protected_segments() -> list[tuple[tuple, tuple]]:
    segs = [(NAV_NODES[a], NAV_NODES[b]) for a, b in NAV_EDGES]
    for loop in PATROLS:
        segs += list(zip(loop, loop[1:]))
    return segs


def main() -> None:
    raw = json.loads(SRC.read_text())["obstacles"]

    boxes = []
    for b in raw:
        tall = b["maxY"] > 1.2
        pad = TALL_PAD if tall else LOW_PAD
        boxes.append({"raw": b, "pad": pad, "box": inflate(b, pad)})

    # Trim inflation where it blocks protected nav; drop raw-level conflicts.
    segs = protected_segments()
    points = list(NAV_NODES.values()) + POI_APPROACH
    kept = []
    dropped = []
    for item in boxes:
        box, rawb = item["box"], item["raw"]

        def conflicts(bb: dict) -> list[str]:
            out = []
            for name, (x, z) in NAV_NODES.items():
                if point_in(bb, x, z):
                    out.append(f"node:{name}")
            for i, (x, z) in enumerate(POI_APPROACH):
                if point_in(bb, x, z):
                    out.append(f"approach:{i}")
            for a, c in segs:
                if seg_hits(bb, a, c):
                    out.append(f"seg:{a}->{c}")
            return out

        conf = conflicts(box)
        if conf:
            # Retry with a minimal pad, then raw.
            for pad in (0.08, 0.0):
                shrunk = inflate(rawb, pad)
                if not conflicts(shrunk):
                    item["box"] = shrunk
                    item["pad"] = pad
                    conf = []
                    break
            else:
                conf = conflicts(inflate(rawb, 0.0))
        if conf:
            dropped.append((rawb["name"], conf[:3]))
        else:
            kept.append(item)

    # Deduplicate: remove boxes fully contained in another kept box.
    final = []
    for i, it in enumerate(kept):
        redundant = any(
            j != i and contains_2d(other["box"], it["box"]) and
            (j < i or not contains_2d(it["box"], other["box"]))
            for j, other in enumerate(kept)
        )
        if not redundant:
            final.append(it)

    print(f"raw={len(raw)} kept={len(kept)} final={len(final)} dropped={len(dropped)}")
    for name, conf in dropped:
        print(f"  DROPPED {name}: {conf}")

    if "--check-only" in sys.argv:
        return

    lines = []
    for it in sorted(final, key=lambda x: (x["box"]["minX"], x["box"]["minZ"])):
        b = it["box"]
        r = it["raw"]
        lines.append(
            f'  {{ minX: {b["minX"]:.2f}, maxX: {b["maxX"]:.2f}, '
            f'minZ: {b["minZ"]:.2f}, maxZ: {b["maxZ"]:.2f} }}, // {r["name"]} (pad {it["pad"]})'
        )
    Path("scratchpad/office_obstacles_generated.ts").write_text(
        "export const OFFICE_OBSTACLES: Aabb2[] = [\n" + "\n".join(lines) + "\n];\n"
    )
    print("Wrote scratchpad/office_obstacles_generated.ts")


if __name__ == "__main__":
    main()
