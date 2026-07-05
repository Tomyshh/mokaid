import { useState } from "react";
import { cn } from "@/lib/cn";

export function IntegrationLogo({
  providerKey,
  logoUrl,
  name,
  size = "md",
}: {
  providerKey: string;
  logoUrl?: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const src = logoUrl ?? `/api/integrations/logos/${providerKey}`;

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (failed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center text-xs font-semibold text-text-muted",
          sizeClass,
        )}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn("shrink-0 object-contain", sizeClass)}
      onError={() => setFailed(true)}
    />
  );
}
