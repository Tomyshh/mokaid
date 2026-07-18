import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const IMG_W = 1568;
const IMG_H = 1003;

type Stop = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  fx: number;
  fy: number;
  zoom: number;
};

/** Four soft focal points — gentle pans, never a tight close-up. */
const stops: Stop[] = [
  {
    id: "overview",
    kicker: "Office",
    title: "Your hybrid team, on one floor",
    body: "AI and human agents share the same space — desks, meetings and culture in plain sight.",
    fx: 0.5,
    fy: 0.48,
    zoom: 1.04,
  },
  {
    id: "culture",
    kicker: "Culture",
    title: "Identity in the lounge",
    body: "Brand wall and soft seats where shared context lives between deep-work blocks.",
    fx: 0.22,
    fy: 0.28,
    zoom: 1.32,
  },
  {
    id: "floor",
    kicker: "Floor",
    title: "Agents at their desks",
    body: "Design, ops and engineering visible as they work — every seat is a real assignment.",
    fx: 0.5,
    fy: 0.52,
    zoom: 1.26,
  },
  {
    id: "meeting",
    kicker: "Meeting",
    title: "Briefings in the glass room",
    body: "Syncs, reviews and decisions — humans and AI at the same table.",
    fx: 0.78,
    fy: 0.26,
    zoom: 1.34,
  },
];

function coverSize(vw: number, vh: number) {
  const imgRatio = IMG_W / IMG_H;
  const viewRatio = vw / vh;
  if (imgRatio > viewRatio) {
    const h = vh;
    return { w: h * imgRatio, h };
  }
  const w = vw;
  return { w, h: w / imgRatio };
}

/** Cover pose using scale + x/y (compositor-friendly; never animates width/height). */
function poseFor(vw: number, vh: number, fx: number, fy: number, zoom: number) {
  const { w, h } = coverSize(vw, vh);
  return {
    width: w,
    height: h,
    scale: zoom,
    x: vw / 2 - fx * w * zoom,
    y: vh / 2 - fy * h * zoom,
  };
}

export function OfficeTour() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!section || !viewport || !image) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(image, {
      position: "absolute",
      top: 0,
      left: 0,
      maxWidth: "none",
      transformOrigin: "0 0",
      force3D: true,
    });

    const readPose = (stop: Stop) =>
      poseFor(viewport.clientWidth, viewport.clientHeight, stop.fx, stop.fy, stop.zoom);

    const applyBaseSize = () => {
      const { width, height } = readPose(stops[0]);
      gsap.set(image, { width, height });
    };
    applyBaseSize();
    gsap.set(image, {
      scale: stops[0].zoom,
      x: readPose(stops[0]).x,
      y: readPose(stops[0]).y,
    });

    if (prefersReduced) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
          pin: "[data-office-pin]",
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: applyBaseSize,
          onUpdate: (self) => {
            const i = Math.min(
              stops.length - 1,
              Math.floor(self.progress * stops.length * 0.999),
            );
            if (activeRef.current === i) return;
            activeRef.current = i;
            setActive(i);
          },
        },
      });

      // Equal segments: short hold, then a soft pan — camera breathes between stops.
      for (let i = 1; i < stops.length; i++) {
        const from = stops[i - 1];
        const to = stops[i];
        const at = (i - 1) * 1.4;
        tl.to({}, { duration: 0.4 }, at);
        tl.fromTo(
          image,
          {
            scale: () => readPose(from).scale,
            x: () => readPose(from).x,
            y: () => readPose(from).y,
          },
          {
            scale: () => readPose(to).scale,
            x: () => readPose(to).x,
            y: () => readPose(to).y,
            duration: 1,
            immediateRender: false,
          },
          at + 0.4,
        );
      }
      tl.to({}, { duration: 0.5 });
    }, section);

    // Recalculate pin spacers after lazy mount (avoids leftover black gaps).
    requestAnimationFrame(() => ScrollTrigger.refresh());

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  const activeStop = stops[active];
  const progress = ((active + 1) / stops.length) * 100;

  return (
    <section
      ref={sectionRef}
      id="product"
      className="mk-office-tour relative z-10"
      style={{ ["--office-stops" as string]: String(stops.length) }}
    >
      <div data-office-pin className="mk-office-tour-pin relative h-svh w-full">
        <div className="mk-office-tour-shell relative h-full w-full">
          <div className="mk-office-tour-frame">
            <div ref={viewportRef} className="mk-office-tour-viewport">
              <picture className="contents">
                <source srcSet="/desk-illustrations.webp" type="image/webp" />
                <img
                  ref={imageRef}
                  src="/desk-illustrations.png"
                  width={IMG_W}
                  height={IMG_H}
                  alt="The mokaid virtual office with AI and human agents working at their desks"
                  className="mk-office-tour-image"
                  draggable={false}
                  decoding="async"
                  fetchPriority="low"
                />
              </picture>
              <div className="mk-office-tour-vignette" aria-hidden />
            </div>

            <div className="mk-office-tour-overlays">
              {stops.map((stop, i) => {
                const isActive = active === i;
                return (
                  <article
                    key={stop.id}
                    className={`mk-office-tour-card ${isActive ? "is-active" : ""}`}
                    aria-hidden={!isActive}
                  >
                    <p className="mk-office-tour-kicker">
                      <span className="mk-office-tour-step">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="mk-office-tour-kicker-sep" aria-hidden />
                      {stop.kicker}
                    </p>
                    <h2 className="mk-office-tour-title">{stop.title}</h2>
                    <p className="mk-office-tour-body">{stop.body}</p>
                  </article>
                );
              })}
            </div>

            <div className="mk-office-tour-progress" aria-hidden>
              <span className="mk-office-tour-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <p className="mk-office-tour-hint">{activeStop.kicker}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
