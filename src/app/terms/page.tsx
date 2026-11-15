import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";

export const metadata: Metadata = { title: "Terms & Conditions | BetBoos365" };

const SECTIONS = [
  { title: "1. Acceptance of Terms", body: "By accessing and using the BetBoos365 platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services. We reserve the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of any changes." },
  { title: "2. Eligibility", body: "You must be at least 18 years of age (or the minimum legal gambling age in your jurisdiction, whichever is higher) to use BetBoos365. You are responsible for ensuring that online gambling is legal in your jurisdiction. BetBoos365 reserves the right to verify your age and identity at any time." },
  { title: "3. Account Registration", body: "To use certain features of BetBoos365, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Only one account per person is permitted. Duplicate accounts may be closed, and associated funds may be forfeited." },
  { title: "4. Deposits and Withdrawals", body: "BetBoos365 supports various payment methods for deposits and withdrawals. All transactions are subject to security verification. Minimum and maximum limits apply. Processing times vary by payment method. BetBoos365 reserves the right to request additional documentation for identity verification before processing withdrawals." },
  { title: "5. Bonuses and Promotions", body: "All bonuses and promotions are subject to specific terms and wagering requirements. BetBoos365 reserves the right to modify or cancel promotions at any time. Abuse of bonus offers, including but not limited to creating multiple accounts or using automated systems, may result in forfeiture of bonus funds and account closure." },
  { title: "6. Fair Play", body: "All games on BetBoos365 use certified Random Number Generators (RNG). Any attempt to manipulate game outcomes, exploit software bugs, or engage in fraudulent activity is strictly prohibited and may result in account suspension, fund forfeiture, and legal action." },
  { title: "7. Responsible Gaming", body: "BetBoos365 is committed to responsible gaming. We provide tools to help you manage your gaming activity, including deposit limits, loss limits, session time reminders, and self-exclusion options. If you believe you have a gambling problem, please contact our support team or visit a responsible gambling resource." },
  { title: "8. Limitation of Liability", body: "BetBoos365 is provided 'as is' without any warranties. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform. This includes, but is not limited to, losses from gaming activities, technical interruptions, or unauthorized access to your account." },
  { title: "9. Privacy", body: "Your privacy is important to us. Please refer to our Privacy Policy for information on how we collect, use, and protect your personal data. By using BetBoos365, you consent to the collection and use of your information as described in our Privacy Policy." },
  { title: "10. Contact", body: "If you have any questions about these Terms and Conditions, please contact us at support@betboos365.com or through our Live Chat feature." },
];

export default function TermsPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[960px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Terms & Conditions" icon="ShieldCheck" />

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
