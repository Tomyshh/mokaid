import { create } from "zustand";

const FLASH_DURATION_MS = 5000;

interface UiState {
  sidebarCollapsed: boolean;
  selectedAgentId: string | null;
  selectedTaskId: string | null;
  /** Task ids briefly highlighted after their run finished (realtime). */
  flashedTaskIds: string[];
  toggleSidebar: () => void;
  selectAgent: (id: string | null) => void;
  selectTask: (id: string | null) => void;
  flashTask: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  selectedAgentId: null,
  selectedTaskId: null,
  flashedTaskIds: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  selectAgent: (id) => set({ selectedAgentId: id }),
  selectTask: (id) => set({ selectedTaskId: id }),
  flashTask: (id) => {
    set((s) => ({
      flashedTaskIds: s.flashedTaskIds.includes(id)
        ? s.flashedTaskIds
        : [...s.flashedTaskIds, id],
    }));
    setTimeout(() => {
      set((s) => ({ flashedTaskIds: s.flashedTaskIds.filter((t) => t !== id) }));
    }, FLASH_DURATION_MS);
  },
}));
