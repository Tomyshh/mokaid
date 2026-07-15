/**
 * Persistent host for the Babylon office: one WebGL context + canvas survive
 * React route changes. Pause on leave, resume on re-enter — no GLB reload.
 * Full dispose only on logout / workspace switch.
 */

import { OfficeScene } from "./office-scene";
import type { SceneAgent, SceneCallbacks } from "./types";

interface HostState {
  canvas: HTMLCanvasElement;
  scene: OfficeScene;
  workspaceId: string;
}

let host: HostState | null = null;

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.className = "h-full w-full outline-none";
  canvas.setAttribute("aria-label", "3D office view");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  return canvas;
}

/**
 * Attach the singleton canvas into `container` and return the live scene.
 * Reuses the existing WebGL context when remounting the same workspace.
 */
export function attachOfficeHost(
  container: HTMLElement,
  workspaceId: string,
  callbacks: SceneCallbacks,
): OfficeScene {
  if (host && host.workspaceId !== workspaceId) {
    disposeOfficeHost();
  }

  if (!host) {
    const canvas = createCanvas();
    container.appendChild(canvas);
    const scene = new OfficeScene(canvas, callbacks);
    host = { canvas, scene, workspaceId };
    return scene;
  }

  if (host.canvas.parentElement !== container) {
    container.appendChild(host.canvas);
  }
  host.scene.setCallbacks(callbacks);
  host.scene.resume();
  return host.scene;
}

/** Pause rendering and detach the canvas without destroying WebGL. */
export function detachOfficeHost(container?: HTMLElement | null) {
  if (!host) return;
  host.scene.pause();
  const parent = host.canvas.parentElement;
  if (parent && (!container || parent === container)) {
    parent.removeChild(host.canvas);
  }
}

/** Tear down WebGL + canvas (logout or workspace change). */
export function disposeOfficeHost() {
  if (!host) return;
  host.scene.dispose();
  host.canvas.remove();
  host = null;
}

export function getOfficeHostScene(): OfficeScene | null {
  return host?.scene ?? null;
}

export function updateOfficeHostAgents(agents: SceneAgent[]) {
  host?.scene.updateAgents(agents);
}
