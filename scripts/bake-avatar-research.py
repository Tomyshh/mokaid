#!/usr/bin/env python3
"""Bake the research / chercheur avatar from Meshy withSkin animation dumps.

Each Meshy file includes the full skinned mesh + one clip. Pipeline:
  1. Walking_withSkin as character mesh
  2. walking_2_inplace as office `walking` (in-place)
  3. Procedural AgentVisualState fill via bake-avatar-female
  4. Overlay Talk → talking/learning, Running → celebrating

Usage:
  python3 scripts/bake-avatar-research.py assets/raw/research -o assets/raw/avatar_research.glb
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


finance = _load_module("bake_avatar_finance", ROOT / "scripts" / "bake-avatar-finance.py")

OVERLAYS: dict[str, list[str]] = {
    "talking": [
        "Armature|Talk_with_Left_Hand_on_Hip|baselayer",
        "Talk_with_Left_Hand_on_Hip",
    ],
    "learning": [
        "Armature|Talk_with_Left_Hand_on_Hip|baselayer",
        "Talk_with_Left_Hand_on_Hip",
    ],
    "celebrating": [
        "Armature|running|baselayer",
        "running",
    ],
}


def find_file(src_dir: Path, *needles: str) -> Path:
    for path in sorted(src_dir.glob("*.glb")):
        name = path.name
        if all(n in name for n in needles):
            return path
    raise SystemExit(f"missing GLB matching {needles!r} in {src_dir}")


def load_clip_library(src_dir: Path) -> list[tuple[dict[str, Any], dict[str, Any], bytes]]:
    """Return list of (anim, gltf, bin) for every source animation."""
    lib: list[tuple[dict[str, Any], dict[str, Any], bytes]] = []
    for path in sorted(src_dir.glob("*.glb")):
        gltf, blob = finance.load_glb(path)
        for anim in gltf.get("animations") or []:
            lib.append((anim, gltf, blob))
            print(f"  library: {path.name} → {anim.get('name')}")
    return lib


def find_in_library(
    lib: list[tuple[dict[str, Any], dict[str, Any], bytes]],
    candidates: list[str],
) -> tuple[dict[str, Any], dict[str, Any], bytes] | None:
    anims = [a for a, _, _ in lib]
    hit = finance.find_anim(anims, candidates)
    if hit is None:
        return None
    for anim, gltf, blob in lib:
        if anim is hit or anim.get("name") == hit.get("name"):
            return anim, gltf, blob
    return None


def replace_clip(
    out_gltf: dict[str, Any],
    builder: Any,
    char_by: dict[str, int],
    lib: list[tuple[dict[str, Any], dict[str, Any], bytes]],
    state: str,
    candidates: list[str],
) -> bool:
    found = find_in_library(lib, candidates)
    if found is None:
        print(f"warning: no source for {state}", file=sys.stderr)
        return False
    src_anim, src_gltf, src_bin = found
    print(f"  overlay {state} ← {src_anim.get('name')}")
    new_anim = finance.copy_animation(
        out_gltf=out_gltf,
        builder=builder,
        char_by=char_by,
        src_gltf=src_gltf,
        src_bin=src_bin,
        src_anim=src_anim,
        out_name=state,
    )
    anims = out_gltf.setdefault("animations", [])
    out_gltf["animations"] = [a for a in anims if a.get("name") != state]
    out_gltf["animations"].append(new_anim)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()

    src_dir = args.source_dir
    character = find_file(src_dir, "Walking_withSkin")
    # Exclude walking_2_* when looking for plain Walking_withSkin
    if "walking_2" in character.name:
        character = next(
            p
            for p in sorted(src_dir.glob("*Walking_withSkin.glb"))
            if "walking_2" not in p.name
        )
    walking = find_file(src_dir, "walking_2_inplace")

    print(f"Character: {character.name}")
    print(f"Walking:   {walking.name}")

    with tempfile.TemporaryDirectory() as tmp:
        staged = Path(tmp) / "staged.glb"
        cmd = [
            sys.executable,
            str(ROOT / "scripts" / "bake-avatar-female.py"),
            str(character),
            str(walking),
            "-o",
            str(staged),
        ]
        subprocess.check_call(cmd)

        out_gltf, out_bin = finance.load_glb(staged)
        builder = finance.BufferBuilder(out_bin)
        char_by = finance.node_index_by_name(out_gltf["nodes"])
        lib = load_clip_library(src_dir)

        for state, candidates in OVERLAYS.items():
            replace_clip(out_gltf, builder, char_by, lib, state, candidates)

        out_gltf.setdefault("buffers", [{"byteLength": 0}])[0]["byteLength"] = len(builder.data)
        finance.write_glb(args.output, out_gltf, bytes(builder.data))

    names = [a.get("name") for a in out_gltf.get("animations", [])]
    print(f"Wrote {args.output} ({args.output.stat().st_size} bytes)")
    print(f"Clips ({len(names)}): {names}")


if __name__ == "__main__":
    main()
