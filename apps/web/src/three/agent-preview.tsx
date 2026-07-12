/**
 * AgentPreview3D — minimal Babylon scene showing a single standing character.
 *
 * Uses the catalog male avatar GLB (baked AgentVisualState clips).
 */

import { useEffect, useRef, useState } from "react";
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  PointerEventTypes,
  Scene,
  SceneLoader,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { AbstractMesh } from "@babylonjs/core";
import { Avatar } from "@/components/ui/avatar";

import { AGENT_GLB_URL, applyTint } from "./agent-model";

interface Props {
  color: string;
  name: string;
  /** Width/height in px. Defaults to 220 × 300. */
  width?: number;
  height?: number;
}

export function AgentPreview3D({ color, name, width = 220, height = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const meshesRef = useRef<AbstractMesh[]>([]);
  const [failed, setFailed] = useState(false);

  // Initialise engine + scene + load GLB once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let engine: Engine;

    async function init() {
      try {
        engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
        engineRef.current = engine;

        const scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 0); // transparent background

        // Placeholder camera — will be repositioned after GLB bounding box is known.
        const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 2.5, 5, Vector3.Zero(), scene);

        // Lock to horizontal-only rotation (vertical axis).
        // beta = π/2.5 ≈ 72° from top → slight elevated view of a standing figure.
        const FIXED_BETA = Math.PI / 2.5;
        camera.lowerBetaLimit = FIXED_BETA;
        camera.upperBetaLimit = FIXED_BETA;

        // Disable zoom (keep radius fixed).
        camera.lowerRadiusLimit = camera.radius;
        camera.upperRadiusLimit = camera.radius;

        // Block wheel zoom; allow only horizontal left-drag orbit.
        canvasRef.current?.addEventListener("wheel", (e) => e.preventDefault(), {
          passive: false,
        });
        camera.attachControl(canvas, true);

        // Lights
        const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
        hemi.intensity = 0.9;
        hemi.diffuse = Color3.White();
        hemi.specular = new Color3(0.2, 0.2, 0.2);

        // Load GLB
        const result = await SceneLoader.ImportMeshAsync("", AGENT_GLB_URL, "", scene);
        if (disposed) return;

        meshesRef.current = result.meshes;

        // --- Fit the character so feet rest exactly at y=0 ---
        const root = result.meshes.find((m) => !m.parent) ?? result.meshes[0];
        if (root) {
          root.computeWorldMatrix(true);
          const bounds = root.getHierarchyBoundingVectors(true);
          const modelHeight = bounds.max.y - bounds.min.y;

          // Translate so the lowest point of the mesh sits at y = 0.
          root.position.y = -bounds.min.y;

          // --- Reposition camera to frame the full standing figure ---
          // Target = vertical centre of the model.
          const midY = modelHeight / 2;
          camera.target = new Vector3(0, midY, 0);

          // Distance: half the model height / tan(half-FOV) gives a tight fit.
          // canvas is portrait (height > width), so height is the constraining axis.
          const fovY = camera.fov; // default ~0.8 rad
          const aspectRatio = width / height;
          // We want the full height visible with a small margin (×1.15).
          const distByHeight = modelHeight / 2 / Math.tan(fovY / 2) * 1.15;
          // Also ensure the width fits (in case the model is wide).
          const modelWidth = bounds.max.x - bounds.min.x;
          const distByWidth = modelWidth / 2 / Math.tan((fovY * aspectRatio) / 2) * 1.15;
          const distance = Math.max(distByHeight, distByWidth);

          camera.radius = distance;
          camera.lowerRadiusLimit = distance;
          camera.upperRadiusLimit = distance;
          camera.beta = FIXED_BETA;
        }

        // Stop all default animations so idle is the only one playing.
        result.animationGroups.forEach((ag) => ag.stop());

        // Play idle animation if available.
        const idle =
          result.animationGroups.find((ag) => ag.name.toLowerCase().includes("idle")) ??
          result.animationGroups[0];
        if (idle) idle.start(true);

        // Tint all meshes with the initial color.
        applyTint(result.meshes, color);

        // Slow auto-rotation — rotate the root node around the vertical (Y) axis.
        let autoAngle = 0;
        let isDragging = false;

        scene.onPointerObservable.add((info) => {
          if (info.type === PointerEventTypes.POINTERDOWN) isDragging = true;
          if (info.type === PointerEventTypes.POINTERUP) isDragging = false;
        });

        scene.onBeforeRenderObservable.add(() => {
          // Pause auto-spin while the user is dragging.
          if (!isDragging) autoAngle += 0.006;
          if (root) root.rotation.y = autoAngle;
        });

        engine.runRenderLoop(() => {
          if (!disposed) scene.render();
        });
      } catch (err) {
        console.warn("[AgentPreview3D] load failed, falling back to 2D", err);
        if (!disposed) setFailed(true);
      }
    }

    init();

    return () => {
      disposed = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      meshesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // React to color changes without recreating the scene.
  useEffect(() => {
    if (meshesRef.current.length > 0) {
      applyTint(meshesRef.current, color);
    }
  }, [color]);

  if (failed) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <Avatar name={name} size="xl" isAi color={color} />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: "block" }}
      aria-label={`3D preview of agent ${name}`}
    />
  );
}

interface HeadProps {
  color: string;
  name: string;
  /** Diameter in px. Renders into a square canvas cropped to a circle. */
  size?: number;
}

/**
 * AgentHeadPreview3D — tight headshot crop of the shared character rig.
 *
 * Same GLB/tint pipeline as AgentPreview3D, but the camera is framed on the
 * top slice of the model's bounding box (the head) instead of the full body.
 * Used where a compact "portrait" is needed, e.g. the agent profile panel.
 */
export function AgentHeadPreview3D({ color, name, size = 80 }: HeadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const meshesRef = useRef<AbstractMesh[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let engine: Engine;

    async function init() {
      try {
        engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
        engineRef.current = engine;

        const scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 0);

        const camera = new ArcRotateCamera("head-cam", -Math.PI / 2, Math.PI / 2, 1, Vector3.Zero(), scene);
        camera.inputs.clear(); // static shot — no user control needed for a portrait

        const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
        hemi.intensity = 1;
        hemi.diffuse = Color3.White();
        hemi.specular = new Color3(0.2, 0.2, 0.2);

        const result = await SceneLoader.ImportMeshAsync("", AGENT_GLB_URL, "", scene);
        if (disposed) return;

        meshesRef.current = result.meshes;

        const root = result.meshes.find((m) => !m.parent) ?? result.meshes[0];
        if (root) {
          root.computeWorldMatrix(true);
          const bounds = root.getHierarchyBoundingVectors(true);
          const modelHeight = bounds.max.y - bounds.min.y;
          root.position.y = -bounds.min.y;

          // Head/face sits around 73% up the standing rig; frame a tight
          // portrait around that band so it fills the circular avatar slot.
          const headY = modelHeight * 0.73;
          camera.target = new Vector3(0, headY, 0);
          const headSpan = modelHeight * 0.36;
          const fovY = camera.fov;
          const distance = (headSpan / 2 / Math.tan(fovY / 2)) * 1.15;
          camera.radius = distance;
        }

        result.animationGroups.forEach((ag) => ag.stop());
        const idle =
          result.animationGroups.find((ag) => ag.name.toLowerCase().includes("idle")) ??
          result.animationGroups[0];
        if (idle) idle.start(true);

        applyTint(result.meshes, color);

        engine.runRenderLoop(() => {
          if (!disposed) scene.render();
        });
      } catch (err) {
        console.warn("[AgentHeadPreview3D] load failed, falling back to 2D", err);
        if (!disposed) setFailed(true);
      }
    }

    init();

    return () => {
      disposed = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      meshesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  useEffect(() => {
    if (meshesRef.current.length > 0) {
      applyTint(meshesRef.current, color);
    }
  }, [color]);

  if (failed) {
    return <Avatar name={name} size="xl" isAi color={color} />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: "block", borderRadius: "9999px" }}
      aria-label={`3D portrait of agent ${name}`}
    />
  );
}
