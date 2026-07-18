#!/usr/bin/env python3
"""IK-based arm hang bake for Meshy gesture binds.

  blender --background --python scripts/bake-avatar-hang-ik.py -- \\
    --input /tmp/dev.glb --output /tmp/out.glb --preview /tmp/out.png
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector

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
    p.add_argument("--hand-x", type=float, default=0.17)
    p.add_argument("--hand-drop", type=float, default=0.30)
    return p.parse_args(argv)


def clear_constraints(pb) -> None:
    while pb.constraints:
        pb.constraints.remove(pb.constraints[0])


def wpos(arm, name: str) -> Vector:
    return (arm.matrix_world @ arm.pose.bones[name].matrix).to_translation()


def clip_name(action_name: str) -> str:
    aname = action_name.lower()
    clip = aname.split("|")[1] if "|" in aname else aname
    return clip.split(".")[0]


def main() -> None:
    args = parse_args(sys.argv)
    print(f"[bake-avatar-hang-ik] {args.input}")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(args.input.resolve()))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")

    for pb in arm.pose.bones:
        clear_constraints(pb)
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = Quaternion((1, 0, 0, 0))
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()

    hips = wpos(arm, "Hips")
    targets = {
        "LeftHand": Vector((args.hand_x, hips.y, hips.z - args.hand_drop)),
        "RightHand": Vector((-args.hand_x, hips.y, hips.z - args.hand_drop)),
    }
    empties = []
    for bone, loc in targets.items():
        e = bpy.data.objects.new(f"ik_{bone}", None)
        bpy.context.scene.collection.objects.link(e)
        e.location = loc
        empties.append(e)
        pb = arm.pose.bones[bone]
        ik = pb.constraints.new("IK")
        ik.target = e
        ik.chain_count = 4
        ik.influence = 1.0

    # Let the depsgraph solve IK
    for _ in range(8):
        bpy.context.view_layer.update()

    lh, rh = wpos(arm, "LeftHand"), wpos(arm, "RightHand")
    print(f"  IK L={tuple(round(c,3) for c in lh)} R={tuple(round(c,3) for c in rh)}")
    print(f"  tgt L={tuple(round(c,3) for c in targets['LeftHand'])}")

    # Select arm bones and bake visual keys onto standing actions
    for pb in arm.pose.bones:
        pb.select = False
    for name in ARM_BONES:
        if name in arm.pose.bones:
            arm.pose.bones[name].select = True

    for action in list(bpy.data.actions):
        if clip_name(action.name) not in STANDING:
            continue
        arm.animation_data_create()
        arm.animation_data.action = action
        f0, f1 = int(action.frame_range[0]), int(action.frame_range[1])
        if f1 <= f0:
            f0, f1 = 1, 48
        bpy.context.scene.frame_start = f0
        bpy.context.scene.frame_end = f1
        # Bake visual pose (includes IK) for selected bones only
        bpy.ops.nla.bake(
            frame_start=f0,
            frame_end=f1,
            only_selected=True,
            visual_keying=True,
            clear_constraints=False,
            clear_parents=False,
            use_current_action=True,
            bake_types={"POSE"},
        )
        print(f"  baked visual '{action.name}'")

    # Remove IK after bake
    for name in ("LeftHand", "RightHand"):
        clear_constraints(arm.pose.bones[name])
    for e in empties:
        bpy.data.objects.remove(e, do_unlink=True)

    if args.preview:
        idle = next((a for a in bpy.data.actions if clip_name(a.name) == "idle"), None)
        if idle:
            arm.animation_data_create()
            arm.animation_data.action = idle
            bpy.context.scene.frame_set(int(idle.frame_range[0]))
            bpy.context.view_layer.update()
        hips = wpos(arm, "Hips")
        lh = wpos(arm, "LeftHand")
        print(f"  IDLE L={tuple(round(c,3) for c in lh)}")
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
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(args.preview.resolve())
        bpy.ops.render.render(write_still=True)
        print(f"  preview {args.preview}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.export_scene.gltf(
        filepath=str(args.output.resolve()),
        export_format="GLB",
        use_selection=False,
        export_animations=True,
        export_skins=True,
        export_morph=True,
        export_apply=False,
    )
    print(f"  wrote {args.output} ({args.output.stat().st_size} bytes)")
    print("[bake-avatar-hang-ik] done")


if __name__ == "__main__":
    main()
