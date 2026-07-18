import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";

const EFFECTIVE_DATE = "July 19, 2026";
const COMPANY_NAME = "Mokaid";
const FOUNDER_NAME = "Itsaq Tom Jami";
const CONTACT_EMAIL = "tom@yapio.io";
const SITE_URL = "mokaid.io";

export function LegalPage() {
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
            <Building2 size={12} />
            Legal document
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text">Legal Notice</h1>
          <p className="mt-4 text-sm text-text-muted">Last updated: {EFFECTIVE_DATE}</p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            This legal notice identifies the publisher of the website and the conditions of access
            to <strong className="text-text">{SITE_URL}</strong>.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <SectionTitle index="1" title="Publisher" />
            <div className="mt-2 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-text-secondary">
              <p>
                <strong className="text-text">{COMPANY_NAME}</strong>
              </p>
              <p>Founder / publication director: {FOUNDER_NAME}</p>
              <p>
                Contact:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary-light hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="mt-2">
                Website:{" "}
                <a
                  href={`https://${SITE_URL}`}
                  className="text-primary-light hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SITE_URL}
                </a>
              </p>
            </div>
          </section>

          <section>
            <SectionTitle index="2" title="Hosting" />
            <Prose>
              The website and related services are hosted by cloud infrastructure providers. For
              hosting-related requests, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-light hover:underline">
                {CONTACT_EMAIL}
              </a>
              ; we will provide the applicable hosting details on request.
            </Prose>
          </section>

          <section>
            <SectionTitle index="3" title="Intellectual property" />
            <Prose>
              All content on the {COMPANY_NAME} platform (text, graphics, logos, interfaces,
              software, databases, trademarks) is protected by intellectual property law. Any
              unauthorized reproduction, representation, modification, or exploitation is
              prohibited without prior written consent from {COMPANY_NAME}.
            </Prose>
          </section>

          <section>
            <SectionTitle index="4" title="Liability" />
            <Prose>
              {COMPANY_NAME} strives to keep information on the site accurate and up to date.
              However, {COMPANY_NAME} cannot guarantee the absence of errors or omissions. Users
              remain solely responsible for how they use the information and services provided.
            </Prose>
          </section>

          <section>
            <SectionTitle index="5" title="Personal data and cookies" />
            <Prose>
              Personal data processing is described in our{" "}
              <Link to="/privacy" className="text-primary-light hover:underline">
                Privacy Policy
              </Link>
              . Cookie usage is detailed in our{" "}
              <Link to="/cookies" className="text-primary-light hover:underline">
                Cookie Policy
              </Link>
              . Terms of use are set out in the{" "}
              <Link to="/terms" className="text-primary-light hover:underline">
                Terms of Service
              </Link>
              .
            </Prose>
          </section>

          <section>
            <SectionTitle index="6" title="Contact" />
            <Prose>For any questions about this legal notice:</Prose>
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
            <Link to="/cookies" className="transition-colors hover:text-text">
              Cookies
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
