#!/usr/bin/env python3
"""Copy sitting lower-body tracks into desk clips (typing/working/…).

Mixamo procedural desk clips were baked with SIT_HIPS_Y=-0.42 in centimetre
space (~4 mm). The dedicated `sitting` POI clip already has a real hip drop.
This patch reuses that lower body so agents actually sit at their desks.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path
from typing import Any

DESK_CLIPS = (
    "typing",
    "working",
    "thinking",
    "talking",
    "waiting",
    "blocked",
    "reviewing",
    "learning",
    "requesting_approval",
)

MIXAMO_LOWER = ("Hips", "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg")
RIGIFY_LOWER = (
    "root.x",
    "thigh_stretch.l",
    "thigh_stretch.r",
    "leg_stretch.l",
    "leg_stretch.r",
)


def load_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    data = path.read_bytes()
    offset = 12
    gltf: dict[str, Any] | None = None
    blob = b""
    while offset < len(data):
        cl, ct = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk = data[offset : offset + cl]
        offset += cl
        if ct == b"JSON":
            gltf = json.loads(chunk)
        elif ct == b"BIN\x00":
            blob = chunk
    if gltf is None:
        raise SystemExit(f"no JSON chunk in {path}")
    return gltf, blob


def write_glb(path: Path, gltf: dict[str, Any], bin_blob: bytes) -> None:
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "
    while len(bin_blob) % 4:
        bin_blob += b"\x00"
    out = b"glTF" + struct.pack("<II", 2, 12 + 8 + len(json_bytes) + 8 + len(bin_blob))
    out += struct.pack("<I4s", len(json_bytes), b"JSON") + json_bytes
    out += struct.pack("<I4s", len(bin_blob), b"BIN\x00") + bin_blob
    path.write_bytes(out)


def accessor_f32(gltf: dict[str, Any], blob: bytes, acc_i: int) -> list[float]:
    acc = gltf["accessors"][acc_i]
    bv = gltf["bufferViews"][acc["bufferView"]]
    start = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    comps = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[acc["type"]]
    count = acc["count"] * comps
    return list(struct.unpack_from(f"<{count}f", blob, start))


def detect_lower(nodes: list[dict[str, Any]]) -> tuple[str, tuple[str, ...]]:
    names = {n.get("name") for n in nodes}
    if "Hips" in names:
        return "mixamo", MIXAMO_LOWER
    if "root.x" in names:
        return "rigify", RIGIFY_LOWER
    raise SystemExit("unknown rig")


def first_frame_tracks(
    gltf: dict[str, Any],
    blob: bytes,
    anim: dict[str, Any],
    nodes: list[dict[str, Any]],
    bones: tuple[str, ...],
) -> dict[tuple[str, str], list[float]]:
    by_name = {n.get("name"): i for i, n in enumerate(nodes)}
    want = {by_name[b] for b in bones if b in by_name}
    out: dict[tuple[str, str], list[float]] = {}
    for ch in anim["channels"]:
        node_i = ch["target"]["node"]
        if node_i not in want:
            continue
        path = ch["target"]["path"]
        if path not in ("translation", "rotation"):
            continue
        samp = anim["samplers"][ch["sampler"]]
        values = accessor_f32(gltf, blob, samp["output"])
        comps = 3 if path == "translation" else 4
        out[(nodes[node_i]["name"], path)] = values[:comps]
    return out


def append_f32(blob: bytearray, values: list[float]) -> tuple[int, int]:
    while len(blob) % 4:
        blob.append(0)
    offset = len(blob)
    packed = struct.pack(f"<{len(values)}f", *values)
    blob.extend(packed)
    return offset, len(packed)


def patch_clip(
    gltf: dict[str, Any],
    blob: bytearray,
    anim: dict[str, Any],
    nodes: list[dict[str, Any]],
    source: dict[tuple[str, str], list[float]],
) -> int:
    """Replace lower-body channels with constant tracks from `source`. Returns patched count."""
    by_name = {n.get("name"): i for i, n in enumerate(nodes)}
    accessors = gltf.setdefault("accessors", [])
    buffer_views = gltf.setdefault("bufferViews", [])
    samplers = anim["samplers"]
    patched = 0

    # Ensure every source track exists as a channel (desk clips may omit hips).
    existing = {
        (nodes[ch["target"]["node"]].get("name"), ch["target"]["path"]): ch
        for ch in anim["channels"]
        if ch["target"]["node"] < len(nodes)
    }

    for (bone, path), frame in source.items():
        node_i = by_name.get(bone)
        if node_i is None:
            continue
        # Match destination sampler length to keep other bones in sync.
        times_acc = None
        if anim["channels"]:
            times_acc = samplers[anim["channels"][0]["sampler"]]["input"]
        if times_acc is None:
            continue
        times = accessor_f32(gltf, bytes(blob), times_acc)
        n = len(times)
        comps = len(frame)
        values: list[float] = []
        for _ in range(n):
            values.extend(frame)

        off, length = append_f32(blob, values)
        bv_i = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": off, "byteLength": length})
        acc_i = len(accessors)
        type_name = "VEC3" if comps == 3 else "VEC4"
        accessors.append(
            {
                "bufferView": bv_i,
                "componentType": 5126,
                "count": n,
                "type": type_name,
            }
        )

        key = (bone, path)
        if key in existing:
            ch = existing[key]
            samp = samplers[ch["sampler"]]
            samp["output"] = acc_i
            samp["interpolation"] = "LINEAR"
        else:
            samp_i = len(samplers)
            samplers.append({"input": times_acc, "output": acc_i, "interpolation": "LINEAR"})
            anim["channels"].append(
                {"sampler": samp_i, "target": {"node": node_i, "path": path}}
            )
        patched += 1
    return patched


def patch_file(path: Path, out: Path | None = None) -> Path:
    gltf, raw = load_glb(path)
    nodes = gltf.get("nodes") or []
    _rig, bones = detect_lower(nodes)
    anims = {a.get("name"): a for a in gltf.get("animations") or []}
    sitting = anims.get("sitting")
    if not sitting:
        print(f"skip {path.name}: no sitting clip")
        return path

    source = first_frame_tracks(gltf, raw, sitting, nodes, bones)
    if ("Hips", "translation") not in source and ("root.x", "translation") not in source:
        print(f"skip {path.name}: sitting has no hip translation")
        return path

    blob = bytearray(raw)
    total = 0
    for name in DESK_CLIPS:
        anim = anims.get(name)
        if not anim:
            continue
        total += patch_clip(gltf, blob, anim, nodes, source)

    gltf["buffers"][0]["byteLength"] = len(blob)
    dest = out or path
    write_glb(dest, gltf, bytes(blob))
    digest = hashlib.sha256(dest.read_bytes()).hexdigest()[:12]
    print(f"patched {path.name} -> {dest.name} channels={total} sha12={digest}")
    return dest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument(
        "--hashed",
        action="store_true",
        help="Write alongside as name.<sha12>.glb instead of overwriting",
    )
    args = parser.parse_args()
    for src in args.inputs:
        if args.hashed:
            tmp = src.with_suffix(".patched.glb")
            patch_file(src, tmp)
            digest = hashlib.sha256(tmp.read_bytes()).hexdigest()[:12]
            # avatar_female.OLDHASH.glb -> avatar_female.NEWHASH.glb
            stem = src.name
            base = stem.split(".")[0]  # avatar_female
            final = src.with_name(f"{base}.{digest}.glb")
            tmp.replace(final)
            print(f"  wrote {final.name}")
        else:
            patch_file(src)


if __name__ == "__main__":
    main()
