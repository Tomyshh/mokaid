import { create } from "zustand";

/**
 * Runtime-only onboarding state. Completion flags (wizard_done, tour_done,
 * checklist_dismissed) are persisted server-side in workspace.settings.onboarding
 * — see useOnboardingSettings / useUpdateOnboarding.
 */
interface OnboardingState {
  tourActive: boolean;
  tourStep: number;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  stopTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  tourActive: false,
  tourStep: 0,
  startTour: () => set({ tourActive: true, tourStep: 0 }),
  nextTourStep: () => set((s) => ({ tourStep: s.tourStep + 1 })),
  prevTourStep: () => set((s) => ({ tourStep: Math.max(0, s.tourStep - 1) })),
  stopTour: () => set({ tourActive: false, tourStep: 0 }),
}));
