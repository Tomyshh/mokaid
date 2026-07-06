import { useAuthStore } from "@/stores/auth-store";

const RETURN_KEY = "oauth_return_to";
const STEP_KEY = "onboarding_restore_step";

export function setOauthReturn(path: string, onboardingStep?: number) {
  sessionStorage.setItem(RETURN_KEY, path);
  if (onboardingStep != null) {
    sessionStorage.setItem(STEP_KEY, String(onboardingStep));
  }
}

export function consumeOauthReturn(fallback = "/dashboard"): string {
  const path = sessionStorage.getItem(RETURN_KEY) ?? fallback;
  sessionStorage.removeItem(RETURN_KEY);
  return path;
}

export function consumeOnboardingRestoreStep(): number | null {
  const raw = sessionStorage.getItem(STEP_KEY);
  sessionStorage.removeItem(STEP_KEY);
  if (!raw) return null;
  const step = Number(raw);
  return Number.isFinite(step) ? step : null;
}

export function waitForAuthHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export function oauthDedupeKey(provider: string, code: string) {
  return `${provider}_oauth:${code}`;
}

const oauthInflight = new Map<string, Promise<unknown>>();

export function runOauthOnce<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = oauthInflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = run().finally(() => {
    oauthInflight.delete(key);
  });
  oauthInflight.set(key, promise);
  return promise;
}
