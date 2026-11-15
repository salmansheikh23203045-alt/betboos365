import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { FishingGame } from "@/components/fishing/FishingGame";
import { BN } from "@/i18n/bn";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = {
  title: `${BN.fishing.title} | BetBoos365`,
  description:
    "ফিশিং গেম — সমুদ্রতলের আকর্ষণীয় শিকার অভিজ্ঞতা, ভার্চুয়াল পয়েন্টের ডেমো।",
};

const FISH_GUIDE = [
  { name: "ছোট মাছ", hp: 1, points: 10, color: "#ffe079" },
  { name: "মাঝারি মাছ", hp: 2, points: 25, color: "#ff6b6b" },
  { name: "বড় মাছ", hp: 4, points: 60, color: "#9b59b6" },
  { name: "বস মাছ", hp: 8, points: 180, color: "#f1c40f" },
];

export default function FishingPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1080px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title={BN.fishing.title} subtitle={BN.fishing.subtitle} icon="Target" />

      <FishingGame />

      <div className="grid gap-3 md:grid-cols-2">
        <NeonCard className="space-y-3">
          <div className="flex items-center gap-2">
            <ICONS.Target aria-hidden="true" className="size-5 text-tcl-gold" />
            <h2 className="font-display text-heading-md uppercase text-tcl-white">
              কিভাবে খেলবেন
            </h2>
          </div>
          <ul className="space-y-2 text-caption text-tcl-muted">
            <li className="flex gap-2">
              <ICONS.CircleDot aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-tcl-gold" />
              <span>মাউস বা আঙুল দিয়ে কামানের দিক ঠিক করুন।</span>
            </li>
            <li className="flex gap-2">
              <ICONS.CircleDot aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-tcl-gold" />
              <span>গুলি করতে ট্যাপ করুন বা স্পেস বার চাপুন।</span>
            </li>
            <li className="flex gap-2">
              <ICONS.CircleDot aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-tcl-gold" />
              <span>বিরতি নিতে P চাপুন।</span>
            </li>
            <li className="flex gap-2">
              <ICONS.CircleDot aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-tcl-gold" />
              <span>বড় মাছ বেশি পয়েন্ট দেয়, কিন্তু বেশি গুলি লাগে।</span>
            </li>
          </ul>
        </NeonCard>

        <NeonCard className="space-y-3">
          <div className="flex items-center gap-2">
            <ICONS.Award aria-hidden="true" className="size-5 text-tcl-gold" />
            <h2 className="font-display text-heading-md uppercase text-tcl-white">
              পয়েন্ট চার্ট
            </h2>
          </div>
          <ul className="space-y-1.5">
            {FISH_GUIDE.map((g) => (
              <li
                key={g.name}
                className="flex items-center justify-between rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: g.color, boxShadow: `0 0 8px ${g.color}` }}
                  />
                  <span className="text-tcl-white">{g.name}</span>
                </div>
                <div className="flex items-center gap-3 text-caption">
                  <span className="text-tcl-muted">{g.hp} হিট</span>
                  <span className="font-display text-tcl-gold">
                    +{g.points} pts
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </NeonCard>
      </div>

      <NeonCard className="border-tcl-gold/40 bg-tcl-gold/5 text-caption text-tcl-muted">
        <p>
          <span className="font-semibold text-tcl-gold">{BN.common.notAvailable}:</span>{" "}
          {BN.fishing.virtualNote}
        </p>
      </NeonCard>
    </div>
  );
}
