#!/usr/bin/env python3
"""Patch standing-clip arm rotations in a GLB using rest*euler (glTF space).

Same convention as bake-avatar-female.py — absolute node rotations, not Blender
pose-delta fcurves (which have been unreliable for Meshy + Draco).

  python3 scripts/patch-avatar-hang-gltf.py \\
    --input assets/optimized/avatar_design.glb \\
    --output /tmp/out.glb \\
    --arm 0.0 0.35 1.45 --fore -0.25 0.0 0.08
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import sys
from pathlib import Path
from typing import Any

STANDING = {"idle", "waiting", "offline", "away", "blocked"}
ARM_BONES = [
    "LeftShoulder",
    "RightShoulder",
    "LeftArm",
    "RightArm",
    "LeftForeArm",
    "RightForeArm",
    "LeftHand",
    "RightHand",
]


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
    """XYZ intrinsic euler → glTF quat (x,y,z,w)."""
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
    bv_i = len(gltf.setdefault("bufferViews", []))
    gltf["bufferViews"].append(
        {"buffer": 0, "byteOffset": offset, "byteLength": length}
    )
    acc: dict[str, Any] = {
        "bufferView": bv_i,
        "componentType": component_type,
        "count": count,
        "type": type_name,
    }
    if min_v is not None:
        acc["min"] = min_v
    if max_v is not None:
        acc["max"] = max_v
    acc_i = len(gltf.setdefault("accessors", []))
    gltf["accessors"].append(acc)
    return acc_i


def rest_rotation(node: dict[str, Any]) -> list[float]:
    r = node.get("rotation")
    if r and len(r) == 4:
        return list(r)
    return [0.0, 0.0, 0.0, 1.0]


def anim_duration(gltf: dict[str, Any], anim: dict[str, Any]) -> float:
    t_max = 0.0
    for samp in anim.get("samplers") or []:
        acc = gltf["accessors"][samp["input"]]
        mx = acc.get("max")
        if mx:
            t_max = max(t_max, float(mx[0]))
    return t_max if t_max > 0 else 2.4


def sample_times(duration: float, fps: float = 30.0) -> list[float]:
    n = max(2, int(round(duration * fps)) + 1)
    return [i * duration / (n - 1) for i in range(n)]


def pack_f32(values: list[float]) -> bytes:
    return struct.pack(f"<{len(values)}f", *values)


def make_rot_channel(
    gltf: dict[str, Any],
    builder: BufferBuilder,
    node_i: int,
    times: list[float],
    quats: list[list[float]],
) -> tuple[dict[str, Any], dict[str, Any]]:
    flat: list[float] = []
    for q in quats:
        flat.extend(q)
    input_acc = append_accessor(
        gltf,
        builder,
        pack_f32(times),
        component_type=5126,
        type_name="SCALAR",
        count=len(times),
        min_v=[times[0]],
        max_v=[times[-1]],
    )
    output_acc = append_accessor(
        gltf,
        builder,
        pack_f32(flat),
        component_type=5126,
        type_name="VEC4",
        count=len(times),
    )
    ch = {"sampler": None, "target": {"node": node_i, "path": "rotation"}}
    samp = {"input": input_acc, "output": output_acc, "interpolation": "LINEAR"}
    return ch, samp


def bone_deltas(
    arm: tuple[float, float, float],
    fore: tuple[float, float, float],
    shoulder: tuple[float, float, float],
    hand: tuple[float, float, float],
) -> dict[str, tuple[float, float, float]]:
    ax, ay, az = arm
    fx, fy, fz = fore
    sx, sy, sz = shoulder
    hx, hy, hz = hand
    return {
        "LeftShoulder": (sx, sy, sz),
        "RightShoulder": (sx, -sy, -sz),
        "LeftArm": (ax, ay, az),
        "RightArm": (ax, -ay, -az),
        "LeftForeArm": (fx, fy, fz),
        "RightForeArm": (fx, -fy, -fz),
        "LeftHand": (hx, hy, hz),
        "RightHand": (hx, -hy, -hz),
    }


def patch_standing(
    gltf: dict[str, Any],
    builder: BufferBuilder,
    deltas: dict[str, tuple[float, float, float]],
) -> int:
    nodes = gltf["nodes"]
    by_name = {n.get("name"): i for i, n in enumerate(nodes)}
    patched = 0
    for anim in gltf.get("animations") or []:
        name = (anim.get("name") or "").split("|")[-1].split(".")[0].lower()
        if name not in STANDING:
            continue
        duration = anim_duration(gltf, anim)
        times = sample_times(duration)
        # Drop existing arm rotation channels
        keep_ch = []
        keep_samp_idx: dict[int, int] = {}
        new_samplers: list[dict[str, Any]] = []
        old_samplers = anim.get("samplers") or []
        for ch in anim.get("channels") or []:
            node_i = ch["target"]["node"]
            bone = nodes[node_i].get("name")
            if bone in ARM_BONES and ch["target"]["path"] == "rotation":
                continue
            old_si = ch["sampler"]
            if old_si not in keep_samp_idx:
                keep_samp_idx[old_si] = len(new_samplers)
                new_samplers.append(old_samplers[old_si])
            ch = dict(ch)
            ch["sampler"] = keep_samp_idx[old_si]
            keep_ch.append(ch)

        for bone, eul in deltas.items():
            if bone not in by_name:
                continue
            node_i = by_name[bone]
            rest = rest_rotation(nodes[node_i])
            q = q_normalize(q_mul(rest, q_from_euler(*eul)))
            quats = [q for _ in times]
            ch, samp = make_rot_channel(gltf, builder, node_i, times, quats)
            ch["sampler"] = len(new_samplers)
            new_samplers.append(samp)
            keep_ch.append(ch)

        anim["channels"] = keep_ch
        anim["samplers"] = new_samplers
        patched += 1
        print(f"  patched '{anim.get('name')}' ({len(times)} keys)")
    return patched


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--arm", type=float, nargs=3, required=True, metavar=("X", "Y", "Z"))
    p.add_argument("--fore", type=float, nargs=3, default=(-0.25, 0.0, 0.08))
    p.add_argument("--shoulder", type=float, nargs=3, default=(0.05, 0.1, 0.12))
    p.add_argument("--hand", type=float, nargs=3, default=(0.0, 0.05, 0.05))
    p.add_argument(
        "--identity",
        action="store_true",
        help="Key identity deltas (bind pose) on standing clips",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv or sys.argv[1:])
    print(f"[patch-avatar-hang-gltf] {args.input}")
    gltf, blob = load_glb(args.input)
    builder = BufferBuilder(blob)
    if args.identity:
        deltas = {b: (0.0, 0.0, 0.0) for b in ARM_BONES}
    else:
        deltas = bone_deltas(
            tuple(args.arm),
            tuple(args.fore),
            tuple(args.shoulder),
            tuple(args.hand),
        )
    n = patch_standing(gltf, builder, deltas)
    gltf.setdefault("buffers", [{"byteLength": 0}])[0]["byteLength"] = len(builder.data)
    write_glb(args.output, gltf, bytes(builder.data))
    print(f"  wrote {args.output} ({args.output.stat().st_size} bytes, {n} clips)")


if __name__ == "__main__":
    main()
