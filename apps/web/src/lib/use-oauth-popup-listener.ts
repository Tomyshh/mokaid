import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OAUTH_SUCCESS_MESSAGE } from "@/lib/oauth-callback";
import { toast } from "@/stores/toast-store";

/** Listen for OAuth success from a popup tab and refresh integration state. */
export function useOauthPopupListener(onConnected?: () => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handler(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== OAUTH_SUCCESS_MESSAGE) return;

      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      onConnected?.();

      const account = event.data.account as string | undefined;
      toast({
        tone: "success",
        title: "Tool connected",
        description: account ? `Linked as ${account}` : "Your connection is ready.",
      });
    }

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [queryClient, onConnected]);
}
