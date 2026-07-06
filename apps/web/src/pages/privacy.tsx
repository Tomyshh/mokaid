import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

const EFFECTIVE_DATE = "6 juillet 2026";
const COMPANY_NAME = "Mokaid";
const FOUNDER_NAME = "Itsaq Tom Jami";
const CONTACT_EMAIL = "tom@yapio.io";

export function PrivacyPage() {
  return (
    <div className="min-h-full bg-bg-deep text-text">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-bg-deep/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="mk-focus-ring flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft size={13} /> Retour au site
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

      {/* Content */}
      <main className="mx-auto max-w-3xl px-5 py-16">
        {/* Title block */}
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-light">
            <Shield size={12} />
            Document légal
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text">
            Politique de confidentialité
          </h1>
          <p className="mt-4 text-sm text-text-muted">
            Dernière mise à jour : {EFFECTIVE_DATE}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {COMPANY_NAME} attache une importance fondamentale à la protection de vos données
            personnelles. Cette politique explique quelles données nous collectons, pourquoi nous
            les collectons, comment nous les traitons et quels sont vos droits à leur égard.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            En utilisant la plateforme {COMPANY_NAME}, vous reconnaissez avoir lu et compris la
            présente politique de confidentialité.
          </p>
        </div>

        <div className="space-y-12">
          {/* 1 */}
          <section>
            <SectionTitle index="1" title="Responsable du traitement" />
            <Prose>
              Le responsable du traitement des données personnelles collectées via la plateforme{" "}
              {COMPANY_NAME} est :
            </Prose>
            <div className="mt-4 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-text-secondary">
              <p>
                <strong className="text-text">{COMPANY_NAME}</strong>
              </p>
              <p>Fondateur : {FOUNDER_NAME}</p>
              <p>
                Contact :{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary-light hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
            <Prose className="mt-4">
              Pour toute question relative à vos données personnelles ou pour exercer vos droits,
              vous pouvez nous contacter à l&apos;adresse e-mail indiquée ci-dessus.
            </Prose>
          </section>

          {/* 2 */}
          <section>
            <SectionTitle index="2" title="Données collectées" />
            <Prose>
              Nous collectons différentes catégories de données selon votre utilisation de la
              plateforme :
            </Prose>
            <SubList
              items={[
                {
                  label: "Données de compte",
                  detail:
                    "Nom complet, adresse e-mail, mot de passe (haché), photo de profil (optionnel).",
                },
                {
                  label: "Données d'utilisation",
                  detail:
                    "Actions effectuées sur la plateforme, pages visitées, temps de session, événements d'interface.",
                },
                {
                  label: "Données liées aux agents IA",
                  detail:
                    "Instructions, tâches assignées, historiques de conversation avec les agents, résultats produits.",
                },
                {
                  label: "Données d'intégration",
                  detail:
                    "Jetons d'accès OAuth (GitHub, Google, Figma, etc.) nécessaires au fonctionnement des intégrations tierces que vous activez.",
                },
                {
                  label: "Données de paiement",
                  detail:
                    "Informations de facturation traitées via notre prestataire de paiement (Stripe). Nous ne stockons jamais les numéros de carte bancaire.",
                },
                {
                  label: "Données techniques",
                  detail:
                    "Adresse IP, type de navigateur, système d'exploitation, logs serveur à des fins de sécurité et de débogage.",
                },
              ]}
            />
            <Prose className="mt-4">
              Nous ne collectons pas de données sensibles au sens du RGPD (origines ethniques,
              opinions politiques, données de santé, etc.).
            </Prose>
          </section>

          {/* 3 */}
          <section>
            <SectionTitle index="3" title="Finalités et bases légales du traitement" />
            <Prose>
              Chaque traitement de données repose sur une base légale conforme au Règlement
              Général sur la Protection des Données (RGPD – Règlement UE 2016/679) :
            </Prose>
            <table className="mt-4 w-full overflow-hidden rounded-lg border border-border text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Finalité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Base légale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  ["Création et gestion de votre compte", "Exécution du contrat (Art. 6.1.b)"],
                  ["Fourniture des fonctionnalités de la plateforme", "Exécution du contrat (Art. 6.1.b)"],
                  ["Envoi d'e-mails transactionnels", "Exécution du contrat (Art. 6.1.b)"],
                  ["Amélioration et développement du service", "Intérêt légitime (Art. 6.1.f)"],
                  ["Sécurité et prévention de la fraude", "Intérêt légitime (Art. 6.1.f)"],
                  ["Envoi de communications marketing (opt-in)", "Consentement (Art. 6.1.a)"],
                  ["Respect des obligations légales", "Obligation légale (Art. 6.1.c)"],
                  ["Facturation et comptabilité", "Obligation légale (Art. 6.1.c)"],
                ].map(([finalite, base]) => (
                  <tr key={finalite} className="text-text-secondary">
                    <td className="px-4 py-3">{finalite}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 4 */}
          <section>
            <SectionTitle index="4" title="Durées de conservation" />
            <Prose>
              Nous conservons vos données uniquement le temps nécessaire aux finalités pour
              lesquelles elles ont été collectées :
            </Prose>
            <SubList
              items={[
                {
                  label: "Données de compte actif",
                  detail: "Pendant toute la durée de votre relation contractuelle.",
                },
                {
                  label: "Données après fermeture du compte",
                  detail:
                    "30 jours (délai de grâce pour réactivation), puis suppression ou anonymisation définitive.",
                },
                {
                  label: "Données de facturation",
                  detail: "10 ans, conformément aux obligations comptables et fiscales.",
                },
                {
                  label: "Logs techniques",
                  detail: "90 jours à des fins de sécurité et de débogage.",
                },
                {
                  label: "Données marketing (opt-in)",
                  detail: "Jusqu'au retrait de votre consentement.",
                },
              ]}
            />
          </section>

          {/* 5 */}
          <section>
            <SectionTitle index="5" title="Partage et destinataires des données" />
            <Prose>
              Nous ne vendons jamais vos données personnelles à des tiers. Nous pouvons partager
              vos données uniquement dans les cas suivants :
            </Prose>
            <SubList
              items={[
                {
                  label: "Sous-traitants techniques",
                  detail:
                    "Hébergement (Render), base de données, envoi d'e-mails, analytics — tous liés par des contrats de traitement conformes au RGPD.",
                },
                {
                  label: "Prestataire de paiement",
                  detail:
                    "Stripe Inc. traite vos paiements directement et est soumis à sa propre politique de confidentialité.",
                },
                {
                  label: "Services d'intégration tiers",
                  detail:
                    "GitHub, Google Workspace, Figma, etc. — uniquement si vous activez ces intégrations et dans la limite des permissions accordées.",
                },
                {
                  label: "Obligations légales",
                  detail:
                    "Autorités compétentes sur réquisition judiciaire ou obligation légale.",
                },
                {
                  label: "Cession d'activité",
                  detail:
                    "En cas de fusion, acquisition ou cession, vos données peuvent être transférées au repreneur, avec notification préalable.",
                },
              ]}
            />
          </section>

          {/* 6 */}
          <section>
            <SectionTitle index="6" title="Transferts internationaux de données" />
            <Prose>
              Certains de nos sous-traitants peuvent être établis en dehors de l'Union européenne
              (notamment aux États-Unis). Dans ce cas, nous nous assurons que ces transferts sont
              encadrés par des garanties appropriées, notamment :
            </Prose>
            <SubList
              items={[
                {
                  label: "Clauses contractuelles types (CCT)",
                  detail: "Approuvées par la Commission européenne.",
                },
                {
                  label: "Décision d'adéquation",
                  detail:
                    "Reconnaissance d'un niveau de protection équivalent par la Commission européenne.",
                },
              ]}
            />
          </section>

          {/* 7 */}
          <section>
            <SectionTitle index="7" title="Cookies et traceurs" />
            <Prose>
              La plateforme {COMPANY_NAME} utilise des cookies et technologies similaires :
            </Prose>
            <SubList
              items={[
                {
                  label: "Cookies strictement nécessaires",
                  detail:
                    "Session d'authentification, préférences de sécurité. Ces cookies ne nécessitent pas votre consentement.",
                },
                {
                  label: "Cookies analytics",
                  detail:
                    "Mesure d'audience anonymisée pour améliorer le service. Activés uniquement avec votre consentement.",
                },
              ]}
            />
            <Prose className="mt-4">
              Vous pouvez gérer vos préférences cookies via les paramètres de votre navigateur.
              Le refus des cookies non essentiels n'affecte pas l'accès aux fonctionnalités
              principales de la plateforme.
            </Prose>
          </section>

          {/* 8 */}
          <section>
            <SectionTitle index="8" title="Sécurité des données" />
            <Prose>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger vos données contre tout accès non autorisé, perte, altération ou
              divulgation :
            </Prose>
            <SubList
              items={[
                {
                  label: "Chiffrement",
                  detail:
                    "Les données sont transmises via HTTPS (TLS 1.2+) et les mots de passe sont hachés avec bcrypt.",
                },
                {
                  label: "Accès restreint",
                  detail:
                    "Principe du moindre privilège appliqué à l'ensemble de nos équipes et systèmes.",
                },
                {
                  label: "Journalisation",
                  detail: "Surveillance des accès et des anomalies en temps réel.",
                },
                {
                  label: "Sauvegardes",
                  detail: "Sauvegardes régulières des données avec procédures de restauration testées.",
                },
              ]}
            />
            <Prose className="mt-4">
              En cas de violation de données personnelles susceptible d'engendrer un risque pour
              vos droits et libertés, nous vous en informerons dans les 72 heures conformément
              à l'article 33 du RGPD.
            </Prose>
          </section>

          {/* 9 */}
          <section>
            <SectionTitle index="9" title="Vos droits" />
            <Prose>
              Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits
              suivants sur vos données personnelles :
            </Prose>
            <SubList
              items={[
                {
                  label: "Droit d'accès (Art. 15)",
                  detail: "Obtenir une copie des données personnelles que nous détenons sur vous.",
                },
                {
                  label: "Droit de rectification (Art. 16)",
                  detail: "Corriger des données inexactes ou incomplètes.",
                },
                {
                  label: "Droit à l'effacement (Art. 17)",
                  detail:
                    "Demander la suppression de vos données, sous réserve de nos obligations légales.",
                },
                {
                  label: "Droit à la limitation du traitement (Art. 18)",
                  detail:
                    "Restreindre temporairement le traitement de vos données dans certaines circonstances.",
                },
                {
                  label: "Droit à la portabilité (Art. 20)",
                  detail:
                    "Recevoir vos données dans un format structuré et lisible par machine.",
                },
                {
                  label: "Droit d'opposition (Art. 21)",
                  detail:
                    "Vous opposer au traitement fondé sur notre intérêt légitime ou à des fins de prospection.",
                },
                {
                  label: "Retrait du consentement",
                  detail:
                    "Retirer à tout moment votre consentement aux traitements qui en dépendent.",
                },
              ]}
            />
            <Prose className="mt-4">
              Pour exercer vos droits, contactez-nous à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-light hover:underline">
                {CONTACT_EMAIL}
              </a>
              . Nous nous engageons à répondre dans un délai d'un mois à compter de la réception
              de votre demande (délai pouvant être prolongé de deux mois pour les demandes
              complexes).
            </Prose>
            <Prose className="mt-3">
              Si vous estimez que le traitement de vos données n'est pas conforme à la
              réglementation, vous avez le droit d'introduire une réclamation auprès de la
              Commission Nationale de l'Informatique et des Libertés (CNIL) :{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-light hover:underline"
              >
                www.cnil.fr
              </a>
              .
            </Prose>
          </section>

          {/* 10 */}
          <section>
            <SectionTitle index="10" title="Mineurs" />
            <Prose>
              La plateforme {COMPANY_NAME} est destinée aux personnes majeures (18 ans et plus).
              Nous ne collectons pas sciemment de données personnelles de mineurs. Si vous
              constatez qu'un mineur nous a communiqué des données personnelles, contactez-nous
              afin que nous puissions les supprimer.
            </Prose>
          </section>

          {/* 11 */}
          <section>
            <SectionTitle index="11" title="Modifications de la présente politique" />
            <Prose>
              Nous pouvons mettre à jour cette politique de confidentialité à tout moment pour
              refléter des évolutions légales, techniques ou fonctionnelles. En cas de
              modifications significatives, nous vous notifierons par e-mail ou via une bannière
              sur la plateforme au moins 30 jours avant leur entrée en vigueur.
            </Prose>
            <Prose className="mt-3">
              La date de dernière mise à jour est indiquée en haut de ce document. Nous vous
              invitons à la consulter régulièrement.
            </Prose>
          </section>

          {/* 12 */}
          <section>
            <SectionTitle index="12" title="Contact" />
            <Prose>
              Pour toute question, demande ou réclamation relative à la protection de vos données
              personnelles, vous pouvez nous contacter :
            </Prose>
            <div className="mt-4 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-text-secondary">
              <p>
                <strong className="text-text">{COMPANY_NAME}</strong>
              </p>
              <p>À l'attention de : {FOUNDER_NAME}</p>
              <p>
                E-mail :{" "}
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

        {/* Footer links */}
        <div className="mt-16 border-t border-border/50 pt-8 flex flex-col items-center gap-3 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} {COMPANY_NAME}. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-text transition-colors">
              Conditions d'utilisation
            </Link>
            <span>·</span>
            <Link to="/" className="hover:text-text transition-colors">
              Retour à l'accueil
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

function SubList(
  { items }: { items: { label: string; detail: string }[] },
) {
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
