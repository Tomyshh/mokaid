import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

const EFFECTIVE_DATE = "July 6, 2026";
const COMPANY_NAME = "Mokaid";
const FOUNDER_NAME = "Itsaq Tom Jami";
const CONTACT_EMAIL = "tom@yapio.io";

export function TermsPage() {
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
            <FileText size={12} />
            Legal document
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text">Terms of Service</h1>
          <p className="mt-4 text-sm text-text-muted">Last updated: {EFFECTIVE_DATE}</p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            These Terms of Service (the &quot;Terms&quot;) govern access to and use of the{" "}
            {COMPANY_NAME} platform, available at{" "}
            <strong className="text-text">mokaid.io</strong>, operated by{" "}
            <strong className="text-text">{COMPANY_NAME}</strong>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            By creating an account or accessing the platform, you fully and unconditionally accept
            these Terms. If you do not accept them, you must stop using the platform immediately.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <SectionTitle index="1" title="Service overview" />
            <Prose>
              {COMPANY_NAME} is a SaaS (Software as a Service) platform that lets companies and
              teams manage human collaborators and artificial intelligence (AI) agents together in
              a unified workspace.
            </Prose>
            <Prose className="mt-3">The platform includes features such as:</Prose>
            <SubList
              items={[
                "Creation, configuration, and supervision of autonomous AI agents.",
                "Project, task, and mixed workflow management (humans + AI).",
                "Real-time team dashboard.",
                "Shared knowledge base and document management.",
                "Integrations with third-party services (GitHub, Google Workspace, Figma, etc.).",
                "Internal messaging, calendar, and analytics.",
                "Billing and subscription management.",
              ]}
            />
            <Prose className="mt-4">
              {COMPANY_NAME} reserves the right to evolve service features at any time, with or
              without notice, subject to Section 14 of these Terms.
            </Prose>
          </section>

          <section>
            <SectionTitle index="2" title="Access and account creation" />
            <Prose>
              Access to the {COMPANY_NAME} platform requires creating a user account. To sign up,
              you must:
            </Prose>
            <SubList
              items={[
                "Be a natural person at least 18 years old, or a legally constituted legal entity.",
                "Provide a valid email address and a secure password.",
                "Have the legal capacity to be bound by these Terms.",
                "Not have had an account suspended or terminated on the platform.",
              ]}
            />
            <Prose className="mt-4">
              You are responsible for keeping your login credentials confidential. Any use of the
              platform through your account is deemed to be by you, and you are fully responsible
              for it. You must immediately notify {COMPANY_NAME} of any unauthorized access at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-light hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </Prose>
            <Prose className="mt-3">
              {COMPANY_NAME} reserves the right to refuse any registration without having to
              justify its decision.
            </Prose>
          </section>

          <section>
            <SectionTitle index="3" title="Workspaces" />
            <Prose>
              The platform is organized around workspaces. The creator of a workspace is designated
              as administrator and has extended rights, including:
            </Prose>
            <SubList
              items={[
                "Invite and revoke members.",
                "Configure AI agents and integrations.",
                "Manage billing and subscription.",
                "View workspace data and logs.",
              ]}
            />
            <Prose className="mt-4">
              The administrator is responsible for compliance with these Terms by all members of
              their workspace, including ensuring invited members have accepted these Terms before
              accessing the service.
            </Prose>
          </section>

          <section>
            <SectionTitle index="4" title="Artificial intelligence agents" />
            <Prose>
              The {COMPANY_NAME} platform lets you create and manage autonomous AI agents. You
              expressly acknowledge and agree that:
            </Prose>
            <SubList
              items={[
                "AI agents generate content and take actions based on the instructions you provide. You are solely responsible for them.",
                "Outputs produced by AI agents are provided “as is” and may contain errors, inaccuracies, or omissions.",
                "You agree to verify AI agent outputs before using them for critical purposes (legal, medical, financial, etc.).",
                "It is prohibited to use AI agents to produce unlawful, discriminatory, misleading content, or content that infringes third-party rights.",
                "Mokaid shall not be liable for decisions made by you or third parties based on AI agent outputs.",
              ]}
            />
          </section>

          <section>
            <SectionTitle index="5" title="Acceptable use" />
            <Prose>
              Use of the {COMPANY_NAME} platform is subject to the following rules. You must not:
            </Prose>
            <SubList
              items={[
                "Use the platform for unlawful purposes or in breach of these Terms.",
                "Reproduce, resell, or sublicense access to the platform without prior written authorization.",
                "Attempt to access systems, data, or accounts you are not authorized to use.",
                "Circumvent or attempt to circumvent platform security measures.",
                "Introduce viruses, malware, or any malicious code.",
                "Use the platform to send spam, phishing, or any unsolicited content.",
                "Exploit the platform through unauthorized automated means (scraping, bots, etc.).",
                "Impersonate another person or entity.",
                `Infringe the intellectual property rights of ${COMPANY_NAME} or third parties.`,
                "Violate others' privacy rights.",
              ]}
            />
            <Prose className="mt-4">
              Failure to comply may result in immediate suspension or termination of your account,
              without prejudice to any legal action.
            </Prose>
          </section>

          <section>
            <SectionTitle index="6" title="Intellectual property" />
            <Prose>
              <strong className="text-text">{COMPANY_NAME} and the platform.</strong> The{" "}
              {COMPANY_NAME} platform, its source code, design, trademarks, logos, algorithms, and
              related documentation are the exclusive property of {COMPANY_NAME} and are protected
              by applicable intellectual property laws. No license is granted beyond the personal
              right of use provided under these Terms.
            </Prose>
            <Prose className="mt-4">
              <strong className="text-text">Your content.</strong> You retain all intellectual
              property rights in content you create, import, or process through the platform (data,
              documents, agent instructions, etc.). By using the platform, you grant{" "}
              {COMPANY_NAME} a limited, non-exclusive, non-transferable license to process your
              content solely for providing the service.
            </Prose>
            <Prose className="mt-4">
              <strong className="text-text">AI-generated content.</strong> Rights in content
              generated by AI agents you configure are attributed to you in full, subject to
              applicable copyright law regarding AI-generated works.
            </Prose>
          </section>

          <section>
            <SectionTitle index="7" title="Personal data and privacy" />
            <Prose>
              Processing of your personal data is governed by our{" "}
              <Link to="/privacy" className="text-primary-light hover:underline">
                Privacy Policy
              </Link>
              , which forms an integral part of these Terms. Please read it carefully.
            </Prose>
            <Prose className="mt-3">
              As a workspace administrator, you may be considered a data controller for the
              personal data of your members. {COMPANY_NAME} then acts as a processor. A Data
              Processing Agreement (DPA) is available on request at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-light hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </Prose>
          </section>

          <section>
            <SectionTitle index="8" title="Third-party integrations" />
            <Prose>
              The platform can connect to third-party services (GitHub, Google Workspace, Figma,
              Stripe, etc.). Those integrations are subject to each third party&apos;s own terms
              and privacy policies.
            </Prose>
            <Prose className="mt-3">
              {COMPANY_NAME} is not responsible for interruptions, errors, or changes made by
              those third-party services. By enabling an integration, you authorize{" "}
              {COMPANY_NAME} to access that service&apos;s data within the permissions you grant.
            </Prose>
          </section>

          <section>
            <SectionTitle index="9" title="Pricing, subscriptions, and billing" />
            <Prose>
              Access to certain {COMPANY_NAME} features requires a paid subscription. By
              subscribing:
            </Prose>
            <SubList
              items={[
                "You accept the prices in effect at the time of subscription, as shown on our pricing page.",
                "Payment is processed by Stripe, our secure payment provider.",
                "Subscriptions renew automatically at the end of each period unless canceled beforehand.",
                "You may cancel your subscription at any time from your workspace settings.",
                "Amounts already paid are non-refundable, except where required by law or expressly agreed by Mokaid.",
                "In case of non-payment, Mokaid reserves the right to suspend or terminate access to the service.",
              ]}
            />
            <Prose className="mt-4">
              Prices may change with 30 days&apos; notice. If you disagree, you may cancel your
              subscription before the new prices take effect.
            </Prose>
          </section>

          <section>
            <SectionTitle index="10" title="Service availability and maintenance" />
            <Prose>
              {COMPANY_NAME} strives to keep the platform available 24/7. However, we do not
              guarantee uninterrupted availability. Interruptions may occur for maintenance,
              updates, or events beyond our control (force majeure, third-party infrastructure
              outages, etc.).
            </Prose>
            <Prose className="mt-3">
              We aim to notify planned maintenance with reasonable notice via the platform or by
              email.
            </Prose>
          </section>

          <section>
            <SectionTitle index="11" title="Limitation of liability" />
            <Prose>To the fullest extent permitted by applicable law:</Prose>
            <SubList
              items={[
                "The platform is provided “as is” without warranty of results or fitness for a particular purpose.",
                "Mokaid shall not be liable for indirect, incidental, special, or consequential damages arising from use of the platform.",
                "Mokaid’s total liability to you under these Terms is limited to the amounts you paid in the 12 months preceding the event giving rise to liability.",
                "Mokaid is not responsible for service interruptions caused by events beyond its control (force majeure, third-party failure, etc.).",
              ]}
            />
            <Prose className="mt-4">
              These limitations apply even if {COMPANY_NAME} has been advised of the possibility
              of such damages.
            </Prose>
          </section>

          <section>
            <SectionTitle index="12" title="Suspension and termination" />
            <Prose>
              <strong className="text-text">Termination by you.</strong> You may close your
              account at any time from your profile settings or by contacting support. Closing
              your account results in permanent deletion of your data within the timeframes set
              out in our Privacy Policy.
            </Prose>
            <Prose className="mt-4">
              <strong className="text-text">Termination by Mokaid.</strong> We reserve the right
              to suspend or terminate your access to the platform, with or without notice, in
              cases including:
            </Prose>
            <SubList
              items={[
                "Breach of these Terms or our Privacy Policy.",
                "Non-payment of a subscription.",
                "Fraudulent or abusive use of the platform.",
                "Court order or legal obligation.",
                "Permanent discontinuation of the service.",
              ]}
            />
            <Prose className="mt-4">
              In case of termination for breach, no refund will be due. If {COMPANY_NAME}{" "}
              discontinues the service, we will notify you at least 30 days in advance and help you
              export your data.
            </Prose>
          </section>

          <section>
            <SectionTitle index="13" title="Governing law and jurisdiction" />
            <Prose>
              These Terms are governed by French law. In the event of a dispute relating to their
              interpretation or performance, and failing amicable resolution within 60 days of
              notice of the dispute, the parties agree to submit the matter to the competent courts
              of Paris, France, except where mandatory rules provide otherwise.
            </Prose>
            <Prose className="mt-3">
              Consumer users may also have the right to refer a dispute to a consumer mediator for
              amicable resolution, where applicable under local consumer law.
            </Prose>
          </section>

          <section>
            <SectionTitle index="14" title="Changes to the Terms" />
            <Prose>
              {COMPANY_NAME} reserves the right to modify these Terms at any time. For material
              changes, we will notify you:
            </Prose>
            <SubList
              items={[
                "By email to the address associated with your account.",
                "Via a notification on the platform.",
                "At least 30 days before the changes take effect.",
              ]}
            />
            <Prose className="mt-4">
              If you continue to use the platform after the new Terms take effect, you are deemed
              to have accepted them. Otherwise, you may terminate your account before that date.
            </Prose>
          </section>

          <section>
            <SectionTitle index="15" title="Severability" />
            <Prose>
              If any clause of these Terms is held void or unenforceable by a competent court, the
              remaining clauses remain in full force. The void clause will be replaced by a valid
              clause that most closely reflects the parties&apos; intent.
            </Prose>
          </section>

          <section>
            <SectionTitle index="16" title="Contact" />
            <Prose>For any questions about these Terms of Service, contact us:</Prose>
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

function SubList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-text-secondary">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
