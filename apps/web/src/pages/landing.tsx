import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Menu, X } from "lucide-react";
import { HeroScene } from "@/components/landing/hero-scene";
import { LazyWhenVisible } from "@/components/landing/lazy-when-visible";
import { SiteFooter } from "@/components/landing/site-footer";
import { cn } from "@/lib/cn";
import { useSmoothScroll } from "@/lib/use-smooth-scroll";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

const HireOverlay = lazy(() =>
  import("@/components/landing/hire-overlay").then((m) => ({ default: m.HireOverlay })),
);
const OfficeTour = lazy(() =>
  import("@/components/landing/office-tour").then((m) => ({ default: m.OfficeTour })),
);
const AgentTour = lazy(() =>
  import("@/components/landing/agent-tour").then((m) => ({ default: m.AgentTour })),
);
const McpConnectors = lazy(() =>
  import("@/components/landing/mcp-connectors").then((m) => ({ default: m.McpConnectors })),
);

const marqueeItems = ["Agents", "Office", "Connectors", "Knowledge", "Tasks"];

const stats = [
  { value: 12, suffix: "+", label: "Agent roles out of the box" },
  { value: 87, suffix: "%", label: "Average team efficiency score" },
  { value: 24, suffix: "/7", label: "Your AI workforce never sleeps" },
  { value: 3, suffix: "min", label: "From signup to first agent" },
];

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#agents", label: "Agents" },
  { href: "#connectors", label: "Connectors" },
  { href: "#stats", label: "Why mokaid" },
] as const;

function LandingLogo() {
  return (
    <span className="flex items-center gap-2 sm:gap-2.5">
      <picture>
        <source srcSet="/branding/logo-without-bg.webp" type="image/webp" />
        <img
          src="/branding/logo-without-bg.png"
          alt="mokaid"
          className="h-7 w-7 object-contain sm:h-8 sm:w-8"
          width={32}
          height={32}
          decoding="async"
        />
      </picture>
      <span className="text-[15px] font-bold tracking-tight text-text sm:text-[17px]">mokaid</span>
    </span>
  );
}

function SectionFallback({ className }: { className?: string }) {
  return <div className={cn("bg-bg-deep", className)} aria-hidden />;
}

export function LandingPage() {
  useSmoothScroll();

  const rootRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [hireVisible, setHireVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // The landing page owns the scroll; the app shell uses inner scrolling.
    document.documentElement.style.overflowY = "auto";
    document.documentElement.style.overflowX = "clip";
    return () => {
      document.documentElement.style.overflowY = "";
      document.documentElement.style.overflowX = "";
    };
  }, []);

  useEffect(() => {
    if (!headerVisible) setMenuOpen(false);
  }, [headerVisible]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const threshold = window.innerHeight * 0.55;
        const nextScrolled = window.scrollY > threshold;
        setHeaderScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));

        // Mobile: keep the hire line only inside the hero so it never covers tours.
        const isDesktop = window.matchMedia("(min-width: 768px)").matches;
        const introBottom = introRef.current?.offsetHeight ?? window.innerHeight * 1.8;
        const nextHire = isDesktop || window.scrollY < introBottom * 0.82;
        setHireVisible((prev) => (prev === nextHire ? prev : nextHire));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const header = "[data-landing-header]";
      const heroScene = "[data-hero-scene]";

      if (prefersReduced) {
        gsap.set(header, { opacity: 1, y: 0 });
        gsap.set(heroScene, { opacity: 0 });
        setHeaderVisible(true);
      } else {
        gsap.set(header, { opacity: 0, y: -12 });
        gsap.set(heroScene, { opacity: 1, scale: 1, yPercent: 0 });

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: introRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.65,
              onUpdate: (self) => {
                const next = self.progress > 0.2;
                setHeaderVisible((prev) => (prev === next ? prev : next));
              },
            },
          })
          .to(header, { opacity: 1, y: 0, duration: 0.25 }, 0.18)
          .to(
            heroScene,
            {
              opacity: 0,
              scale: 1.08,
              yPercent: -8,
              duration: 0.45,
            },
            0.45,
          );
      }

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count ?? 0);
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          onUpdate: () => {
            el.textContent = String(Math.round(state.v));
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mk-landing min-h-full overflow-x-clip bg-bg-deep text-text">
      <Suspense fallback={null}>
        <HireOverlay visible={hireVisible} />
      </Suspense>

      <header
        data-landing-header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter,-webkit-backdrop-filter] duration-300",
          headerVisible ? "pointer-events-auto" : "pointer-events-none",
          headerScrolled || menuOpen
            ? "mk-glass border-primary/15 shadow-md backdrop-blur-xl"
            : "border-transparent bg-transparent backdrop-blur-none",
        )}
      >
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto] items-center gap-2 px-4 sm:h-[4.5rem] sm:grid-cols-[1fr_auto_1fr] sm:px-6 lg:px-10">
          <Link to="/" className="mk-focus-ring w-fit rounded-md">
            <LandingLogo />
          </Link>

          <nav className="hidden items-center justify-center gap-8 text-[13px] font-medium text-text-secondary md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-text">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
            {token ? (
              <Link to="/dashboard">
                <Button size="sm" className="min-h-9 px-3 sm:min-h-8">
                  Open app <ArrowRight size={14} />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden min-[400px]:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-9 text-text-secondary hover:text-text sm:min-h-8"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="min-h-9 px-3 sm:min-h-8 sm:px-3">
                    <span className="sm:hidden">Start</span>
                    <span className="hidden sm:inline">Get started</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </>
            )}

            <button
              type="button"
              className="mk-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface/50 hover:text-text md:hidden"
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <div
          id="landing-mobile-nav"
          className={cn(
            "border-t border-primary/10 md:hidden",
            menuOpen ? "block" : "hidden",
          )}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-text-secondary transition-colors hover:bg-surface/40 hover:text-text"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {!token && (
              <Link
                to="/login"
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-text-secondary transition-colors hover:bg-surface/40 hover:text-text min-[400px]:hidden"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section ref={introRef} className="relative h-[165vh] sm:h-[180vh]">
        <div className="sticky top-0 h-svh overflow-hidden bg-bg-deep">
          <HeroScene />
        </div>
      </section>

      <LazyWhenVisible placeholderClassName="mk-landing-ph-office" rootMargin="400px 0px">
        <Suspense fallback={<SectionFallback className="mk-landing-ph-office" />}>
          <OfficeTour />
        </Suspense>
      </LazyWhenVisible>

      <section className="mk-signal-rail relative isolate overflow-hidden py-5" aria-hidden>
        <div className="mk-signal-rail__fade">
          <div className="mk-marquee flex w-max items-center gap-8 sm:gap-12">
            {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="mk-signal-chip__label">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className="px-4 py-16 sm:px-5 sm:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} data-reveal className="text-center">
              <p className="text-3xl font-bold tracking-tight text-text sm:text-4xl md:text-5xl">
                <span data-count={stat.value}>0</span>
                <span className="text-primary-light">{stat.suffix}</span>
              </p>
              <p className="mt-2 text-[11px] leading-snug text-text-muted sm:text-xs md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <LazyWhenVisible placeholderClassName="mk-landing-ph-agent" rootMargin="320px 0px">
        <Suspense fallback={<SectionFallback className="mk-landing-ph-agent" />}>
          <AgentTour />
        </Suspense>
      </LazyWhenVisible>

      <LazyWhenVisible minHeight="80vh" rootMargin="200px 0px">
        <Suspense fallback={<SectionFallback className="min-h-[80vh]" />}>
          <McpConnectors />
        </Suspense>
      </LazyWhenVisible>

      <section className="px-4 py-16 sm:px-5 sm:py-24">
        <figure data-reveal className="mx-auto max-w-3xl text-center">
          <blockquote className="text-xl font-medium leading-relaxed tracking-tight text-text sm:text-2xl md:text-3xl">
            "We onboarded three AI agents in an afternoon. They now handle research, first drafts
            and QA while the team focuses on decisions. It feels like the office grew overnight."
          </blockquote>
          <figcaption className="mt-6 text-sm text-text-muted">
            <span className="font-semibold text-text-secondary">Tom Jami</span>, Founder at Yapio
          </figcaption>
        </figure>
      </section>

      <section className="px-4 pb-20 sm:px-5 sm:pb-28">
        <div
          data-reveal
          className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-primary/25 px-5 py-12 text-center sm:px-8 sm:py-16 md:py-20"
          style={{ background: "linear-gradient(160deg, #17122e 0%, #12121a 55%, #0e0e16 100%)" }}
        >
          <div
            className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[min(560px,120vw)] -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]"
            aria-hidden
          />
          <picture>
            <source srcSet="/branding/logo-without-bg.webp" type="image/webp" />
            <img
              src="/branding/logo-without-bg.png"
              alt=""
              aria-hidden
              width={56}
              height={56}
              decoding="async"
              loading="lazy"
              className="mx-auto mb-5 h-12 w-12 object-contain sm:mb-6 sm:h-14 sm:w-14"
            />
          </picture>
          <h2 className="relative text-[1.65rem] font-bold tracking-tight sm:text-3xl md:text-[44px] md:leading-[1.1]">
            Ready to meet your new teammates?
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm text-text-secondary md:text-base">
            Spin up your workspace, invite your team and hire your first AI agent today.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Link to="/signup" className="w-full max-w-xs sm:w-auto sm:max-w-none">
              <Button size="lg" className="w-full px-8 shadow-glow-strong sm:w-auto">
                Get started now <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
