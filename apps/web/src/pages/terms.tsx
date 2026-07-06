import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

const EFFECTIVE_DATE = "6 juillet 2026";
const COMPANY_NAME = "Mokaid";
const FOUNDER_NAME = "Itsaq Tom Jami";
const CONTACT_EMAIL = "tom@yapio.io";

export function TermsPage() {
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
            <FileText size={12} />
            Document légal
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text">
            Conditions générales d'utilisation
          </h1>
          <p className="mt-4 text-sm text-text-muted">
            Dernière mise à jour : {EFFECTIVE_DATE}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Les présentes conditions générales d'utilisation (ci-après les « CGU ») régissent
            l'accès et l'utilisation de la plateforme {COMPANY_NAME}, disponible à l'adresse{" "}
            <strong className="text-text">mokaid.io</strong>, exploitée par{" "}
            <strong className="text-text">{COMPANY_NAME}</strong>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            En créant un compte ou en accédant à la plateforme, vous acceptez pleinement et sans
            réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous devez cesser
            d'utiliser la plateforme immédiatement.
          </p>
        </div>

        <div className="space-y-12">
          {/* 1 */}
          <section>
            <SectionTitle index="1" title="Présentation du service" />
            <Prose>
              {COMPANY_NAME} est une plateforme SaaS (Software as a Service) qui permet aux
              entreprises et à leurs équipes de gérer simultanément des collaborateurs humains
              et des agents d'intelligence artificielle (IA) au sein d'un espace de travail
              unifié.
            </Prose>
            <Prose className="mt-3">
              La plateforme offre notamment les fonctionnalités suivantes :
            </Prose>
            <SubList
              items={[
                "Création, configuration et supervision d'agents IA autonomes.",
                "Gestion de projets, tâches et flux de travail mixtes (humains + IA).",
                "Tableau de bord d'équipe en temps réel.",
                "Base de connaissances partagée et gestion documentaire.",
                "Intégrations avec des services tiers (GitHub, Google Workspace, Figma, etc.).",
                "Messagerie interne, calendrier et analytics.",
                "Facturation et gestion des abonnements.",
              ]}
            />
            <Prose className="mt-4">
              {COMPANY_NAME} se réserve le droit de faire évoluer les fonctionnalités du service
              à tout moment, avec ou sans préavis, sous réserve des dispositions de l'article 14
              des présentes CGU.
            </Prose>
          </section>

          {/* 2 */}
          <section>
            <SectionTitle index="2" title="Conditions d'accès et création de compte" />
            <Prose>
              L'accès à la plateforme {COMPANY_NAME} est subordonné à la création d'un compte
              utilisateur. Pour vous inscrire, vous devez :
            </Prose>
            <SubList
              items={[
                "Être une personne physique âgée d'au moins 18 ans ou une personne morale légalement constituée.",
                "Fournir une adresse e-mail valide et un mot de passe sécurisé.",
                "Disposer de la capacité juridique pour s'engager par les présentes CGU.",
                "Ne pas avoir fait l'objet d'une suspension ou résiliation de compte sur la plateforme.",
              ]}
            />
            <Prose className="mt-4">
              Vous êtes responsable de la confidentialité de vos identifiants de connexion.
              Toute utilisation de la plateforme effectuée via votre compte est réputée effectuée
              par vous et vous en êtes entièrement responsable. Vous devez notifier immédiatement
              {" "}{COMPANY_NAME} de tout accès non autorisé à votre compte à l'adresse{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-light hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </Prose>
            <Prose className="mt-3">
              {COMPANY_NAME} se réserve le droit de refuser toute inscription sans avoir à
              justifier sa décision.
            </Prose>
          </section>

          {/* 3 */}
          <section>
            <SectionTitle index="3" title="Espaces de travail (Workspaces)" />
            <Prose>
              La plateforme est organisée autour d'espaces de travail (« workspaces »). Le
              créateur d'un workspace est désigné comme administrateur et dispose de droits
              étendus, notamment :
            </Prose>
            <SubList
              items={[
                "Inviter et révoquer des membres.",
                "Configurer les agents IA et les intégrations.",
                "Gérer la facturation et l'abonnement.",
                "Consulter les données et journaux du workspace.",
              ]}
            />
            <Prose className="mt-4">
              L'administrateur est responsable du respect des présentes CGU par l'ensemble des
              membres de son workspace. Il garantit notamment que les membres invités ont
              accepté les présentes CGU avant d'accéder au service.
            </Prose>
          </section>

          {/* 4 */}
          <section>
            <SectionTitle index="4" title="Agents d'intelligence artificielle" />
            <Prose>
              La plateforme {COMPANY_NAME} permet de créer et de gérer des agents IA autonomes.
              Vous reconnaissez et acceptez expressément ce qui suit :
            </Prose>
            <SubList
              items={[
                "Les agents IA génèrent des contenus et prennent des actions en fonction des instructions que vous leur fournissez. Vous en êtes le seul responsable.",
                "Les résultats produits par les agents IA sont fournis « en l'état » et peuvent contenir des erreurs, imprécisions ou omissions.",
                "Vous vous engagez à vérifier les sorties des agents IA avant toute utilisation à des fins critiques (juridiques, médicales, financières, etc.).",
                "Il est interdit d'utiliser les agents IA pour produire des contenus illicites, discriminatoires, trompeurs ou portant atteinte aux droits de tiers.",
                "Mokaid ne saurait être tenu responsable des décisions prises par vous-même ou par des tiers sur la base des sorties des agents IA.",
              ]}
            />
          </section>

          {/* 5 */}
          <section>
            <SectionTitle index="5" title="Utilisation acceptable" />
            <Prose>
              L'utilisation de la plateforme {COMPANY_NAME} est soumise aux règles suivantes.
              Il est strictement interdit de :
            </Prose>
            <SubList
              items={[
                "Utiliser la plateforme à des fins illicites ou contraires aux présentes CGU.",
                "Reproduire, revendre ou sous-licencier l'accès à la plateforme sans autorisation préalable écrite.",
                "Tenter d'accéder à des systèmes, données ou comptes auxquels vous n'êtes pas autorisé.",
                "Contourner ou tenter de contourner les mesures de sécurité de la plateforme.",
                "Introduire des virus, maliciels ou tout code malveillant.",
                "Utiliser la plateforme pour envoyer du spam, du phishing ou tout contenu non sollicité.",
                "Exploiter la plateforme par des moyens automatisés non autorisés (scraping, bots, etc.).",
                "Usurper l'identité d'une autre personne ou entité.",
                "Porter atteinte aux droits de propriété intellectuelle de {COMPANY_NAME} ou de tiers.",
                "Violer les droits à la vie privée d'autrui.",
              ]}
            />
            <Prose className="mt-4">
              Le non-respect de ces règles peut entraîner la suspension ou la résiliation
              immédiate de votre compte, sans préjudice de toute action judiciaire.
            </Prose>
          </section>

          {/* 6 */}
          <section>
            <SectionTitle index="6" title="Propriété intellectuelle" />
            <Prose>
              <strong className="text-text">{COMPANY_NAME} et la plateforme.</strong> La
              plateforme {COMPANY_NAME}, son code source, son design, ses marques, logos,
              algorithmes et toute la documentation associée sont la propriété exclusive de{" "}
              {COMPANY_NAME} et sont protégés par les lois applicables en matière de propriété
              intellectuelle. Aucune licence n'est accordée sur ces éléments au-delà du droit
              d'usage personnel prévu par les présentes CGU.
            </Prose>
            <Prose className="mt-4">
              <strong className="text-text">Vos contenus.</strong> Vous conservez l'ensemble
              des droits de propriété intellectuelle sur les contenus que vous créez, importez
              ou traitez via la plateforme (données, documents, instructions d'agents, etc.).
              En utilisant la plateforme, vous accordez à {COMPANY_NAME} une licence limitée,
              non exclusive et non cessible pour traiter vos contenus aux seules fins de
              fourniture du service.
            </Prose>
            <Prose className="mt-4">
              <strong className="text-text">Contenus générés par les agents IA.</strong> Les
              droits sur les contenus générés par les agents IA que vous configurez vous sont
              intégralement attribués, dans le respect des lois applicables sur le droit
              d'auteur relatif aux œuvres générées par IA.
            </Prose>
          </section>

          {/* 7 */}
          <section>
            <SectionTitle index="7" title="Données personnelles et confidentialité" />
            <Prose>
              Le traitement de vos données personnelles est régi par notre{" "}
              <Link to="/privacy" className="text-primary-light hover:underline">
                Politique de confidentialité
              </Link>
              , qui fait partie intégrante des présentes CGU. Nous vous invitons à la lire
              attentivement.
            </Prose>
            <Prose className="mt-3">
              En tant qu'administrateur de workspace, vous êtes susceptible d'être qualifié de
              responsable du traitement pour les données personnelles de vos membres et de vos
              agents humains. {COMPANY_NAME} agit alors en qualité de sous-traitant. Un accord
              de traitement des données (DPA) est disponible sur demande à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-light hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </Prose>
          </section>

          {/* 8 */}
          <section>
            <SectionTitle index="8" title="Intégrations tierces" />
            <Prose>
              La plateforme permet de se connecter à des services tiers (GitHub, Google
              Workspace, Figma, Stripe, etc.). Ces intégrations sont soumises aux conditions
              d'utilisation et politiques de confidentialité propres à chaque service tiers.
            </Prose>
            <Prose className="mt-3">
              {COMPANY_NAME} ne peut être tenu responsable des interruptions, erreurs ou
              modifications apportées par ces services tiers. En activant une intégration, vous
              autorisez {COMPANY_NAME} à accéder aux données de ce service tiers dans la limite
              des permissions que vous accordez.
            </Prose>
          </section>

          {/* 9 */}
          <section>
            <SectionTitle index="9" title="Tarification, abonnements et facturation" />
            <Prose>
              L'accès à certaines fonctionnalités de {COMPANY_NAME} est soumis à un abonnement
              payant. En souscrivant un abonnement :
            </Prose>
            <SubList
              items={[
                "Vous acceptez les tarifs en vigueur au moment de votre souscription, disponibles sur notre page de tarification.",
                "Le paiement est traité par Stripe, notre prestataire de paiement sécurisé.",
                "Les abonnements sont renouvelés automatiquement à la fin de chaque période, sauf résiliation préalable.",
                "Vous pouvez résilier votre abonnement à tout moment depuis les paramètres de votre workspace.",
                "Les sommes déjà versées ne sont pas remboursables, sauf disposition légale contraire ou accord exprès de Mokaid.",
                "En cas de non-paiement, Mokaid se réserve le droit de suspendre ou résilier l'accès au service.",
              ]}
            />
            <Prose className="mt-4">
              Les tarifs peuvent être modifiés avec un préavis de 30 jours. En cas de
              désaccord, vous pouvez résilier votre abonnement avant la date d'entrée en vigueur
              des nouveaux tarifs.
            </Prose>
          </section>

          {/* 10 */}
          <section>
            <SectionTitle index="10" title="Disponibilité du service et maintenance" />
            <Prose>
              {COMPANY_NAME} s'efforce de maintenir la plateforme accessible 24h/24 et 7j/7.
              Toutefois, nous ne garantissons pas une disponibilité ininterrompue du service.
              Des interruptions peuvent survenir pour des opérations de maintenance, des mises
              à jour ou des événements indépendants de notre volonté (force majeure, pannes
              d'infrastructures tierces, etc.).
            </Prose>
            <Prose className="mt-3">
              Nous nous efforçons de notifier les maintenances planifiées avec un préavis
              raisonnable via l'interface de la plateforme ou par e-mail.
            </Prose>
          </section>

          {/* 11 */}
          <section>
            <SectionTitle index="11" title="Limitation de responsabilité" />
            <Prose>
              Dans les limites autorisées par la loi applicable :
            </Prose>
            <SubList
              items={[
                `La plateforme est fournie « en l'état » sans garantie de résultats ou d'adéquation à un usage particulier.`,
                `Mokaid ne saurait être tenu responsable des dommages indirects, accessoires, spéciaux ou consécutifs découlant de l'utilisation de la plateforme.`,
                `La responsabilité totale de Mokaid envers vous au titre des présentes CGU est limitée aux sommes versées par vous au cours des 12 derniers mois précédant l'événement donnant lieu à responsabilité.`,
                `Mokaid n'est pas responsable des interruptions de service dues à des causes indépendantes de sa volonté (force majeure, défaillance d'un tiers, etc.).`,
              ]}
            />
            <Prose className="mt-4">
              Ces limitations s'appliquent même si {COMPANY_NAME} a été informé de la
              possibilité de tels dommages.
            </Prose>
          </section>

          {/* 12 */}
          <section>
            <SectionTitle index="12" title="Suspension et résiliation" />
            <Prose>
              <strong className="text-text">Résiliation par l'utilisateur.</strong> Vous pouvez
              fermer votre compte à tout moment depuis les paramètres de votre profil ou en
              contactant notre support. La fermeture du compte entraîne la suppression définitive
              de vos données dans les délais précisés dans notre Politique de confidentialité.
            </Prose>
            <Prose className="mt-4">
              <strong className="text-text">Résiliation par Mokaid.</strong> Nous nous réservons
              le droit de suspendre ou résilier votre accès à la plateforme, avec ou sans
              préavis, dans les cas suivants :
            </Prose>
            <SubList
              items={[
                "Violation des présentes CGU ou de notre Politique de confidentialité.",
                "Non-paiement d'un abonnement.",
                "Utilisation frauduleuse ou abusive de la plateforme.",
                "Décision judiciaire ou obligation légale.",
                "Cessation définitive du service.",
              ]}
            />
            <Prose className="mt-4">
              En cas de résiliation pour manquement, aucun remboursement ne sera dû. En cas de
              cessation du service par {COMPANY_NAME}, nous vous informerons au moins 30 jours
              à l'avance et vous faciliterons l'export de vos données.
            </Prose>
          </section>

          {/* 13 */}
          <section>
            <SectionTitle index="13" title="Droit applicable et juridiction compétente" />
            <Prose>
              Les présentes CGU sont soumises au droit français. En cas de litige relatif à
              leur interprétation ou à leur exécution, et à défaut de résolution amiable dans
              un délai de 60 jours à compter de la notification du litige, les parties conviennent
              de soumettre le différend aux tribunaux compétents de Paris, France, sauf
              dispositions d'ordre public contraires.
            </Prose>
            <Prose className="mt-3">
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, les
              utilisateurs consommateurs disposent du droit de recourir à un médiateur de la
              consommation en vue de la résolution amiable du litige.
            </Prose>
          </section>

          {/* 14 */}
          <section>
            <SectionTitle index="14" title="Modifications des CGU" />
            <Prose>
              {COMPANY_NAME} se réserve le droit de modifier les présentes CGU à tout moment.
              En cas de modifications substantielles, nous vous en informerons :
            </Prose>
            <SubList
              items={[
                "Par e-mail à l'adresse associée à votre compte.",
                "Via une notification sur la plateforme.",
                "Au moins 30 jours avant l'entrée en vigueur des modifications.",
              ]}
            />
            <Prose className="mt-4">
              Si vous continuez à utiliser la plateforme après l'entrée en vigueur des nouvelles
              CGU, vous êtes réputé les avoir acceptées. Dans le cas contraire, vous pouvez
              résilier votre compte avant cette date.
            </Prose>
          </section>

          {/* 15 */}
          <section>
            <SectionTitle index="15" title="Divisibilité" />
            <Prose>
              Si une clause des présentes CGU est déclarée nulle ou inapplicable par une
              juridiction compétente, les autres clauses conservent leur plein effet. La clause
              nulle sera remplacée par une clause valide se rapprochant le plus possible de
              l'intention des parties.
            </Prose>
          </section>

          {/* 16 */}
          <section>
            <SectionTitle index="16" title="Contact" />
            <Prose>
              Pour toute question concernant les présentes conditions générales d'utilisation,
              contactez-nous :
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
            <Link to="/privacy" className="hover:text-text transition-colors">
              Politique de confidentialité
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
