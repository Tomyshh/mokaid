import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

function prefersNativeScroll() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  // Touch / coarse pointers feel better with native momentum scrolling + pin sections.
  if (window.matchMedia("(pointer: coarse)").matches) return true;
  if (navigator.maxTouchPoints > 0 && window.matchMedia("(hover: none)").matches) return true;
  return false;
}

/**
 * Lenis smooth scrolling wired into the GSAP ticker so ScrollTrigger
 * and Lenis share a single rAF loop (desktop). Mobile keeps native scroll.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersNativeScroll()) {
      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 160);
      };
      window.addEventListener("resize", onResize);
      // Address bar show/hide changes visual viewport on mobile.
      const vv = window.visualViewport;
      vv?.addEventListener("resize", onResize);
      return () => {
        window.clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
        vv?.removeEventListener("resize", onResize);
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 160);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}
