import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";

export const metadata: Metadata = { title: "Privacy Policy | BetBoos365" };

const SECTIONS = [
  { title: "1. Information We Collect", body: "We collect information you provide when creating an account (name, email, phone number, date of birth), payment information for transactions, and technical data such as your IP address, device type, and browser information. We may also collect data about your gaming activity to improve our services and ensure fair play." },
  { title: "2. How We Use Your Information", body: "Your information is used to: operate and maintain your account, process transactions, verify your identity and age, provide customer support, send promotional communications (with your consent), improve our platform and services, comply with legal and regulatory requirements, and detect and prevent fraud." },
  { title: "3. Data Security", body: "We implement industry-standard security measures including SSL/TLS encryption, secure data storage, regular security audits, and access controls. While we strive to protect your data, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security." },
  { title: "4. Third-Party Sharing", body: "We do not sell your personal information. We may share data with: payment processors to complete transactions, identity verification services, regulatory authorities as required by law, and service providers who assist in operating our platform (subject to confidentiality agreements)." },
  { title: "5. Cookies and Tracking", body: "We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze platform usage. You can control cookie settings through your browser. Disabling certain cookies may affect platform functionality." },
  { title: "6. Your Rights", body: "You have the right to: access your personal data, request corrections to inaccurate data, request deletion of your data (subject to legal retention requirements), opt out of marketing communications, and lodge a complaint with a data protection authority." },
  { title: "7. Data Retention", body: "We retain your personal data for as long as your account is active and for the period required by applicable laws and regulations. After account closure, we may retain certain data for legal, regulatory, and dispute resolution purposes." },
  { title: "8. Changes to This Policy", body: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically. Continued use of BetBoos365 after changes constitutes acceptance of the updated policy." },
  { title: "9. Contact Us", body: "For questions about this Privacy Policy or to exercise your data rights, please contact our Data Protection team at privacy@betboos365.com or through our Contact page." },
];

export default function PrivacyPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[960px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Privacy Policy" icon="Shield" />

      <NeonCard as="article" className="space-y-6">
        <p className="text-caption text-tcl-muted">Last updated: November 2026</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="space-y-2">
            <h2 className="text-heading-sm font-bold text-tcl-white">{s.title}</h2>
            <p className="text-caption text-tcl-muted leading-relaxed">{s.body}</p>
          </section>
        ))}
      </NeonCard>
    </div>
  );
}
