import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

const EFFECTIVE_DATE = "July 6, 2026";
const COMPANY_NAME = "Mokaid";
const FOUNDER_NAME = "Itsaq Tom Jami";
const CONTACT_EMAIL = "tom@yapio.io";

export function PrivacyPage() {
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
            <Shield size={12} />
            Legal document
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text">Privacy Policy</h1>
          <p className="mt-4 text-sm text-text-muted">Last updated: {EFFECTIVE_DATE}</p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {COMPANY_NAME} takes the protection of your personal data seriously. This policy
            explains what data we collect, why we collect it, how we process it, and what rights
            you have.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            By using the {COMPANY_NAME} platform, you acknowledge that you have read and
            understood this privacy policy.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <SectionTitle index="1" title="Data controller" />
            <Prose>
              The controller of personal data collected through the {COMPANY_NAME} platform is:
            </Prose>
            <div className="mt-4 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-text-secondary">
              <p>
                <strong className="text-text">{COMPANY_NAME}</strong>
              </p>
              <p>Founder: {FOUNDER_NAME}</p>
              <p>
                Contact:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary-light hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
            <Prose className="mt-4">
              For any question about your personal data or to exercise your rights, contact us at
              the email address above.
            </Prose>
          </section>

          <section>
            <SectionTitle index="2" title="Data we collect" />
            <Prose>
              We collect different categories of data depending on how you use the platform:
            </Prose>
            <SubList
              items={[
                {
                  label: "Account data",
                  detail:
                    "Full name, email address, password (hashed), profile photo (optional).",
                },
                {
                  label: "Usage data",
                  detail:
                    "Actions on the platform, pages visited, session duration, interface events.",
                },
                {
                  label: "AI agent data",
                  detail:
                    "Instructions, assigned tasks, conversation history with agents, produced outputs.",
                },
                {
                  label: "Integration data",
                  detail:
                    "OAuth access tokens (GitHub, Google, Figma, etc.) required for third-party integrations you enable.",
                },
                {
                  label: "Payment data",
                  detail:
                    "Billing information processed via our payment provider (Stripe). We never store card numbers.",
                },
                {
                  label: "Technical data",
                  detail:
                    "IP address, browser type, operating system, server logs for security and debugging.",
                },
              ]}
            />
            <Prose className="mt-4">
              We do not collect special-category data under the GDPR (racial or ethnic origin,
              political opinions, health data, etc.).
            </Prose>
          </section>

          <section>
            <SectionTitle index="3" title="Purposes and legal bases" />
            <Prose>
              Each processing activity rests on a legal basis under the General Data Protection
              Regulation (GDPR – EU Regulation 2016/679):
            </Prose>
            <table className="mt-4 w-full overflow-hidden rounded-lg border border-border text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Legal basis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  ["Account creation and management", "Contract performance (Art. 6.1.b)"],
                  ["Providing platform features", "Contract performance (Art. 6.1.b)"],
                  ["Sending transactional emails", "Contract performance (Art. 6.1.b)"],
                  ["Improving and developing the service", "Legitimate interest (Art. 6.1.f)"],
                  ["Security and fraud prevention", "Legitimate interest (Art. 6.1.f)"],
                  ["Marketing communications (opt-in)", "Consent (Art. 6.1.a)"],
                  ["Complying with legal obligations", "Legal obligation (Art. 6.1.c)"],
                  ["Billing and accounting", "Legal obligation (Art. 6.1.c)"],
                ].map(([purpose, basis]) => (
                  <tr key={purpose} className="text-text-secondary">
                    <td className="px-4 py-3">{purpose}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <SectionTitle index="4" title="Retention periods" />
            <Prose>
              We keep your data only as long as needed for the purposes for which it was
              collected:
            </Prose>
            <SubList
              items={[
                {
                  label: "Active account data",
                  detail: "For the duration of your contractual relationship.",
                },
                {
                  label: "Data after account closure",
                  detail:
                    "30 days (grace period for reactivation), then permanent deletion or anonymization.",
                },
                {
                  label: "Billing data",
                  detail: "10 years, in line with accounting and tax obligations.",
                },
                {
                  label: "Technical logs",
                  detail: "90 days for security and debugging.",
                },
                {
                  label: "Marketing data (opt-in)",
                  detail: "Until you withdraw your consent.",
                },
              ]}
            />
          </section>

          <section>
            <SectionTitle index="5" title="Sharing and recipients" />
            <Prose>
              We never sell your personal data to third parties. We may share data only in these
              cases:
            </Prose>
            <SubList
              items={[
                {
                  label: "Technical processors",
                  detail:
                    "Hosting (Render), database, email delivery, analytics — all bound by GDPR-compliant processing agreements.",
                },
                {
                  label: "Payment provider",
                  detail:
                    "Stripe Inc. processes payments directly and is subject to its own privacy policy.",
                },
                {
                  label: "Third-party integrations",
                  detail:
                    "GitHub, Google Workspace, Figma, etc. — only if you enable them and within the permissions you grant.",
                },
                {
                  label: "Legal obligations",
                  detail:
                    "Competent authorities upon judicial request or legal obligation.",
                },
                {
                  label: "Business transfer",
                  detail:
                    "In case of merger, acquisition, or sale, your data may be transferred to the successor, with prior notice.",
                },
              ]}
            />
          </section>

          <section>
            <SectionTitle index="6" title="International data transfers" />
            <Prose>
              Some of our processors may be established outside the European Union (including the
              United States). In that case, we ensure transfers are covered by appropriate
              safeguards, including:
            </Prose>
            <SubList
              items={[
                {
                  label: "Standard Contractual Clauses (SCCs)",
                  detail: "Approved by the European Commission.",
                },
                {
                  label: "Adequacy decision",
                  detail:
                    "Recognition of an equivalent level of protection by the European Commission.",
                },
              ]}
            />
          </section>

          <section>
            <SectionTitle index="7" title="Cookies and similar technologies" />
            <Prose>
              The {COMPANY_NAME} platform uses cookies and similar technologies:
            </Prose>
            <SubList
              items={[
                {
                  label: "Strictly necessary cookies",
                  detail:
                    "Authentication session, security preferences. These cookies do not require your consent.",
                },
                {
                  label: "Analytics cookies",
                  detail:
                    "Anonymized audience measurement to improve the service. Enabled only with your consent.",
                },
              ]}
            />
            <Prose className="mt-4">
              You can manage cookie preferences through your browser settings. Refusing
              non-essential cookies does not affect access to the core features of the platform.
              See also our{" "}
              <Link to="/cookies" className="text-primary-light hover:underline">
                Cookie Policy
              </Link>
              .
            </Prose>
          </section>

          <section>
            <SectionTitle index="8" title="Data security" />
            <Prose>
              We implement appropriate technical and organizational measures to protect your data
              against unauthorized access, loss, alteration, or disclosure:
            </Prose>
            <SubList
              items={[
                {
                  label: "Encryption",
                  detail:
                    "Data is transmitted via HTTPS (TLS 1.2+) and passwords are hashed with bcrypt.",
                },
                {
                  label: "Restricted access",
                  detail:
                    "Least-privilege principle applied across our teams and systems.",
                },
                {
                  label: "Logging",
                  detail: "Real-time monitoring of access and anomalies.",
                },
                {
                  label: "Backups",
                  detail: "Regular data backups with tested restore procedures.",
                },
              ]}
            />
            <Prose className="mt-4">
              In the event of a personal data breach that may result in a risk to your rights and
              freedoms, we will notify you within 72 hours in accordance with Article 33 GDPR.
            </Prose>
          </section>

          <section>
            <SectionTitle index="9" title="Your rights" />
            <Prose>
              Under the GDPR, you have the following rights regarding your personal data:
            </Prose>
            <SubList
              items={[
                {
                  label: "Right of access (Art. 15)",
                  detail: "Obtain a copy of the personal data we hold about you.",
                },
                {
                  label: "Right to rectification (Art. 16)",
                  detail: "Correct inaccurate or incomplete data.",
                },
                {
                  label: "Right to erasure (Art. 17)",
                  detail:
                    "Request deletion of your data, subject to our legal obligations.",
                },
                {
                  label: "Right to restriction (Art. 18)",
                  detail:
                    "Temporarily restrict processing of your data in certain circumstances.",
                },
                {
                  label: "Right to portability (Art. 20)",
                  detail:
                    "Receive your data in a structured, machine-readable format.",
                },
                {
                  label: "Right to object (Art. 21)",
                  detail:
                    "Object to processing based on our legitimate interest or for direct marketing.",
                },
                {
                  label: "Withdraw consent",
                  detail:
                    "Withdraw consent at any time for processing that relies on it.",
                },
              ]}
            />
            <Prose className="mt-4">
              To exercise your rights, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-light hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within one month of receiving your request (extendable by two
              months for complex requests).
            </Prose>
            <Prose className="mt-3">
              If you believe the processing of your data does not comply with applicable law, you
              may lodge a complaint with your local supervisory authority (in France: CNIL —{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-light hover:underline"
              >
                www.cnil.fr
              </a>
              ).
            </Prose>
          </section>

          <section>
            <SectionTitle index="10" title="Minors" />
            <Prose>
              The {COMPANY_NAME} platform is intended for adults (18 years and older). We do not
              knowingly collect personal data from minors. If you become aware that a minor has
              provided us with personal data, contact us so we can delete it.
            </Prose>
          </section>

          <section>
            <SectionTitle index="11" title="Changes to this policy" />
            <Prose>
              We may update this privacy policy at any time to reflect legal, technical, or
              product changes. For material changes, we will notify you by email or via a banner
              on the platform at least 30 days before they take effect.
            </Prose>
            <Prose className="mt-3">
              The last updated date is shown at the top of this document. We encourage you to
              review it regularly.
            </Prose>
          </section>

          <section>
            <SectionTitle index="12" title="Contact" />
            <Prose>
              For any question, request, or complaint about the protection of your personal data:
            </Prose>
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
            <Link to="/terms" className="transition-colors hover:text-text">
              Terms of Service
            </Link>
            <span>·</span>
            <Link to="/cookies" className="transition-colors hover:text-text">
              Cookies
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
