"""
Exhaustive obstacle dump from office.blend for runtime collision.

For every mesh: world AABB in glTF (Y-up) space. Large meshes (walls,
merged furniture) are decomposed into connected-component islands so an
L-shaped partition does not block a whole room via its bounding box.

Run:
  blender --background office.blend --python scripts/dump_blender_obstacles.py

Writes scratchpad/blender_obstacles.json.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

OUT = Path(os.environ.get("MOKAID_OBS_OUT", "scratchpad/blender_obstacles.json"))

# Agent body band: ignore rugs / ceiling fixtures outside this vertical range.
BAND_MIN_Y = 0.12
BAND_MAX_Y = 1.55
# Islands with a footprint smaller than this are noise (screws, pens…).
MIN_FOOTPRINT = 0.015
# Meshes with a footprint larger than this get island decomposition.
DECOMPOSE_FOOTPRINT = 5.0


def to_gltf(v: Vector) -> tuple[float, float, float]:
    return (float(v.x), float(v.z), float(-v.y))


def aabb_from_points(pts) -> dict:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    zs = [p[2] for p in pts]
    return {
        "minX": min(xs), "maxX": max(xs),
        "minY": min(ys), "maxY": max(ys),
        "minZ": min(zs), "maxZ": max(zs),
    }


def band_ok(box: dict) -> bool:
    if box["maxY"] < BAND_MIN_Y:
        return False
    if box["minY"] > BAND_MAX_Y:
        return False
    fp = (box["maxX"] - box["minX"]) * (box["maxZ"] - box["minZ"])
    return fp >= MIN_FOOTPRINT


def islands_of(obj) -> list[dict]:
    """Connected-component AABBs in glTF space."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()

    visited = set()
    out = []
    for seed in bm.verts:
        if seed.index in visited:
            continue
        stack = [seed]
        comp = []
        visited.add(seed.index)
        while stack:
            v = stack.pop()
            comp.append(v)
            for e in v.link_edges:
                o = e.other_vert(v)
                if o.index not in visited:
                    visited.add(o.index)
                    stack.append(o)
        pts = [to_gltf(obj.matrix_world @ v.co) for v in comp]
        out.append(aabb_from_points(pts))
    bm.free()
    eval_obj.to_mesh_clear()
    return out


GRID = 0.1
# Islands with a footprint above this get grid decomposition (walls, shells)
GRID_FOOTPRINT = 4.0


def grid_boxes(obj, band=(BAND_MIN_Y, BAND_MAX_Y)) -> list[dict]:
    """Rasterize triangles inside the agent band into an XZ occupancy grid,
    then merge occupied cells into boxes (greedy row scan). Splits walls with
    openings into separate segments instead of one giant AABB."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()
    mesh.calc_loop_triangles()

    occupied: set[tuple[int, int]] = set()
    mw = obj.matrix_world
    for tri in mesh.loop_triangles:
        pts = [to_gltf(mw @ mesh.vertices[i].co) for i in tri.vertices]
        ys = [p[1] for p in pts]
        if max(ys) < band[0] or min(ys) > band[1]:
            continue
        # Rasterize by sampling the triangle
        (x0, _, z0), (x1, _, z1), (x2, _, z2) = pts
        n = max(
            2,
            int(max(abs(x1 - x0), abs(x2 - x0), abs(z1 - z0), abs(z2 - z0)) / GRID) + 2,
        )
        for i in range(n + 1):
            for j in range(n + 1 - i):
                a = i / n
                b = j / n
                c = 1 - a - b
                x = a * x0 + b * x1 + c * x2
                z = a * z0 + b * z1 + c * z2
                occupied.add((int(round(x / GRID)), int(round(z / GRID))))
    eval_obj.to_mesh_clear()

    # Greedy merge: rows of consecutive cells, then merge identical rows in Z.
    boxes = []
    by_row: dict[int, list[int]] = {}
    for cx, cz in occupied:
        by_row.setdefault(cz, []).append(cx)
    runs: dict[int, list[tuple[int, int]]] = {}
    for cz, xs in by_row.items():
        xs.sort()
        row_runs = []
        s = e = xs[0]
        for x in xs[1:]:
            if x == e + 1:
                e = x
            else:
                row_runs.append((s, e))
                s = e = x
        row_runs.append((s, e))
        runs[cz] = row_runs

    used: set[tuple[int, int, int]] = set()
    for cz in sorted(runs):
        for (s, e) in runs[cz]:
            if (cz, s, e) in used:
                continue
            z_end = cz
            while (z_end + 1) in runs and (s, e) in runs[z_end + 1] and (z_end + 1, s, e) not in used:
                z_end += 1
            for z in range(cz, z_end + 1):
                used.add((z, s, e))
            boxes.append(
                {
                    "minX": s * GRID - GRID / 2, "maxX": e * GRID + GRID / 2,
                    "minZ": cz * GRID - GRID / 2, "maxZ": z_end * GRID + GRID / 2,
                    "minY": band[0], "maxY": band[1],
                }
            )
    return boxes


def main() -> None:
    boxes = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.data is None:
            continue
        corners = [to_gltf(obj.matrix_world @ Vector(c)) for c in obj.bound_box]
        whole = aabb_from_points(corners)
        fp = (whole["maxX"] - whole["minX"]) * (whole["maxZ"] - whole["minZ"])
        if fp >= DECOMPOSE_FOOTPRINT:
            islands = islands_of(obj)
            for i, box in enumerate(islands):
                if not band_ok(box):
                    continue
                ifp = (box["maxX"] - box["minX"]) * (box["maxZ"] - box["minZ"])
                if ifp >= GRID_FOOTPRINT:
                    # Wall shells / partitions with openings: rasterize.
                    for j, gb in enumerate(grid_boxes(obj)):
                        if band_ok(gb):
                            boxes.append({"name": f"{obj.name}#g{j}", **gb})
                    break
                boxes.append({"name": f"{obj.name}#{i}", **box})
        elif band_ok(whole):
            boxes.append({"name": obj.name, **whole})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"obstacles": boxes}, indent=1))
    print(f"Wrote {OUT} boxes={len(boxes)}")


if __name__ == "__main__":
    main()
