#!/usr/bin/env python3
"""Blender helper: render idle front (+ optional side).

  blender --background --python scripts/_render-idle-preview.py -- \\
    --input /tmp/x.glb --output /tmp/x.png
"""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


def parse_args(argv: list[str]):
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    inp = Path(argv[argv.index("--input") + 1])
    out = Path(argv[argv.index("--output") + 1])
    return inp, out


def main() -> None:
    inp, out = parse_args(sys.argv)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(inp.resolve()))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    idle = None
    for a in bpy.data.actions:
        name = a.name.lower().split("|")[-1].split(".")[0]
        if name == "idle":
            idle = a
            break
    if idle is None and bpy.data.actions:
        idle = bpy.data.actions[0]
    if idle:
        arm.animation_data_create()
        arm.animation_data.action = idle
        bpy.context.scene.frame_set(int(idle.frame_range[0]))
        bpy.context.view_layer.update()

    hips = (arm.matrix_world @ arm.pose.bones["Hips"].matrix).to_translation()
    lh = (arm.matrix_world @ arm.pose.bones["LeftHand"].matrix).to_translation()
    print(f"  IDLE LHand={tuple(round(c, 3) for c in lh)}")

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
    out.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(out.resolve())
    bpy.ops.render.render(write_still=True)
    print(f"  wrote {out}")


if __name__ == "__main__":
    main()
