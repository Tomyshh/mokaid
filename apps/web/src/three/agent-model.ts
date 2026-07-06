/**
 * Shared RobotExpressive GLB loader — used in onboarding preview and office scene.
 */

import {
  AnimationGroup,
  AssetContainer,
  Color3,
  PBRMaterial,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { AbstractMesh } from "@babylonjs/core";

export const AGENT_GLB_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb";

const TARGET_HEIGHT = 1.75;

export interface AgentModelTemplate {
  container: AssetContainer;
  idleAnim: AnimationGroup | null;
  walkAnim: AnimationGroup | null;
  scale: number;
  footOffset: number;
}

export interface SpawnedAgentModel {
  root: TransformNode;
  meshes: AbstractMesh[];
  idleAnim: AnimationGroup | null;
  walkAnim: AnimationGroup | null;
  labelHeight: number;
}

// Cache per scene so that disposing a scene (e.g. when navigating away and back)
// never returns a stale AssetContainer linked to the old Babylon engine.
const templateCache = new WeakMap<Scene, Promise<AgentModelTemplate>>();

export function loadAgentModelTemplate(scene: Scene): Promise<AgentModelTemplate> {
  const cached = templateCache.get(scene);
  if (cached) return cached;

  const promise = SceneLoader.LoadAssetContainerAsync("", AGENT_GLB_URL, scene).then(
    (container) => {
      const probe = container.instantiateModelsToScene(
        (name) => `probe-${name}`,
        false,
        { doNotInstantiate: false },
      );

      const root = probe.rootNodes[0] as TransformNode | undefined;
      let scale = 1;
      let footOffset = 0;

      if (root) {
        root.computeWorldMatrix(true);
        const bounds = root.getHierarchyBoundingVectors(true);
        const height = bounds.max.y - bounds.min.y;
        scale = height > 0 ? TARGET_HEIGHT / height : 1;
        footOffset = -bounds.min.y * scale;
      }

      probe.rootNodes.forEach((n) => n.dispose());
      probe.skeletons.forEach((s) => s.dispose());

      const idleAnim = findAnim(container, ["idle"]);
      const walkAnim = findAnim(container, ["walk", "walking"]);

      return { container, idleAnim, walkAnim, scale, footOffset };
    },
  );

  templateCache.set(scene, promise);
  return promise;
}

export function spawnAgentModel(
  template: AgentModelTemplate,
  scene: Scene,
  agentId: string,
  color: string,
): SpawnedAgentModel {
  const instance = template.container.instantiateModelsToScene(
    (name) => `agent-${agentId}-${name}`,
    false,
    { doNotInstantiate: false },
  );

  const root = (instance.rootNodes[0] as TransformNode) ?? new TransformNode(`agent-${agentId}`, scene);
  root.scaling.setAll(template.scale);
  // glTF import sets rotationQuaternion, which silently overrides `.rotation` —
  // clear it so the walk/idle state machine's Euler rotation.y takes effect.
  root.rotationQuaternion = null;

  const meshes: AbstractMesh[] = [];
  for (const node of instance.rootNodes) {
    meshes.push(...node.getChildMeshes(false));
  }

  applyTint(meshes, color);

  for (const mesh of meshes) {
    mesh.isPickable = true;
    mesh.metadata = { agentId };
  }

  root.computeWorldMatrix(true);
  const bounds = root.getHierarchyBoundingVectors(true);
  const labelHeight = bounds.max.y - root.position.y + 0.25;

  const idleAnim =
    instance.animationGroups.find((ag) => ag.name.toLowerCase().includes("idle")) ?? null;
  const walkAnim =
    instance.animationGroups.find((ag) => ag.name.toLowerCase().includes("walk")) ?? null;

  return { root, meshes, idleAnim, walkAnim, labelHeight };
}

export function playAgentAnimation(
  avatar: { idleAnim: AnimationGroup | null; walkAnim: AnimationGroup | null; currentAnim: "idle" | "walk" | null },
  next: "idle" | "walk",
) {
  if (avatar.currentAnim === next) return;
  avatar.idleAnim?.stop();
  avatar.walkAnim?.stop();
  if (next === "walk") avatar.walkAnim?.start(true);
  else avatar.idleAnim?.start(true);
  avatar.currentAnim = next;
}

export function groundAgent(root: TransformNode, footOffset: number) {
  root.position.y = footOffset;
}

function findAnim(container: AssetContainer, keywords: string[]): AnimationGroup | null {
  return (
    container.animationGroups.find((ag) =>
      keywords.some((kw) => ag.name.toLowerCase().includes(kw)),
    ) ?? null
  );
}

function hexToColor3(hex: string): Color3 {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new Color3(r, g, b);
}

export function applyTint(meshes: AbstractMesh[], hex: string) {
  const tint = hexToColor3(hex);
  for (const mesh of meshes) {
    if (!mesh.material) continue;
    if (mesh.material instanceof PBRMaterial) mesh.material.albedoColor = tint;
    else if (mesh.material instanceof StandardMaterial) mesh.material.diffuseColor = tint;
  }
}

/** Project a position onto the walkable floor (y = 0). */
export function toFloor(x: number, z: number): Vector3 {
  return new Vector3(x, 0, z);
}
