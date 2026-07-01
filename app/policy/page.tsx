import type { Metadata } from "next";
import { LegalPageTemplate } from "@/components/legal/LegalPageTemplate";

export const metadata: Metadata = {
  title: "Privacy Policy | Bliss",
  description: "Placeholder privacy policy template for Bliss.",
};

const policySections = [
  {
    heading: "What this page is",
    paragraphs: [
      "This privacy policy is a placeholder template for Bliss. It gives you a publishable structure, but it still needs the exact business, compliance, and data-handling details for your launch.",
    ],
  },
  {
    heading: "Information Bliss may collect",
    paragraphs: [
      "The final policy should describe the categories of personal information Bliss collects when people browse, register, create profiles, interact with others, and use location-aware features.",
    ],
    bullets: [
      "Account details such as name, phone number, email address, or authentication identifiers.",
      "Profile content such as photos, preferences, bio details, and other submitted information.",
      "Device, usage, diagnostic, and approximate or precise location data where permitted.",
    ],
  },
  {
    heading: "How Bliss may use information",
    paragraphs: [
      "The final policy should explain how Bliss uses collected information to operate the service, personalize the experience, secure the platform, prevent abuse, and comply with legal obligations.",
    ],
    bullets: [
      "To create and maintain user accounts.",
      "To power matching, discovery, moderation, and safety workflows.",
      "To analyze product performance and improve the service over time.",
    ],
  },
  {
    heading: "How information may be shared",
    paragraphs: [
      "Bliss should explain when information is shared with vendors, infrastructure providers, moderation tools, analytics providers, legal authorities, or as part of a corporate transaction.",
      "If the product enables profile visibility or location-based discovery, the final copy should clearly describe what other users can see.",
    ],
  },
  {
    heading: "Retention and deletion",
    paragraphs: [
      "Replace this section with the actual retention windows you intend to apply to account records, support tickets, safety logs, and deleted content backups.",
      "The final policy should also describe when information is deleted, de-identified, or retained for security, fraud prevention, or legal reasons.",
    ],
  },
  {
    heading: "User choices and controls",
    paragraphs: [
      "Users should be told how they can access, update, export, or delete their information and how they can control settings such as location permissions, notifications, and marketing communications.",
    ],
  },
  {
    heading: "Security and contact",
    paragraphs: [
      "Bliss should describe the reasonable safeguards it uses to protect information, while also explaining that no system can be guaranteed to be completely secure.",
      "Replace this placeholder with your privacy contact email, support address, and any jurisdiction-specific rights language required for launch.",
    ],
  },
] satisfies Parameters<typeof LegalPageTemplate>[0]["sections"];

export default function PolicyPage() {
  return (
    <LegalPageTemplate
      activePage="policy"
      eyebrow="Privacy Template"
      lastUpdated="March 26, 2026"
      sections={policySections}
      summary="A placeholder structure for the Bliss privacy policy. Replace the draft sections with your actual data practices and compliance language before launch."
      title="Privacy Policy"
    />
  );
}
