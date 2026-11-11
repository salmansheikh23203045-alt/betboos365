import type { Metadata } from "next";
import Link from "next/link";
import { NeonCard } from "@/components/ui/NeonCard";
import { PageBanner } from "@/components/pages/PageBanner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";

export const metadata: Metadata = {
  title: `${BN.responsibleGaming.title} | TCL11`,
  description:
    "দায়িত্বশীল গেমিং সম্পর্কে TCL11-এর নীতি, নিয়ম ও সহায়তার উৎস।",
};

const PRINCIPLES: { title: string; body: string; icon: "ShieldCheck" | "Clock" | "Users" | "AlertTriangle" }[] = [
  {
    icon: "ShieldCheck",
    title: "১৮+ বয়স যাচাইকরণ",
    body: "শুধুমাত্র ১৮ বছর বা তার বেশি বয়সের প্রাপ্তবয়স্কদের TCL11-এ অ্যাকাউন্ট খুলতে ও গেম খেলতে অনুমতি দেওয়া হয়।",
  },
  {
    icon: "Clock",
    title: "নির্ধারিত সীমা",
    body: "আপনার সময় ও খরচের জন্য আগেই সীমা ঠিক করুন। সীমা শেষ হলে নিজেকে থামানোর অভ্যাস করুন।",
  },
  {
    icon: "Users",
    title: "আর্থিক সীমারেখা",
    body: "যে অর্থ হারাতে পারেন শুধু সেটিই গেমিং-এ ব্যবহার করুন। ঋণ নিয়ে বা ঘরের বাজেট থেকে বাজি ধরা থেকে বিরত থাকুন।",
  },
  {
    icon: "AlertTriangle",
    title: "ক্ষতির পেছনে ছুটবেন না",
    body: "হারানো টাকা ফেরত পাওয়ার চেষ্টায় অতিরিক্ত বাজি ধরা সবচেয়ে বড় ঝুঁকি। বিরতি নিন, স্পষ্ট মনে ফিরুন।",
  },
];

const WARNING_SIGNS = [
  "খেলা থেকে মন ফিরিয়ে আনতে কষ্ট হচ্ছে।",
  "আপনার বাজেটের বাইরে টাকা খরচ করছেন।",
  "ক্ষতি ঢাকতে আরো বাজি ধরছেন।",
  "গেমিং নিয়ে পরিবারের সাথে মিথ্যা বলছেন।",
  "ঘুম, কাজ বা পরিবার থেকে দূরে সরে যাচ্ছেন।",
];

const HELPLINES = [
  {
    name: "BeGambleAware",
    detail: "আন্তর্জাতিক সহায়তা ও তথ্য",
    href: "https://www.begambleaware.org/",
  },
  {
    name: "GamCare",
    detail: "চব্বিশ ঘণ্টা লাইভ চ্যাট এবং হটলাইন",
    href: "https://www.gamcare.org.uk/",
  },
  {
    name: "Gamblers Anonymous",
    detail: "সমর্থন গোষ্ঠী ও স্থানীয় সভা",
    href: "https://www.gamblersanonymous.org/",
  },
];

export default function ResponsibleGamingPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1080px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner
        title={BN.responsibleGaming.title}
        subtitle={BN.responsibleGaming.subtitle}
        icon="ShieldCheck"
      />

      <section>
        <h2 className="mb-3 font-display text-heading-md uppercase text-tcl-white">
          {BN.responsibleGaming.principlesTitle}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {PRINCIPLES.map((p) => {
            const Icon = ICONS[p.icon];
            return (
              <NeonCard key={p.title} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-5 text-tcl-gold" />
                  <h3 className="font-semibold text-tcl-white">{p.title}</h3>
                </div>
                <p className="text-caption text-tcl-muted">{p.body}</p>
              </NeonCard>
            );
          })}
        </div>
      </section>

      <NeonCard className="space-y-3 border-tcl-red/40">
        <div className="flex items-center gap-2">
          <ICONS.AlertTriangle aria-hidden="true" className="size-5 text-tcl-red-bright" />
          <h2 className="font-display text-heading-md uppercase text-tcl-white">
            সতর্ক সংকেতসমূহ
          </h2>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-caption text-tcl-muted">
          {WARNING_SIGNS.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </NeonCard>

      <NeonCard className="space-y-3">
        <h2 className="font-display text-heading-md uppercase text-tcl-white">
          {BN.responsibleGaming.helpTitle}
        </h2>
        <p className="text-caption text-tcl-muted">{BN.responsibleGaming.helpBody}</p>
        <div className="grid gap-3 md:grid-cols-3">
          {HELPLINES.map((h) => (
            <a
              key={h.name}
              href={h.href}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3 transition-colors hover:border-tcl-gold/60"
            >
              <p className="font-semibold text-tcl-white group-hover:text-tcl-gold">
                {h.name}
              </p>
              <p className="text-caption text-tcl-muted">{h.detail}</p>
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <PrimaryButton href="/contact" size="md" icon="Headset">
            {BN.common.contactSupport}
          </PrimaryButton>
          <SecondaryButton href="/faq" variant="outline" size="md" icon="HelpCircle">
            {BN.nav.faq}
          </SecondaryButton>
        </div>
      </NeonCard>

      <p className="text-center text-[11px] text-tcl-muted">
        TCL11 দায়িত্বশীল গেমিং-কে সমর্থন করে। নিয়ম ও শর্তাবলীর বিস্তারিত পড়ুন{" "}
        <Link href="/terms" className="text-tcl-gold hover:underline">
          {BN.nav.terms}
        </Link>{" "}
        পৃষ্ঠায়।
      </p>
    </div>
  );
}
