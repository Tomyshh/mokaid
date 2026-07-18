#!/usr/bin/env python3
"""Fix standing clips so arms hang beside the body.

Important: some Meshy binds (research) are NOT A-pose — identity pose leaves
arms in a forward gesture. We always search a constrained mirrored pose and
preview by evaluating the idle action after keying.

  blender --background --python scripts/fix-avatar-rest-pose.py -- \\
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

STANDING_CLIPS = {"idle", "waiting", "offline", "away", "blocked"}
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
    p.add_argument("--shorten-arms", type=float, default=1.0)
    p.add_argument("--prefer-rest", action="store_true")
    # Optional forced arm euler (LeftArm x,y,z) — mirrored to right
    p.add_argument("--arm", type=float, nargs=3, default=None)
    p.add_argument("--fore", type=float, nargs=3, default=None)
    p.add_argument("--shoulder", type=float, nargs=3, default=None)
    return p.parse_args(argv)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path: Path) -> None:
    bpy.ops.import_scene.gltf(filepath=str(path.resolve()))


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
        pb.rotation_quaternion = Quaternion((1.0, 0.0, 0.0, 0.0))
        pb.location = (0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)
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


def set_mirrored_pose(
    arm,
    arm_e: tuple[float, float, float],
    fore_e: tuple[float, float, float],
    shoulder_e: tuple[float, float, float],
    hand_e: tuple[float, float, float] = (0.0, 0.05, 0.05),
) -> None:
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


def snapshot_arm_quats(arm) -> dict[str, Quaternion]:
    out: dict[str, Quaternion] = {}
    for name in ARM_BONES:
        pb = arm.pose.bones.get(name)
        if pb is None:
            continue
        pb.rotation_mode = "QUATERNION"
        out[name] = pb.rotation_quaternion.copy()
    return out


def pose_metrics(arm) -> tuple[float, bool, tuple]:
    hips = wpos(arm, "Hips")
    lh, rh = wpos(arm, "LeftHand"), wpos(arm, "RightHand")
    l_len = (lh - wpos(arm, "LeftArm")).length
    r_len = (rh - wpos(arm, "RightArm")).length
    # Hard constraints
    ok = (
        abs(lh.x) >= 0.16
        and abs(rh.x) >= 0.16
        and lh.x > 0.05
        and rh.x < -0.05
        and abs(lh.y - hips.y) <= 0.16
        and abs(rh.y - hips.y) <= 0.16
        and l_len > 0.20
        and r_len > 0.20
    )
    target_z = hips.z - 0.28
    score = (
        abs(lh.z - target_z) * 3.0
        + abs(rh.z - target_z) * 3.0
        + abs(lh.y - hips.y) * 5.0
        + abs(rh.y - hips.y) * 5.0
        + abs(abs(lh.x) - 0.24) * 1.2
        + abs(abs(rh.x) - 0.24) * 1.2
        + max(0.0, lh.z - hips.z) * 8.0
        + max(0.0, rh.z - hips.z) * 8.0
    )
    return score, ok, (lh, rh)


def discover_hang(arm, args) -> dict[str, Quaternion]:
    clear_pose(arm)
    hips = wpos(arm, "Hips")
    score, ok, (lh, rh) = pose_metrics(arm)
    print(f"  REST L={tuple(round(c,3) for c in lh)} R={tuple(round(c,3) for c in rh)} score={score:.3f} ok={ok}")

    if args.prefer_rest and ok and score <= 2.2:
        print("  prefer-rest: bind hang")
        return snapshot_arm_quats(arm)

    if args.arm is not None:
        arm_e = tuple(args.arm)
        fore_e = tuple(args.fore) if args.fore else (-0.35, 0.0, 0.05)
        sh_e = tuple(args.shoulder) if args.shoulder else (0.08, 0.12, 0.18)
        set_mirrored_pose(arm, arm_e, fore_e, sh_e)
        score, ok, (lh, rh) = pose_metrics(arm)
        print(f"  FORCED L={tuple(round(c,3) for c in lh)} score={score:.3f} ok={ok}")
        return snapshot_arm_quats(arm)

    best_s = 1e9
    best_quats = snapshot_arm_quats(arm)
    best_label = "rest"

    # Wide but safe search — includes strong +X which pulls research bind down
    for ax, ay, az, fx, sy in itertools.product(
        [0.0, 0.4, 0.7, 0.9, 1.1, 1.3],
        [-0.3, 0.0, 0.3, 0.5],
        [-0.4, 0.0, 0.4, 0.8],
        [-0.55, -0.35, -0.15, 0.0],
        [0.08, 0.15, 0.22],
    ):
        set_mirrored_pose(
            arm,
            (ax, ay, az),
            (fx, 0.05, 0.06),
            (0.06, sy, 0.18),
            (0.0, 0.08, 0.05),
        )
        score, ok, _hands = pose_metrics(arm)
        if not ok:
            continue
        if score < best_s:
            best_s = score
            best_quats = snapshot_arm_quats(arm)
            best_label = f"arm=({ax},{ay},{az}) fore={fx}"

    clear_pose(arm)
    for name, q in best_quats.items():
        pb = arm.pose.bones[name]
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = q.copy()
    bpy.context.view_layer.update()
    score, ok, (lh, rh) = pose_metrics(arm)
    print(f"  BEST [{best_label}] score={best_s if best_s < 1e9 else score:.3f} ok={ok}")
    print(f"  HANG L={tuple(round(c,3) for c in lh)} R={tuple(round(c,3) for c in rh)}")
    if best_s >= 1e9:
        print("  WARN: no candidate passed constraints — keeping bind")
    return best_quats


def iter_channelbags(action):
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                yield cb


def remove_arm_fcurves(action) -> int:
    removed = 0
    for cb in iter_channelbags(action):
        to_remove = [fc for fc in cb.fcurves if any(f'pose.bones["{b}"]' in fc.data_path for b in ARM_BONES)]
        for fc in to_remove:
            cb.fcurves.remove(fc)
            removed += 1
    return removed


def ensure_rot_fcurves(cb, bone: str):
    path = f'pose.bones["{bone}"].rotation_quaternion'
    existing = {fc.array_index: fc for fc in cb.fcurves if fc.data_path == path}
    out = []
    for idx in range(4):
        fc = existing.get(idx)
        if fc is None:
            fc = cb.fcurves.new(path, index=idx)
        while fc.keyframe_points:
            fc.keyframe_points.remove(fc.keyframe_points[0])
        out.append(fc)
    return out


def clip_name(action_name: str) -> str:
    aname = action_name.lower()
    clip = aname.split("|")[1] if "|" in aname else aname
    return clip.split(".")[0]


def key_hang_on_standing_actions(quats: dict[str, Quaternion]) -> None:
    for action in bpy.data.actions:
        if clip_name(action.name) not in STANDING_CLIPS:
            continue
        removed = remove_arm_fcurves(action)
        bags = list(iter_channelbags(action))
        if not bags:
            continue
        cb = bags[0]
        f0, f1 = int(action.frame_range[0]), int(action.frame_range[1])
        if f1 <= f0:
            f0, f1 = 1, 48
        for bone, q in quats.items():
            for fc, val in zip(ensure_rot_fcurves(cb, bone), (q.w, q.x, q.y, q.z)):
                fc.keyframe_points.insert(f0, val)
                fc.keyframe_points.insert(f1, val)
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"
        print(f"  keyed '{action.name}' (removed {removed})")


def find_action(substring: str):
    sub = substring.lower()
    for action in bpy.data.actions:
        if action.name.lower().split("|")[-1].split(".")[0] == sub:
            return action
    for action in bpy.data.actions:
        if sub in action.name.lower():
            return action
    return None


def render_preview(arm, path: Path) -> None:
    """Preview idle clip (front + side)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    idle = find_action("idle")
    if idle:
        arm.animation_data_create()
        arm.animation_data.action = idle
        bpy.context.scene.frame_set(int(idle.frame_range[0]))
        bpy.context.view_layer.update()

    bpy.ops.object.mode_set(mode="OBJECT")
    hips = wpos(arm, "Hips")

    cam_data = bpy.data.cameras.new("preview_cam")
    cam = bpy.data.objects.new("preview_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = (0.0, hips.y - 3.0, hips.z + 0.1)
    cam.rotation_euler = (1.42, 0.0, 0.0)

    side_data = bpy.data.cameras.new("side_cam")
    side = bpy.data.objects.new("side_cam", side_data)
    bpy.context.scene.collection.objects.link(side)
    side.location = (hips.x + 3.0, hips.y, hips.z + 0.1)
    side.rotation_euler = (1.5708, 0.0, 1.5708)

    light_data = bpy.data.lights.new("preview_key", "AREA")
    light_data.energy = 500
    light = bpy.data.objects.new("preview_key", light_data)
    bpy.context.scene.collection.objects.link(light)
    light.location = (1.2, -2.2, 2.4)

    scene = bpy.context.scene
    scene.render.resolution_x = 512
    scene.render.resolution_y = 768
    scene.render.image_settings.file_format = "PNG"

    scene.camera = cam
    scene.render.filepath = str(path.resolve())
    bpy.ops.render.render(write_still=True)
    print(f"  preview {path}")

    side_path = path.with_name(path.stem + "_side.png")
    scene.camera = side
    scene.render.filepath = str(side_path.resolve())
    bpy.ops.render.render(write_still=True)
    print(f"  preview {side_path}")

    lh, rh = wpos(arm, "LeftHand"), wpos(arm, "RightHand")
    print(f"  IDLE eval L={tuple(round(c,3) for c in lh)} R={tuple(round(c,3) for c in rh)}")


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


def main() -> None:
    args = parse_args(sys.argv)
    print(f"[fix-avatar-rest-pose] {args.input}")
    reset_scene()
    import_glb(args.input)
    arm = find_armature()
    shorten_arm_bones(arm, args.shorten_arms)
    quats = discover_hang(arm, args)
    for name, q in quats.items():
        print(f"  {name}: ({q.w:.4f},{q.x:.4f},{q.y:.4f},{q.z:.4f})")
    key_hang_on_standing_actions(quats)
    if args.preview:
        render_preview(arm, args.preview)
    export_glb(args.output)
    print("[fix-avatar-rest-pose] done")


if __name__ == "__main__":
    main()
