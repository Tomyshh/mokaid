#!/usr/bin/env python3
"""Bake a natural arm hang into standing clips (idle/waiting/…).

Pipeline (Blender):
  1. Import source GLB
  2. Search / force a hang pose in Pose Mode
  3. Export pose-only GLB (no anim) → read absolute local node rotations
  4. Patch those quats into standing clips of the ORIGINAL glTF (Python)

This avoids Blender action/channelbag export bugs that produced folded arms.

  blender --background --python scripts/bake-avatar-hang.py -- \\
    --input assets/optimized/avatar_design.glb \\
    --output /tmp/out.glb --preview /tmp/out.png
"""

from __future__ import annotations

import argparse
import itertools
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Quaternion, Vector

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


def parse_args(argv: list[str]) -> argparse.Namespace:
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--preview", type=Path, default=None)
    p.add_argument("--prefer-rest", action="store_true")
    p.add_argument("--arm", type=float, nargs=3, default=None)
    p.add_argument("--fore", type=float, nargs=3, default=None)
    p.add_argument("--shoulder", type=float, nargs=3, default=None)
    p.add_argument("--shorten-arms", type=float, default=1.0)
    return p.parse_args(argv)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def find_armature():
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            return obj
    raise RuntimeError("no armature")


def wpos(arm, name: str) -> Vector:
    return (arm.matrix_world @ arm.pose.bones[name].matrix).to_translation()


def clear_pose(arm) -> None:
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = Quaternion((1, 0, 0, 0))
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()


def shorten_arm_bones(arm, factor: float) -> None:
    if abs(factor - 1.0) < 1e-4:
        return
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    edit = arm.data.edit_bones
    for name in ("LeftArm", "RightArm", "LeftForeArm", "RightForeArm"):
        eb = edit.get(name)
        if eb is None:
            continue
        direction = (eb.tail - eb.head).normalized()
        length = (eb.tail - eb.head).length
        eb.tail = eb.head + direction * (length * factor)
        print(f"  shorten {name}: {length:.4f} -> {length * factor:.4f}")
    bpy.ops.object.mode_set(mode="OBJECT")


def set_mirrored_pose(arm, arm_e, fore_e, shoulder_e, hand_e=(0.0, 0.05, 0.05)) -> None:
    clear_pose(arm)
    ax, ay, az = arm_e
    fx, fy, fz = fore_e
    sx, sy, sz = shoulder_e
    hx, hy, hz = hand_e
    mapping = {
        "LeftShoulder": (sx, sy, sz),
        "RightShoulder": (sx, -sy, -sz),
        "LeftArm": (ax, ay, az),
        "RightArm": (ax, -ay, -az),
        "LeftForeArm": (fx, fy, fz),
        "RightForeArm": (fx, -fy, -fz),
        "LeftHand": (hx, hy, hz),
        "RightHand": (hx, -hy, -hz),
    }
    for name, eul in mapping.items():
        pb = arm.pose.bones.get(name)
        if pb is None:
            continue
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = Euler(eul, "XYZ")
        pb.rotation_mode = "QUATERNION"
    bpy.context.view_layer.update()


def pose_metrics(arm) -> tuple[float, bool, tuple]:
    hips = wpos(arm, "Hips")
    lh, rh = wpos(arm, "LeftHand"), wpos(arm, "RightHand")
    la, ra = wpos(arm, "LeftArm"), wpos(arm, "RightArm")
    le, re = wpos(arm, "LeftForeArm"), wpos(arm, "RightForeArm")
    l_len = (lh - la).length
    r_len = (rh - ra).length
    # After glTF import: -Y toward camera (forward). Hands/elbows must stay near hip depth.
    def depth_err(p: Vector) -> float:
        return abs(p.y - hips.y)

    def behind_err(p: Vector) -> float:
        # positive y relative to hips = behind body (bad for hang silhouette)
        return max(0.0, p.y - hips.y - 0.04)

    def forward_err(p: Vector) -> float:
        return max(0.0, hips.y - p.y - 0.04)

    # Upper arm should point mostly downward (negative Z in Blender after import)
    def down_align(shoulder: Vector, elbow: Vector) -> float:
        v = elbow - shoulder
        if v.length < 1e-6:
            return 1.0
        v.normalize()
        # 1 = pointing up, 0 = horizontal, -1 = down. Want close to -1.
        return 1.0 + v.z  # 0 when fully down

    ok = (
        lh.x > 0.11
        and rh.x < -0.11
        and abs(lh.x) <= 0.26
        and abs(rh.x) <= 0.26
        and le.x > 0.08
        and re.x < -0.08
        and forward_err(lh) <= 0.06
        and forward_err(rh) <= 0.06
        and behind_err(lh) <= 0.06
        and behind_err(rh) <= 0.06
        and behind_err(le) <= 0.08
        and behind_err(re) <= 0.08
        and down_align(la, le) < 0.55
        and down_align(ra, re) < 0.55
        and l_len > 0.18
        and r_len > 0.18
        and lh.z < hips.z + 0.02
        and rh.z < hips.z + 0.02
        and le.z > lh.z + 0.05  # elbow above hand
        and re.z > rh.z + 0.05
    )
    target_z = hips.z - 0.20
    score = (
        abs(lh.z - target_z) * 2.0
        + abs(rh.z - target_z) * 2.0
        + depth_err(lh) * 8.0
        + depth_err(rh) * 8.0
        + depth_err(le) * 6.0
        + depth_err(re) * 6.0
        + behind_err(lh) * 14.0
        + behind_err(rh) * 14.0
        + behind_err(le) * 12.0
        + behind_err(re) * 12.0
        + forward_err(lh) * 10.0
        + forward_err(rh) * 10.0
        + down_align(la, le) * 5.0
        + down_align(ra, re) * 5.0
        + abs(abs(lh.x) - 0.17) * 1.5
        + abs(abs(rh.x) - 0.17) * 1.5
        + max(0.0, lh.z - hips.z) * 10.0
        + max(0.0, rh.z - hips.z) * 10.0
        + max(0.0, 0.12 - abs(lh.x)) * 8.0
        + max(0.0, 0.12 - abs(rh.x)) * 8.0
    )
    return score, ok, (lh, rh)


def discover_hang(arm, args) -> None:
    clear_pose(arm)
    score, ok, (lh, rh) = pose_metrics(arm)
    print(f"  REST L={tuple(round(c,3) for c in lh)} score={score:.3f} ok={ok}")

    if args.prefer_rest and ok and score <= 2.5:
        print("  prefer-rest: bind hang")
        return

    if args.arm is not None:
        arm_e = tuple(args.arm)
        fore_e = tuple(args.fore) if args.fore else (-0.25, 0.0, 0.05)
        sh_e = tuple(args.shoulder) if args.shoulder else (0.06, 0.12, 0.15)
        set_mirrored_pose(arm, arm_e, fore_e, sh_e)
        score, ok, (lh, rh) = pose_metrics(arm)
        print(f"  FORCED L={tuple(round(c,3) for c in lh)} score={score:.3f} ok={ok}")
        return

    best_s = 1e9
    best = None
    best_any_s = 1e9
    best_any = None
    # Wide search; keep best valid, and best-any as fallback for gesture binds
    for ax, ay, az, fx, sy in itertools.product(
        [-0.3, 0.0, 0.4, 0.8, 1.1, 1.4, 1.7],
        [-0.6, -0.3, 0.0, 0.3, 0.6],
        [-0.8, -0.4, 0.0, 0.4, 0.8, 1.2],
        [-0.55, -0.35, -0.15, 0.0, 0.15],
        [0.05, 0.12, 0.2],
    ):
        set_mirrored_pose(arm, (ax, ay, az), (fx, 0.04, 0.05), (0.05, sy, 0.15))
        score, ok, _ = pose_metrics(arm)
        if score < best_any_s:
            best_any_s = score
            best_any = ((ax, ay, az), (fx, 0.04, 0.05), (0.05, sy, 0.15))
        if not ok:
            continue
        if score < best_s:
            best_s = score
            best = ((ax, ay, az), (fx, 0.04, 0.05), (0.05, sy, 0.15))

    if best is None:
        print(f"  WARN: no strict candidate — using best-any score={best_any_s:.3f}")
        best = best_any
        best_s = best_any_s

    if best is None:
        print("  WARN: empty search — keeping bind")
        clear_pose(arm)
        return

    set_mirrored_pose(arm, *best)
    score, ok, (lh, rh) = pose_metrics(arm)
    le, re = wpos(arm, "LeftForeArm"), wpos(arm, "RightForeArm")
    print(f"  BEST arm={best[0]} fore={best[1][0]} score={best_s:.3f} ok={ok}")
    print(f"  HANG L={tuple(round(c,3) for c in lh)} R={tuple(round(c,3) for c in rh)}")
    print(f"  ELBOW L={tuple(round(c,3) for c in le)} R={tuple(round(c,3) for c in re)}")


def snapshot_pose_quats(arm) -> dict[str, Quaternion]:
    out: dict[str, Quaternion] = {}
    for name in ARM_BONES:
        pb = arm.pose.bones.get(name)
        if pb is None:
            continue
        pb.rotation_mode = "QUATERNION"
        out[name] = pb.rotation_quaternion.copy()
    return out


def clip_name(action_name: str) -> str:
    aname = action_name.lower()
    clip = aname.split("|")[1] if "|" in aname else aname
    return clip.split(".")[0]


def key_hang_on_standing(arm, quats: dict[str, Quaternion]) -> None:
    """Key pose-delta quats on standing actions via keyframe_insert (Blender 5 safe)."""
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for action in list(bpy.data.actions):
        if clip_name(action.name) not in STANDING:
            continue
        arm.animation_data_create()
        arm.animation_data.action = action
        f0, f1 = int(action.frame_range[0]), int(action.frame_range[1])
        if f1 <= f0:
            f0, f1 = 1, 48
        # Clear existing arm rotation keys on this action
        try:
            for layer in action.layers:
                for strip in layer.strips:
                    for cb in strip.channelbags:
                        to_remove = [
                            fc
                            for fc in cb.fcurves
                            if any(f'pose.bones["{b}"]' in fc.data_path for b in ARM_BONES)
                            and "rotation" in fc.data_path
                        ]
                        for fc in to_remove:
                            cb.fcurves.remove(fc)
        except Exception:
            pass
        for name, q in quats.items():
            pb = arm.pose.bones.get(name)
            if pb is None:
                continue
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = q.copy()
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f0)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f1)
        print(f"  keyed '{action.name}'")


def export_glb(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path.resolve()),
        export_format="GLB",
        use_selection=False,
        export_animations=True,
        export_skins=True,
        export_morph=True,
        export_apply=False,
    )
    print(f"  wrote {path} ({path.stat().st_size} bytes)")


def render_preview(arm, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    hips = wpos(arm, "Hips")
    cam_data = bpy.data.cameras.new("preview_cam")
    cam = bpy.data.objects.new("preview_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = (0.0, hips.y - 3.0, hips.z + 0.05)
    cam.rotation_euler = (1.42, 0.0, 0.0)
    light_data = bpy.data.lights.new("preview_key", "AREA")
    light_data.energy = 500
    light = bpy.data.objects.new("preview_key", light_data)
    bpy.context.scene.collection.objects.link(light)
    light.location = (1.2, -2.2, 2.4)
    scene = bpy.context.scene
    scene.camera = cam
    scene.render.resolution_x = 420
    scene.render.resolution_y = 640
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(path.resolve())
    bpy.ops.render.render(write_still=True)
    lh = wpos(arm, "LeftHand")
    print(f"  preview {path} LHand={tuple(round(c,3) for c in lh)}")


def main() -> None:
    args = parse_args(sys.argv)
    src = args.input.resolve()
    print(f"[bake-avatar-hang] {src}")
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(src))
    arm = find_armature()
    shorten_arm_bones(arm, args.shorten_arms)
    discover_hang(arm, args)
    quats = snapshot_pose_quats(arm)
    for name, q in quats.items():
        print(f"  {name}: ({q.w:.4f},{q.x:.4f},{q.y:.4f},{q.z:.4f})")
    key_hang_on_standing(arm, quats)
    if args.preview:
        # Re-evaluate idle after keying
        idle = next(
            (a for a in bpy.data.actions if clip_name(a.name) == "idle"),
            None,
        )
        if idle:
            arm.animation_data_create()
            arm.animation_data.action = idle
            bpy.context.scene.frame_set(int(idle.frame_range[0]))
            bpy.context.view_layer.update()
        render_preview(arm, args.preview)
    export_glb(args.output.resolve())
    print("[bake-avatar-hang] done")


if __name__ == "__main__":
    main()
