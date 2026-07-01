import type { Metadata } from "next";
import {
  LegalPageTemplate,
  type LegalSection,
  type LegalSidebarCard,
} from "@/components/legal/LegalPageTemplate";

export const metadata: Metadata = {
  title: "Safety Tips | Bliss",
  description: "Safety guidance for using Bliss and meeting people through hookup platforms.",
};

const safetySidebarCards: LegalSidebarCard[] = [
  {
    description:
      "Move slowly, keep control of your plans, and never ignore behavior that makes you uneasy.",
    label: "Safety First",
    title: "Use the app carefully",
    variant: "notice",
  },
  {
    items: [
      "Tell a friend where you are going and when you expect to be back.",
      "Meet in public first, even if you intend to move somewhere private later.",
      "Use block and report tools quickly when a profile feels deceptive or unsafe.",
    ],
    label: "Quick Habits",
    title: "Start with these steps",
  },
];

const safetySections: LegalSection[] = [
  {
    heading: "Verify before you meet",
    paragraphs: [
      "Take a little time to confirm the person matches their profile before agreeing to meet. A short video call, recent photo, or consistent social presence can reduce the risk of catfishing and fake accounts.",
      "If someone refuses basic verification, pressures you to move off-platform immediately, or keeps changing their story, slow down or walk away.",
    ],
  },
  {
    heading: "Protect your personal information",
    paragraphs: [
      "Avoid sharing your home address, workplace, financial information, personal ID details, or other sensitive information early on. Hookup platforms move fast, but trust should still be earned.",
    ],
    bullets: [
      "Use in-app chat until you feel comfortable moving elsewhere.",
      "Keep location sharing limited to what is necessary for meeting safely.",
      "Do not send money, account codes, or verification payments to strangers.",
    ],
  },
  {
    heading: "Choose safer meetup plans",
    paragraphs: [
      "For a first in-person meeting, pick a public and familiar place where you can leave easily. Set your own transport plan so you are never dependent on the other person to get home.",
      "If you later decide to meet somewhere private, do it only after you feel informed, comfortable, and in control of the situation.",
    ],
  },
  {
    heading: "Tell someone you trust",
    paragraphs: [
      "Share your plan with a friend before you go. Let them know who you are meeting, where you will be, and when they should check in if they have not heard from you.",
    ],
    bullets: [
      "Send the meetup location and the profile name or screenshots.",
      "Set a check-in time before the date starts.",
      "Agree on a word or phrase you can text if you need help leaving.",
    ],
  },
  {
    heading: "Stay alert during the date",
    paragraphs: [
      "Keep control of your phone, drinks, and boundaries. Avoid leaving beverages unattended, and be cautious with alcohol or substances if they could affect your ability to make clear decisions.",
      "Consent should be clear, mutual, and ongoing. If something changes or stops feeling right, you do not owe anyone continued engagement.",
    ],
  },
  {
    heading: "Leave when something feels off",
    paragraphs: [
      "You do not need a perfect reason to leave. If the person becomes aggressive, ignores your boundaries, pressures you for sex, asks for money, or behaves in a deceptive way, prioritize getting out safely.",
      "Move toward staff, a rideshare pickup point, a public area, or someone you trust if you need immediate support.",
    ],
  },
  {
    heading: "Report, block, and seek help",
    paragraphs: [
      "Use the platform's report and block tools when someone behaves abusively, impersonates others, threatens you, or violates consent and safety boundaries.",
      "If you believe you are in immediate danger, contact local emergency services right away rather than waiting for an in-app response.",
    ],
  },
];

export default function SafetyPage() {
  return (
    <LegalPageTemplate
      activePage="safety"
      eyebrow="Safety Guide"
      lastUpdated="March 26, 2026"
      sections={safetySections}
      sidebarCards={safetySidebarCards}
      summary="Practical safety guidance for people using hookup platforms. This page focuses on caution, consent, privacy, and safer meetup habits."
      title="Staying Safe on Bliss"
    />
  );
}
