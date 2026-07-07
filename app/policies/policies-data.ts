/**
 * Policy content for the Policies page.
 *
 * Labels and titles are translated via the `policies` i18n namespace (keyed by
 * `id`). The long-form legal body is kept here as static English — legal
 * policies are published verbatim and are not machine-translated, matching how
 * these documents are handled elsewhere in the portal.
 */

export type PolicyBlock =
  | { kind: "h"; text: string }
  | { kind: "sub"; text: string }
  | { kind: "p"; text: string }
  | { kind: "strong"; text: string };

export type Policy = {
  id: string;
  /** Publication date, shown in the "Last updated" line. */
  updated: string;
  blocks: PolicyBlock[];
};

/** Stable ordering of the sidebar navigation. */
export const POLICY_IDS = [
  "terms",
  "privacy",
  "phone",
  "email",
  "ueta",
  "acceptable",
  "cookies",
  "copyright",
  "ai",
] as const;

export type PolicyId = (typeof POLICY_IDS)[number];

export const POLICIES: Policy[] = [
  {
    id: "terms",
    updated: "October 18, 2017",
    blocks: [
      { kind: "p", text: "Hello and welcome to Loan Factory Terms & Conditions!" },
      {
        kind: "p",
        text: "These Terms & Conditions (“Terms”) cover your use of and access to the sites, templates, products, applications, tools and features (collectively, the “Services”) provided by Loan Factory, Inc. (together with its officers, directors, employees, agents, subsidiaries and affiliates, “Loan Factory”). Our Privacy Policy explains what personal information we collect and how it’s used, and our Acceptable Use Policy outlines some of your responsibilities when using the Services.",
      },
      {
        kind: "strong",
        text: "By using or accessing the Services, you’re agreeing to these Terms, our Privacy Policy and our Acceptable Use Policy (collectively, this “Agreement”). If you don’t agree to all the terms in this Agreement, you may not use or access the Services.",
      },
      {
        kind: "p",
        text: "While we’re not your lawyers, we do want to say: please read this Agreement carefully. It includes important information about your legal rights and covers areas such as automatic subscription renewals, warranty disclaimers, limitations of liability, resolution of disputes by arbitration and a class action waiver.",
      },
      { kind: "h", text: "1. Creating an account" },
      {
        kind: "p",
        text: "Make sure your account information is accurate, and keep your account safe. You’re responsible for your account and any activity on it. You also need to be at least 18 years old to use Loan Factory.",
      },
      { kind: "sub", text: "1.1 Signing up" },
      {
        kind: "p",
        text: "To use the Services, you must first create an account. You agree to provide us with accurate, complete and updated information for your account. We may need to use this information to contact you.",
      },
      { kind: "sub", text: "1.2 Staying safe" },
      {
        kind: "p",
        text: "Keep your password confidential and notify us right away if you believe your account has been compromised. You’re responsible for activity that happens under your credentials.",
      },
      { kind: "h", text: "2. Using the Services" },
      {
        kind: "p",
        text: "You may use the Services only as permitted by this Agreement and any applicable laws. Don’t misuse the Services, interfere with their normal operation, or attempt to access them using a method other than the interface and instructions we provide.",
      },
      { kind: "h", text: "3. Your content" },
      {
        kind: "p",
        text: "You retain ownership of the information and documents you submit through the Services. You grant Loan Factory the rights needed to process that information to provide the Services, including sharing it with lenders and service providers involved in your loan.",
      },
    ],
  },
  {
    id: "privacy",
    updated: "January 12, 2024",
    blocks: [
      {
        kind: "p",
        text: "This Privacy Policy describes how Loan Factory collects, uses, and shares your personal information when you use our Services.",
      },
      { kind: "h", text: "Information we collect" },
      {
        kind: "p",
        text: "We collect information you provide directly — such as your name, contact details, income, assets, and the documents you upload — as well as information collected automatically, like device and usage data.",
      },
      { kind: "h", text: "How we use it" },
      {
        kind: "p",
        text: "We use your information to process your loan application, verify your identity, communicate with you, comply with legal obligations, and improve our Services.",
      },
      { kind: "h", text: "How we share it" },
      {
        kind: "p",
        text: "We share information with lenders, credit bureaus, and service providers strictly to process your application. We do not sell your personal information.",
      },
    ],
  },
  {
    id: "phone",
    updated: "March 3, 2023",
    blocks: [
      {
        kind: "p",
        text: "By providing your phone number, you consent to receive calls and text messages from Loan Factory about your application and account.",
      },
      { kind: "h", text: "Message frequency & rates" },
      {
        kind: "p",
        text: "Message frequency varies. Message and data rates may apply. Consent is not a condition of any purchase.",
      },
      { kind: "h", text: "Opting out" },
      {
        kind: "p",
        text: "You can opt out of text messages at any time by replying STOP. Reply HELP for assistance.",
      },
    ],
  },
  {
    id: "email",
    updated: "March 3, 2023",
    blocks: [
      {
        kind: "p",
        text: "We use email to send you important updates about your application, required documents, and account activity, as well as optional marketing messages.",
      },
      { kind: "h", text: "Transactional vs. marketing" },
      {
        kind: "p",
        text: "Transactional emails related to your active application are necessary to provide the Services. You can unsubscribe from marketing emails using the link in any such message.",
      },
    ],
  },
  {
    id: "ueta",
    updated: "June 1, 2022",
    blocks: [
      {
        kind: "p",
        text: "To do business with Loan Factory electronically, you consent to the use of electronic records and signatures under the federal ESIGN Act and applicable state UETA laws.",
      },
      { kind: "h", text: "Your consent" },
      {
        kind: "p",
        text: "You agree that your electronic signature on applications, disclosures, and agreements is legally binding and equivalent to a handwritten signature.",
      },
      { kind: "h", text: "Hardware & software" },
      {
        kind: "p",
        text: "To access electronic records you need a current web browser, an email account, and the ability to view and save PDF files.",
      },
    ],
  },
  {
    id: "acceptable",
    updated: "August 15, 2023",
    blocks: [
      {
        kind: "p",
        text: "This Acceptable Use Policy outlines activities that are not permitted when using the Services.",
      },
      { kind: "h", text: "You may not" },
      {
        kind: "p",
        text: "Use the Services for any unlawful or fraudulent purpose; submit false information; infringe others’ rights; upload malicious code; or attempt to gain unauthorized access to our systems or other users’ data.",
      },
      { kind: "h", text: "Enforcement" },
      {
        kind: "p",
        text: "We may suspend or terminate access for violations of this policy, and may report unlawful activity to the appropriate authorities.",
      },
    ],
  },
  {
    id: "cookies",
    updated: "January 12, 2024",
    blocks: [
      {
        kind: "p",
        text: "Loan Factory uses cookies and similar technologies to operate our sites, remember your preferences, and understand how our Services are used.",
      },
      { kind: "h", text: "Types of cookies" },
      {
        kind: "p",
        text: "Essential cookies are required for the site to function. Analytics and preference cookies help us improve your experience. You can control non-essential cookies through your browser settings.",
      },
    ],
  },
  {
    id: "copyright",
    updated: "August 15, 2023",
    blocks: [
      {
        kind: "p",
        text: "All content on our sites — including text, graphics, logos, and software — is owned by or licensed to Loan Factory and protected by copyright and other intellectual property laws.",
      },
      { kind: "h", text: "Reporting infringement" },
      {
        kind: "p",
        text: "If you believe content on our site infringes your copyright, please send a notice to our designated agent with the details required under the DMCA.",
      },
    ],
  },
  {
    id: "ai",
    updated: "February 20, 2025",
    blocks: [
      {
        kind: "p",
        text: "Loan Factory uses artificial intelligence to help you complete your application faster and more accurately. This section explains how our AI features work and how your data is handled.",
      },
      { kind: "h", text: "How our AI assistant works" },
      {
        kind: "p",
        text: "When you upload documents such as W-2s or bank statements, our AI reads them to pre-fill parts of your application. You review and confirm all information before it is submitted.",
      },
      { kind: "h", text: "Your data & AI" },
      {
        kind: "p",
        text: "Documents processed by our AI are used only to prepare your application. We do not use your personal financial documents to train third-party general-purpose AI models.",
      },
      { kind: "h", text: "Human oversight" },
      {
        kind: "p",
        text: "AI-generated entries are always reviewable and editable by you and your loan officer. Final lending decisions involve human review.",
      },
    ],
  },
];
