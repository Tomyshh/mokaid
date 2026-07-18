#!/usr/bin/env python3
"""Append Phase-1 POI clips (sitting / preparing_coffee / playing_foosball) onto avatar GLBs.

Supports Rigify-like bones (avatar_male) and Mixamo biped (female / finance / corporate / legal / research).
Clips are procedural skeletal animation — in-place, root/hip motion only where needed.

Usage:
  python3 scripts/bake-poi-clips.py assets/raw/avatar_male.glb -o assets/raw/avatar_male.glb
  python3 scripts/bake-poi-clips.py apps/web/public/assets3d/avatar_female.dbad3a7ec430.glb -o /tmp/af.glb
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import sys
from pathlib import Path
from typing import Any

POI_CLIPS = ("sitting", "preparing_coffee", "playing_foosball")


def q_mul(a: list[float], b: list[float]) -> list[float]:
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ]


def q_normalize(q: list[float]) -> list[float]:
    n = math.sqrt(sum(c * c for c in q)) or 1.0
    return [c / n for c in q]


def q_from_euler(rx: float, ry: float, rz: float) -> list[float]:
    cx, sx = math.cos(rx * 0.5), math.sin(rx * 0.5)
    cy, sy = math.cos(ry * 0.5), math.sin(ry * 0.5)
    cz, sz = math.cos(rz * 0.5), math.sin(rz * 0.5)
    return q_normalize(
        [
            sx * cy * cz - cx * sy * sz,
            cx * sy * cz + sx * cy * sz,
            cx * cy * sz - sx * sy * cz,
            cx * cy * cz + sx * sy * sz,
        ]
    )


def rest_rotation(node: dict[str, Any]) -> list[float]:
    r = node.get("rotation")
    if r and len(r) == 4:
        return list(r)
    return [0.0, 0.0, 0.0, 1.0]


def rest_translation(node: dict[str, Any]) -> list[float]:
    t = node.get("translation")
    if t and len(t) == 3:
        return list(t)
    return [0.0, 0.0, 0.0]


def load_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        raise SystemExit(f"not a GLB: {path}")
    offset = 12
    json_chunk: dict[str, Any] | None = None
    bin_chunk = b""
    while offset < length:
        chunk_len, chunk_type = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_len]
        offset += chunk_len
        if chunk_type == b"JSON":
            json_chunk = json.loads(chunk.decode("utf-8"))
        elif chunk_type == b"BIN\x00":
            bin_chunk = chunk
    if json_chunk is None:
        raise SystemExit("GLB missing JSON chunk")
    return json_chunk, bin_chunk


def write_glb(path: Path, gltf: dict[str, Any], bin_blob: bytes) -> None:
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b" " * json_pad
    bin_pad = (4 - (len(bin_blob) % 4)) % 4
    bin_blob = bin_blob + (b"\x00" * bin_pad)
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    out = bytearray()
    out += struct.pack("<4sII", b"glTF", 2, total)
    out += struct.pack("<I4s", len(json_bytes), b"JSON")
    out += json_bytes
    out += struct.pack("<I4s", len(bin_blob), b"BIN\x00")
    out += bin_blob
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(out)


def node_index_by_name(nodes: list[dict[str, Any]]) -> dict[str, int]:
    return {n.get("name", f"node_{i}"): i for i, n in enumerate(nodes)}


def sample_times(duration: float, fps: float = 30.0) -> list[float]:
    n = max(2, int(round(duration * fps)) + 1)
    return [i * duration / (n - 1) for i in range(n)]


def pack_f32(values: list[float]) -> bytes:
    return struct.pack(f"<{len(values)}f", *values)


class BufferBuilder:
    def __init__(self, existing: bytes):
        self.data = bytearray(existing)
        while len(self.data) % 4:
            self.data.append(0)

    def add(self, blob: bytes) -> tuple[int, int]:
        while len(self.data) % 4:
            self.data.append(0)
        offset = len(self.data)
        self.data.extend(blob)
        return offset, len(blob)


def append_accessor(
    gltf: dict[str, Any],
    builder: BufferBuilder,
    blob: bytes,
    *,
    component_type: int,
    type_name: str,
    count: int,
    min_v: list[float] | None = None,
    max_v: list[float] | None = None,
) -> int:
    offset, length = builder.add(blob)
    buffer_views = gltf.setdefault("bufferViews", [])
    bv_index = len(buffer_views)
    bv: dict[str, Any] = {"buffer": 0, "byteOffset": offset, "byteLength": length}
    if type_name != "SCALAR":
        bv["target"] = 34962
    buffer_views.append(bv)
    accessors = gltf.setdefault("accessors", [])
    acc: dict[str, Any] = {
        "bufferView": bv_index,
        "componentType": component_type,
        "count": count,
        "type": type_name,
    }
    if min_v is not None:
        acc["min"] = min_v
    if max_v is not None:
        acc["max"] = max_v
    accessors.append(acc)
    return len(accessors) - 1


def make_channel(
    gltf: dict[str, Any],
    builder: BufferBuilder,
    node_i: int,
    path: str,
    times: list[float],
    values: list[float],
) -> dict[str, Any]:
    type_name = "VEC3" if path == "translation" else "VEC4"
    comps = 3 if path == "translation" else 4
    if len(values) != len(times) * comps:
        raise ValueError(f"bad value count for {path}")
    input_acc = append_accessor(
        gltf, builder, pack_f32(times), component_type=5126, type_name="SCALAR",
        count=len(times), min_v=[times[0]], max_v=[times[-1]],
    )
    output_acc = append_accessor(
        gltf, builder, pack_f32(values), component_type=5126, type_name=type_name, count=len(times),
    )
    return {
        "sampler": None,
        "target": {"node": node_i, "path": path},
        "_input": input_acc,
        "_output": output_acc,
    }


def rot_track(gltf, builder, nodes, node_i, times, deltas):
    rest = rest_rotation(nodes[node_i])
    values: list[float] = []
    for rx, ry, rz in deltas:
        values.extend(q_mul(rest, q_from_euler(rx, ry, rz)))
    ch = make_channel(gltf, builder, node_i, "rotation", times, values)
    sampler = {"input": ch.pop("_input"), "output": ch.pop("_output"), "interpolation": "LINEAR"}
    return ch, sampler


def trans_track(gltf, builder, nodes, node_i, times, deltas):
    rest = rest_translation(nodes[node_i])
    values: list[float] = []
    for dx, dy, dz in deltas:
        values.extend([rest[0] + dx, rest[1] + dy, rest[2] + dz])
    ch = make_channel(gltf, builder, node_i, "translation", times, values)
    sampler = {"input": ch.pop("_input"), "output": ch.pop("_output"), "interpolation": "LINEAR"}
    return ch, sampler


def vadd(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def detect_rig(by_name: dict[str, int]) -> str:
    if "Hips" in by_name and "LeftUpLeg" in by_name:
        return "mixamo"
    if "root.x" in by_name or "thigh_stretch.l" in by_name:
        return "rigify"
    raise SystemExit(f"unknown skeleton; sample bones: {list(by_name)[:12]}")


def build_clip(name: str, gltf, builder, nodes, by_name, rig: str) -> dict[str, Any] | None:
    channels: list[dict[str, Any]] = []
    samplers: list[dict[str, Any]] = []

    def add_rot(bone: str, times: list[float], deltas: list[tuple[float, float, float]]) -> None:
        if bone not in by_name:
            return
        ch, samp = rot_track(gltf, builder, nodes, by_name[bone], times, deltas)
        ch["sampler"] = len(samplers)
        samplers.append(samp)
        channels.append(ch)

    def add_trans(bone: str, times: list[float], deltas: list[tuple[float, float, float]]) -> None:
        if bone not in by_name:
            return
        ch, samp = trans_track(gltf, builder, nodes, by_name[bone], times, deltas)
        ch["sampler"] = len(samplers)
        samplers.append(samp)
        channels.append(ch)

    if rig == "mixamo":
        hips, up_l, up_r, leg_l, leg_r = "Hips", "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg"
        arm_l, arm_r = "LeftArm", "RightArm"
        fore_l, fore_r = "LeftForeArm", "RightForeArm"
        spine, spine1, head = "Spine", "Spine1", "Head"
        # Mixamo arms hang via large local Z.
        arm_down_l, arm_down_r = (0.15, 0.0, 1.25), (0.15, 0.0, -1.25)
        fore_rel_l, fore_rel_r = (-0.35, 0.0, 0.1), (-0.35, 0.0, -0.1)
        # Mixamo exports are often in centimetres (Hips.y ≈ 90–100). Deltas must
        # match that scale — a −0.42 "meter" delta only lowers hips by ~4 mm.
        hips_rest_y = abs(rest_translation(nodes[by_name[hips]])[1]) or 1.0
        unit = hips_rest_y / 0.95 if hips_rest_y > 5.0 else 1.0
        sit_hips = (0.0, -0.40 * unit, 0.05 * unit)
        sit_thigh_l, sit_thigh_r = (1.35, 0.0, 0.08), (1.35, 0.0, -0.08)
        sit_leg_l, sit_leg_r = (-1.45, 0.0, 0.0), (-1.45, 0.0, 0.0)
    else:
        hips, up_l, up_r, leg_l, leg_r = "root.x", "thigh_stretch.l", "thigh_stretch.r", "leg_stretch.l", "leg_stretch.r"
        arm_l, arm_r = "arm_stretch.l", "arm_stretch.r"
        fore_l, fore_r = "forearm_stretch.l", "forearm_stretch.r"
        spine, spine1, head = "spine_02.x", "spine_03.x", "head.x"
        arm_down_l, arm_down_r = (0.10, 0.22, -1.18), (0.10, -0.22, 1.18)
        fore_rel_l, fore_rel_r = (-0.32, 0.06, 0.10), (-0.32, -0.06, -0.10)
        # Rigify: thighs swing on local Z for sagittal flexion (meters).
        sit_hips = (0.0, -0.42, 0.04)
        sit_thigh_l, sit_thigh_r = (0.05, 0.0, 1.15), (0.05, 0.0, -1.15)
        sit_leg_l, sit_leg_r = (0.0, 0.0, -1.35), (0.0, 0.0, 1.35)

    if name == "sitting":
        duration = 2.5
        times = sample_times(duration)
        us = [ti / duration for ti in times]
        add_trans(hips, times, [sit_hips for _ in times])
        add_rot(up_l, times, [sit_thigh_l for _ in times])
        add_rot(up_r, times, [sit_thigh_r for _ in times])
        add_rot(leg_l, times, [sit_leg_l for _ in times])
        add_rot(leg_r, times, [sit_leg_r for _ in times])
        add_rot(spine, times, [(0.06 + 0.015 * math.sin(u * math.pi * 2), 0.0, 0.0) for u in us])
        if spine1 in by_name:
            add_rot(spine1, times, [(0.04, 0.0, 0.0) for _ in times])
        add_rot(head, times, [(0.05 * math.sin(u * math.pi * 2 * 0.4), 0.04 * math.sin(u * math.pi * 2 * 0.3), 0.0) for u in us])
        # Hands on thighs / relaxed
        add_rot(arm_l, times, [vadd(arm_down_l, (-0.2, 0.15, -0.1)) for _ in times])
        add_rot(arm_r, times, [vadd(arm_down_r, (-0.2, -0.15, 0.1)) for _ in times])
        add_rot(fore_l, times, [vadd(fore_rel_l, (-0.35, 0.0, 0.0)) for _ in times])
        add_rot(fore_r, times, [vadd(fore_rel_r, (-0.35, 0.0, 0.0)) for _ in times])

    elif name == "preparing_coffee":
        duration = 2.0
        times = sample_times(duration)
        us = [ti / duration for ti in times]
        add_trans(hips, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(up_l, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(up_r, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(leg_l, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(leg_r, times, [(0.0, 0.0, 0.0) for _ in times])
        # Reach forward toward machine + subtle pour motion
        add_rot(arm_r, times, [vadd(arm_down_r, (-0.7, -0.35, 0.35 + 0.08 * math.sin(u * math.pi * 2))) for u in us])
        add_rot(fore_r, times, [vadd(fore_rel_r, (-0.55 + 0.1 * math.sin(u * math.pi * 2 + 0.4), 0.0, 0.0)) for u in us])
        add_rot(arm_l, times, [vadd(arm_down_l, (-0.45, 0.25, -0.2)) for _ in times])
        add_rot(fore_l, times, [vadd(fore_rel_l, (-0.3, 0.0, 0.0)) for _ in times])
        add_rot(spine, times, [(0.08, 0.0, 0.0) for _ in times])
        add_rot(head, times, [(0.12 + 0.03 * math.sin(u * math.pi * 2), 0.05 * math.sin(u * math.pi * 2 * 0.5), 0.0) for u in us])

    elif name == "playing_foosball":
        duration = 1.4
        times = sample_times(duration, fps=36)
        us = [ti / duration for ti in times]
        add_trans(hips, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(up_l, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(up_r, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(leg_l, times, [(0.0, 0.0, 0.0) for _ in times])
        add_rot(leg_r, times, [(0.0, 0.0, 0.0) for _ in times])
        # Both arms forward on rods, alternating turn
        sway = lambda u, ph: 0.22 * math.sin(u * math.pi * 2 * 2 + ph)
        add_rot(arm_l, times, [vadd(arm_down_l, (-0.75, 0.4 + sway(u, 0.0), -0.35)) for u in us])
        add_rot(arm_r, times, [vadd(arm_down_r, (-0.75, -0.4 + sway(u, math.pi), 0.35)) for u in us])
        add_rot(fore_l, times, [vadd(fore_rel_l, (-0.55, 0.0, 0.12 * sway(u, 0.5))) for u in us])
        add_rot(fore_r, times, [vadd(fore_rel_r, (-0.55, 0.0, -0.12 * sway(u, 0.5))) for u in us])
        add_rot(spine, times, [(0.12, 0.04 * math.sin(u * math.pi * 2 * 2), 0.0) for u in us])
        add_rot(head, times, [(0.18, 0.05 * math.sin(u * math.pi * 2), 0.0) for u in us])
    else:
        return None

    if not channels:
        return None
    return {"name": name, "channels": channels, "samplers": samplers}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("-o", "--output", type=Path, default=None)
    args = parser.parse_args()
    out = args.output or args.input

    gltf, bin_blob = load_glb(args.input)
    nodes = gltf.get("nodes") or []
    by_name = node_index_by_name(nodes)
    rig = detect_rig(by_name)

    # Strip previous POI clips for idempotent re-runs.
    anims = gltf.get("animations") or []
    gltf["animations"] = [a for a in anims if a.get("name") not in POI_CLIPS]

    buffers = gltf.setdefault("buffers", [{"byteLength": len(bin_blob)}])
    if not buffers:
        buffers.append({"byteLength": len(bin_blob)})
    builder = BufferBuilder(bin_blob)
    animations = gltf.setdefault("animations", [])
    baked = 0
    for clip in POI_CLIPS:
        anim = build_clip(clip, gltf, builder, nodes, by_name, rig)
        if anim:
            animations.append(anim)
            baked += 1

    buffers[0]["byteLength"] = len(builder.data)
    write_glb(out, gltf, bytes(builder.data))
    verify, _ = load_glb(out)
    names = [a.get("name") for a in verify.get("animations", [])]
    print(f"Wrote {out} ({out.stat().st_size} bytes) rig={rig} baked={baked}")
    print(f"Clips: {names}")


if __name__ == "__main__":
    main()
