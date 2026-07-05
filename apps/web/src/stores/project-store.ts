import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Active project context, scoped per workspace (Supabase-style
 * "workspace > project" navigation). `null` means "all projects".
 */
interface ProjectContextState {
  activeProjectByWorkspace: Record<string, string | null>;
  setActiveProject: (workspaceId: string, projectId: string | null) => void;
}

export const useProjectStore = create<ProjectContextState>()(
  persist(
    (set) => ({
      activeProjectByWorkspace: {},
      setActiveProject: (workspaceId, projectId) =>
        set((state) => ({
          activeProjectByWorkspace: {
            ...state.activeProjectByWorkspace,
            [workspaceId]: projectId,
          },
        })),
    }),
    { name: "mokaid-project-context" },
  ),
);

/** The active project id for the given workspace (null = all projects). */
export function useActiveProjectId(workspaceId: string | null): string | null {
  return useProjectStore((s) => (workspaceId ? (s.activeProjectByWorkspace[workspaceId] ?? null) : null));
}
