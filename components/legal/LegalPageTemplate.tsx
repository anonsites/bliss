import Link from "next/link";
import { MobileTopNav } from "@/components/layout/MobileTopNav";
import styles from "./legal.module.css";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalSidebarCard {
  label: string;
  title: string;
  description?: string;
  items?: string[];
  variant?: "notice";
}

interface LegalPageTemplateProps {
  activePage: "policy" | "safety" | "terms";
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LegalSection[];
  sidebarCards?: LegalSidebarCard[];
}

const navigationLinks = [
  { href: "/terms", key: "terms", label: "Terms" },
  { href: "/policy", key: "policy", label: "Privacy" },
  { href: "/safety", key: "safety", label: "Safety" },
] as const;

const defaultSidebarCards: LegalSidebarCard[] = [
  {
    description:
      "This page is a structural draft for Bliss. It is not a substitute for counsel-reviewed legal copy.",
    label: "Template Status",
    title: "Launch placeholder",
    variant: "notice",
  },
  {
    items: [
      "Replace placeholder company names, addresses, and support contacts.",
      "Confirm age-gating, moderation, and regional compliance requirements.",
      "Have counsel review the final text before publishing it in production.",
    ],
    label: "Replace Before Launch",
    title: "Final checklist",
  },
];

export function LegalPageTemplate({
  activePage,
  eyebrow,
  title,
  summary,
  lastUpdated,
  sections,
  sidebarCards,
}: LegalPageTemplateProps) {
  const resolvedSidebarCards = sidebarCards ?? defaultSidebarCards;

  return (
    <main className={styles["legal-page"]}>
      <MobileTopNav />
      <div className={styles["legal-page__shell"]}>
        <header className={styles["legal-page__masthead"]}>
          <Link className={`${styles["legal-page__brand"]} font-rosemary`} href="/">
            BLISS
          </Link>

          <nav aria-label="Legal navigation" className={styles["legal-page__nav"]}>
            {navigationLinks.map((link) => (
              <Link
                key={link.key}
                className={`${styles["legal-page__nav-link"]} ${activePage === link.key ? styles["legal-page__nav-link--active"] : ""}`}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className={styles["legal-page__hero"]}>
          <p className={styles["legal-page__eyebrow"]}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles["legal-page__summary"]}>{summary}</p>

          <div className={styles["legal-page__meta"]}>
            <span>Last updated: {lastUpdated}</span>
            <Link href="/">Back to home</Link>
          </div>
        </section>

        <div className={styles["legal-page__grid"]}>
          <aside className={styles["legal-page__sidebar"]}>
            {resolvedSidebarCards.map((card) => (
              <section
                key={`${card.label}-${card.title}`}
                className={`${styles["legal-page__card"]} ${card.variant === "notice" ? styles["legal-page__card--notice"] : ""}`}
              >
                <p className={styles["legal-page__card-label"]}>{card.label}</p>
                <h2>{card.title}</h2>

                {card.description ? <p>{card.description}</p> : null}

                {card.items ? (
                  <ul className={styles["legal-page__list"]}>
                    {card.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </aside>

          <article className={styles["legal-page__article"]}>
            {sections.map((section, index) => (
              <section key={section.heading} className={styles["legal-page__section"]}>
                <div className={styles["legal-page__section-header"]}>
                  <span className={styles["legal-page__section-number"]}>
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <h2>{section.heading}</h2>
                </div>

                <div className={styles["legal-page__section-body"]}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.bullets ? (
                    <ul className={styles["legal-page__list"]}>
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}
