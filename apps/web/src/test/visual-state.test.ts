import { describe, expect, it } from "vitest";
import { toVisualState } from "@mokaid/shared-types";

describe("toVisualState", () => {
  it("maps busy agents to typing", () => {
    expect(toVisualState("busy", "online")).toBe("typing");
  });

  it("maps active agents without a task to waiting", () => {
    expect(toVisualState("active", "online")).toBe("waiting");
    expect(toVisualState("active", "online", { has_task: false })).toBe("waiting");
  });

  it("maps active agents with a task to working", () => {
    expect(toVisualState("active", "online", { has_task: true })).toBe("working");
  });

  it("maps idle agents online to waiting", () => {
    expect(toVisualState("idle", "online")).toBe("waiting");
  });

  it("maps offline presence for idle agents", () => {
    expect(toVisualState("idle", "offline")).toBe("offline");
  });

  it("prioritizes celebration and approvals", () => {
    expect(toVisualState("busy", "online", { celebrating: true })).toBe("celebrating");
    expect(toVisualState("busy", "online", { waiting_approval: true })).toBe("requesting_approval");
  });

  it("maps blocked and waiting states", () => {
    expect(toVisualState("blocked", "online")).toBe("blocked");
    expect(toVisualState("waiting", "online")).toBe("waiting");
  });
});
