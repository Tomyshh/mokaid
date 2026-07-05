import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role_name?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  workspaceId: string | null;
  workspaces: WorkspaceSummary[];
  setSession: (token: string, user: AuthUser) => void;
  setWorkspaces: (workspaces: WorkspaceSummary[]) => void;
  selectWorkspace: (id: string) => void;
  addWorkspace: (workspace: WorkspaceSummary) => void;
  patchWorkspace: (id: string, patch: Partial<WorkspaceSummary>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      workspaceId: null,
      workspaces: [],
      setSession: (token, user) => set({ token, user }),
      setWorkspaces: (workspaces) =>
        set((state) => ({
          workspaces,
          workspaceId:
            state.workspaceId && workspaces.some((w) => w.id === state.workspaceId)
              ? state.workspaceId
              : (workspaces[0]?.id ?? null),
        })),
      selectWorkspace: (id) => set({ workspaceId: id }),
      addWorkspace: (workspace) =>
        set((state) => ({ workspaces: [...state.workspaces, workspace] })),
      patchWorkspace: (id, patch) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),
      logout: () => set({ token: null, user: null, workspaceId: null, workspaces: [] }),
    }),
    { name: "mokaid-auth" },
  ),
);
