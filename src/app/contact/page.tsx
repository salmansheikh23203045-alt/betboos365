"use client";

import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";

const CHANNELS = [
  { icon: "MessageCircle" as const, title: "Live Chat", text: "Chat with our support team in real time. Available 24/7.", cta: "Start Chat", href: "/chat" },
  { icon: "Mail" as const, title: "Email", text: "Send us a message and we'll get back to you within 24 hours.", cta: "support@betboos365.com", href: "mailto:support@betboos365.com" },
  { icon: "Phone" as const, title: "Phone", text: "Call us for urgent matters. Available Monday to Friday, 9am-6pm.", cta: "+1 (800) 123-4567", href: "tel:+18001234567" },
];

export default function ContactPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-8 px-4 py-6 lg:px-6">
      <PageBanner title="Contact Us" subtitle="We're here to help" icon="Headset" />

      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((ch) => {
          const Icon = ICONS[ch.icon];
          return (
            <NeonCard key={ch.title} hoverGlow className="text-center">
              <Icon aria-hidden="true" className="mx-auto mb-3 size-10 text-tcl-gold" />
              <h2 className="text-heading-sm font-bold uppercase text-tcl-white">{ch.title}</h2>
              <p className="mt-1 text-caption text-tcl-muted">{ch.text}</p>
              <a href={ch.href} className="mt-3 inline-block text-sm font-semibold text-tcl-gold hover:underline">
                {ch.cta}
              </a>
            </NeonCard>
          );
        })}
      </div>

      <NeonCard as="section" className="space-y-4">
        <h2 className="font-display text-heading-lg uppercase text-gold-gradient">Send a Message</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="text-caption font-semibold text-tcl-white">Name</label>
              <input
                id="contact-name"
                type="text"
                placeholder="Your name"
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="text-caption font-semibold text-tcl-white">Email</label>
              <input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contact-subject" className="text-caption font-semibold text-tcl-white">Subject</label>
            <input
              id="contact-subject"
              type="text"
              placeholder="What can we help with?"
              className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contact-msg" className="text-caption font-semibold text-tcl-white">Message</label>
            <textarea
              id="contact-msg"
              rows={5}
              placeholder="Your message..."
              className="w-full resize-y rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 py-3 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
            />
          </div>
          <PrimaryButton type="submit" size="lg" fullWidth>
            Send Message
          </PrimaryButton>
        </form>
      </NeonCard>
    </div>
  );
}
