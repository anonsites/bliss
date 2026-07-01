import type { Metadata } from "next";
import { LegalPageTemplate } from "@/components/legal/LegalPageTemplate";

export const metadata: Metadata = {
  title: "Terms of Use | Bliss",
  description: "Placeholder terms of use template for Bliss.",
};

const termsSections = [
  {
    heading: "Acceptance of these terms",
    paragraphs: [
      "These terms are a placeholder framework for Bliss. By accessing or using the service, a user agrees to the version that is published at the time of use once your final legal copy replaces this template.",
      "If a user does not agree with the terms, the user should not access or continue using the service.",
    ],
  },
  {
    heading: "Eligibility and accounts",
    paragraphs: [
      "Bliss should only be used by people who meet your minimum age requirement and are legally allowed to use the product in their jurisdiction.",
      "Users are responsible for providing accurate account information and maintaining the security of their login credentials and devices.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "Users must not misuse the product, interfere with the platform, or use Bliss in a way that creates safety, privacy, or legal risk for other people.",
    ],
    bullets: [
      "No unlawful, abusive, harassing, or deceptive activity.",
      "No scraping, reverse engineering, or unauthorized access attempts.",
      "No impersonation, fraud, or distribution of harmful content.",
    ],
  },
  {
    heading: "User content and licenses",
    paragraphs: [
      "Users generally keep ownership of the content they submit, but the final version of these terms should grant Bliss the limited rights needed to host, display, process, and moderate that content within the service.",
      "Bliss retains all rights in its software, branding, product design, and other company-owned intellectual property.",
    ],
  },
  {
    heading: "Service availability",
    paragraphs: [
      "Bliss may update, suspend, or discontinue features at any time. The service can also experience interruptions, bugs, or availability issues.",
      "This placeholder should be replaced with the exact commitments, disclaimers, and limitation language approved for your launch.",
    ],
  },
  {
    heading: "Enforcement and termination",
    paragraphs: [
      "Bliss may investigate suspected misuse and may suspend or terminate access for violations of these terms, safety concerns, fraud, or legal compliance reasons.",
      "Users may stop using the service at any time, subject to any surviving obligations described in the final published version.",
    ],
  },
  {
    heading: "Contact details",
    paragraphs: [
      "Replace this paragraph with your legal entity name, mailing address, and support or legal contact email before publishing the final terms.",
    ],
  },
] satisfies Parameters<typeof LegalPageTemplate>[0]["sections"];

export default function TermsPage() {
  return (
    <LegalPageTemplate
      activePage="terms"
      eyebrow="Terms Template"
      lastUpdated="March 26, 2026"
      sections={termsSections}
      summary="A placeholder structure for Bliss terms of use. Replace the draft language with counsel-reviewed text before launch."
      title="Terms of Use"
    />
  );
}
