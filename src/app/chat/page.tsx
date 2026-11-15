import type { Metadata } from "next";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "Live Chat | BetBoos365" };

export default function ChatPage() {
  return (
    <div className="animate-fade-in-up flex min-h-[60vh] items-center justify-center px-4 py-10">
      <NeonCard className="w-full max-w-lg space-y-6 text-center">
        <ICONS.MessageCircle aria-hidden="true" className="mx-auto size-16 text-tcl-gold" />
        <h1 className="font-display text-display-xl uppercase text-gold-gradient">Live Chat</h1>
        <p className="text-body text-tcl-muted">
          Our support team is available 24/7 to help you with any questions or issues.
          The live chat widget will appear once the backend integration is complete.
        </p>

        <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-tcl-success" />
            <span className="text-caption font-semibold text-tcl-success">Support Online</span>
          </div>
          <p className="text-caption text-tcl-muted">
            Average response time: <span className="font-semibold text-tcl-white">&lt; 2 minutes</span>
          </p>
        </div>

        <SecondaryButton href="/contact" size="lg" arrow>
          Contact Us Instead
        </SecondaryButton>
      </NeonCard>
    </div>
  );
}
