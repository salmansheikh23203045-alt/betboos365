"use client";

import { useState } from "react";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { FAQ_ITEMS } from "@/data/pages";

function FaqAccordion({ item }: { item: (typeof FAQ_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-tcl-border-muted last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-tcl-gold cursor-pointer"
        aria-expanded={open}
      >
        <span className={cn("text-sm font-semibold transition-colors", open ? "text-tcl-gold" : "text-tcl-white")}>{item.question}</span>
        <ICONS.ChevronDown
          aria-hidden="true"
          className={cn("size-4 shrink-0 text-tcl-gold transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <div className="accordion-body" data-open={open ? "true" : "false"}>
        <div>
          <div className="pb-4 text-caption leading-relaxed text-tcl-muted">{item.answer}</div>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const categories = [...new Set(FAQ_ITEMS.map((i) => i.category))];

  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="FAQ" subtitle="Frequently asked questions" icon="HelpCircle" />

      {categories.map((cat, ci) => (
        <NeonCard key={cat} as="section" className="animate-stagger space-y-0" style={{ "--stagger-i": ci + 1 } as React.CSSProperties}>
          <h2 className="mb-2 font-display text-heading-md uppercase text-gold-gradient">{cat}</h2>
          {FAQ_ITEMS.filter((i) => i.category === cat).map((item) => (
            <FaqAccordion key={item.id} item={item} />
          ))}
        </NeonCard>
      ))}
    </div>
  );
}
