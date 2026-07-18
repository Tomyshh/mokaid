import { Link } from "@tanstack/react-router";
import { ArrowLeft, Cookie } from "lucide-react";

const EFFECTIVE_DATE = "July 19, 2026";
const COMPANY_NAME = "Mokaid";
const FOUNDER_NAME = "Itsaq Tom Jami";
const CONTACT_EMAIL = "tom@yapio.io";

export function CookiesPage() {
  return (
    <div className="min-h-full bg-bg-deep text-text">
      <header className="sticky top-0 z-10 bg-bg-deep/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="mk-focus-ring flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft size={13} /> Back to site
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/branding/logo-without-bg.png"
              alt="mokaid"
              className="h-7 w-7 object-contain"
            />
            <span className="text-sm font-bold tracking-tight text-text">mokaid</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-light">
            <Cookie size={12} />
            Legal document
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text">Cookie Policy</h1>
          <p className="mt-4 text-sm text-text-muted">Last updated: {EFFECTIVE_DATE}</p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            This policy explains how {COMPANY_NAME} uses cookies and similar technologies when you
            visit or use the platform{" "}
            <strong className="text-text">mokaid.io</strong>.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <SectionTitle index="1" title="What is a cookie?" />
            <Prose>
              A cookie is a small text file placed on your device (computer, tablet, or phone) when
              you browse a website. It helps recognize your browser and store certain information
              for a defined period of time.
            </Prose>
          </section>

          <section>
            <SectionTitle index="2" title="Cookies we use" />
            <Prose>The {COMPANY_NAME} platform uses the following categories:</Prose>
            <SubList
              items={[
                {
                  label: "Strictly necessary cookies",
                  detail:
                    "Authentication session, security preferences, and essential service operation. These cookies do not require your consent.",
                },
                {
                  label: "Analytics cookies",
                  detail:
                    "Anonymized audience measurement to improve the service. Enabled only with your consent.",
                },
              ]}
            />
          </section>

          <section>
            <SectionTitle index="3" title="Retention period" />
            <Prose>
              Session cookies are deleted when you close your browser. Persistent cookies are kept
              for a maximum of thirteen (13) months, unless a shorter period is indicated when the
              cookie is set.
            </Prose>
          </section>

          <section>
            <SectionTitle index="4" title="Managing your preferences" />
            <Prose>
              You can manage cookie preferences through your browser settings (block, delete, or
              receive alerts). Refusing non-essential cookies does not affect access to the core
              features of the platform.
            </Prose>
            <Prose className="mt-3">
              To learn more about how we process personal data, see our{" "}
              <Link to="/privacy" className="text-primary-light hover:underline">
                Privacy Policy
              </Link>
              .
            </Prose>
          </section>

          <section>
            <SectionTitle index="5" title="Contact" />
            <Prose>For any questions about cookies or your data, contact us:</Prose>
            <div className="mt-4 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-text-secondary">
              <p>
                <strong className="text-text">{COMPANY_NAME}</strong>
              </p>
              <p>Attention: {FOUNDER_NAME}</p>
              <p>
                Email:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary-light hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 flex flex-col items-center gap-3 pt-8 text-xs text-text-muted">
          <p>
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/privacy" className="transition-colors hover:text-text">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link to="/terms" className="transition-colors hover:text-text">
              Terms of Service
            </Link>
            <span>·</span>
            <Link to="/legal" className="transition-colors hover:text-text">
              Legal Notice
            </Link>
            <span>·</span>
            <Link to="/" className="transition-colors hover:text-text">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[11px] font-bold text-primary-light">
        {index}
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-text">{title}</h2>
    </div>
  );
}

function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm leading-relaxed text-text-secondary ${className ?? ""}`}>{children}</p>
  );
}

function SubList({ items }: { items: { label: string; detail: string }[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map(({ label, detail }) => (
        <li key={label} className="flex gap-3 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="text-text-secondary">
            <span className="font-medium text-text">{label}</span> — {detail}
          </span>
        </li>
      ))}
    </ul>
  );
}
