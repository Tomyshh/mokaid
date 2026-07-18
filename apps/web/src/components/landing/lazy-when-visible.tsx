import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  /** Placeholder height before the section mounts (avoids layout jump). Cleared once visible. */
  minHeight?: string | number;
  /** Extra class applied only while waiting (e.g. height-matched placeholder). */
  placeholderClassName?: string;
  /** Start loading slightly before the section enters the viewport. */
  rootMargin?: string;
  className?: string;
};

/**
 * Defers mounting heavy below-fold sections until near the viewport,
 * so the hero can paint without pulling Babylon / large media chunks.
 */
export function LazyWhenVisible({
  children,
  minHeight,
  placeholderClassName,
  rootMargin = "280px 0px",
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return (
    <div
      ref={ref}
      className={cn(className, !visible && placeholderClassName)}
      style={!visible && minHeight != null ? { minHeight } : undefined}
    >
      {visible ? children : null}
    </div>
  );
}
