import { TextMorph } from "@/components/ui/text-morph";
import { cn } from "@/lib/cn";

const hireSpecialists = [
  "developers",
  "designers",
  "researchers",
  "marketers",
  "legal experts",
  "data scientists",
  "product managers",
  "DevOps engineers",
  "writers",
  "security analysts",
  "finance analysts",
  "support agents",
];

type Props = {
  /** On mobile, hide once the user leaves the hero so it doesn't cover scrollytelling. */
  visible?: boolean;
};

/** Fixed headline that stays visible across the full landing scroll (desktop). */
export function HireOverlay({ visible = true }: Props) {
  return (
    <p
      className={cn("mk-landing-hire", !visible && "mk-landing-hire--hidden")}
      aria-live="polite"
      aria-hidden={!visible}
    >
      <span className="mk-landing-hire-static">You can now hire AI&nbsp;</span>
      <TextMorph words={hireSpecialists} interval={2600} className="mk-landing-hire-morph" />
    </p>
  );
}
