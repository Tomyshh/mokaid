import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useWorkspaceChannel } from "@/realtime/use-workspace-channel";
import { useOnboardingSettings } from "@/api/hooks";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { CoachmarkTour } from "@/components/onboarding/coachmark-tour";
import { Toaster } from "@/components/ui/toaster";

function OnboardingGate() {
  const [dismissed, setDismissed] = useState(false);
  const { onboarding, loaded } = useOnboardingSettings();

  // Show the wizard exactly once per workspace: the flag lives in the DB
  // (workspace.settings.onboarding.wizard_done), not in this browser.
  const shouldShow = !dismissed && loaded && onboarding.wizard_done !== true;

  if (!shouldShow) return null;
  return <OnboardingWizard onFinish={() => setDismissed(true)} />;
}

export function AppShell() {
  useWorkspaceChannel();

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
      <OnboardingGate />
      <OnboardingChecklist />
      <CoachmarkTour />
      <Toaster />
    </div>
  );
}
