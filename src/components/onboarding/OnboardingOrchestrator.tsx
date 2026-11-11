"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Logo } from "@/components/ui/Logo";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

const SHOW_KEY = "tcl_show_onboarding";
const doneKey = (userId: string) => `tcl_onboarded_${userId}`;
type Step = 0 | 1 | 2 | 3;

/**
 * Three-popup onboarding shown ONCE after a successful registration.
 *
 * Persistence model:
 *   - signup success sets `localStorage[tcl_show_onboarding]="1"` just before redirect
 *   - this component fires when that flag is present AND the user is logged in AND
 *     `tcl_onboarded_<userId>` is not yet set
 *   - any resolution of step 3 clears the show flag and writes the per-user done flag
 *   - because the per-user flag is keyed by id, a different account on the same device
 *     still gets its own onboarding
 *
 * We deliberately do NOT run this on normal login: the show flag is only written
 * by /signup, never by /login.
 */
export function OnboardingOrchestrator() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    let show = false;
    try {
      show = window.localStorage.getItem(SHOW_KEY) === "1";
      const done = window.localStorage.getItem(doneKey(user.id)) === "1";
      if (!show || done) return;
    } catch {
      return;
    }

    setStep(1);
  }, [user]);

  function markDone() {
    if (!user) return;
    try {
      window.localStorage.setItem(doneKey(user.id), "1");
      window.localStorage.removeItem(SHOW_KEY);
    } catch {
      /* ignore */
    }
    setStep(0);
  }

  function dismiss() {
    // Closing counts as completion so we don't trap the user.
    markDone();
  }

  function goToDeposit() {
    markDone();
    router.push("/profile/deposit");
  }

  function goToProfile() {
    markDone();
    router.push("/profile");
  }

  if (!user || step === 0) return null;

  return (
    <>
      <Modal
        open={step === 1}
        onClose={dismiss}
        title={BN.onboarding.importantNoticeTitle}
        size="md"
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-caption leading-relaxed text-tcl-white/90">
          <section className="space-y-1">
            <p className="font-semibold text-tcl-white">
              {BN.onboarding.noticeHeading1}
            </p>
            <p>{BN.onboarding.noticeBody1}</p>
          </section>
          <section className="space-y-1">
            <p className="font-semibold text-tcl-white">
              {BN.onboarding.noticeHeading2}
            </p>
            <p>{BN.onboarding.noticeBody2}</p>
          </section>
          <p>{BN.onboarding.noticeBody3}</p>
          <section className="space-y-1">
            <p className="font-semibold text-tcl-white">
              {BN.onboarding.noticeHeading3}
            </p>
            <p>{BN.onboarding.noticeBody4}</p>
          </section>
          <p className="rounded-md border border-tcl-gold/40 bg-tcl-gold/10 p-2 text-tcl-gold">
            {BN.onboarding.noticeKycNote}
          </p>
          <div className="flex justify-end pt-2">
            <PrimaryButton onClick={() => setStep(2)} size="md">
              {BN.common.continue}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={step === 2}
        onClose={dismiss}
        title={BN.onboarding.importantAnnouncementTitle}
        size="sm"
      >
        <div className="space-y-4 text-caption leading-relaxed text-tcl-white/90">
          <p className="rounded-md border border-tcl-gold/40 bg-tcl-gold/10 p-2 font-semibold text-tcl-gold">
            {BN.onboarding.announcementHeading}
          </p>
          <p>{BN.onboarding.announcementBody1}</p>
          <p>{BN.onboarding.announcementBody2}</p>
          <p>{BN.onboarding.announcementBody3}</p>
          <p>{BN.onboarding.announcementBody4}</p>
          <div className="flex justify-center pt-2">
            <PrimaryButton onClick={() => setStep(3)} size="lg">
              {BN.onboarding.understood}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={step === 3}
        onClose={dismiss}
        title=""
        size="sm"
      >
        <div className="space-y-4 text-center text-tcl-white">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>

          <div className="flex justify-center">
            <span
              className={cn(
                "flex size-16 items-center justify-center rounded-full",
                "bg-gradient-to-br from-tcl-gold to-amber-500 shadow-[0_0_24px_rgba(255,215,0,0.5)]",
              )}
            >
              <ICONS.Check aria-hidden="true" className="size-9 text-tcl-black" />
            </span>
          </div>

          <p className="font-display text-xl uppercase text-tcl-gold">
            {BN.onboarding.registrationSuccessTitle}
          </p>

          <p className="text-caption leading-relaxed text-tcl-white/80">
            {BN.onboarding.successIntro}
          </p>

          <div className="flex items-center justify-center gap-3">
            <StepPill n={1} done />
            <StepPill n={2} done />
            <StepPill n={3} done current />
          </div>

          <div className="h-px bg-tcl-border-muted" />

          <p className="text-caption text-tcl-white/80">
            {BN.onboarding.successNextStep}
          </p>

          <div className="space-y-2">
            <PrimaryButton
              onClick={goToDeposit}
              size="lg"
              fullWidth
              icon="ArrowDownCircle"
            >
              {BN.onboarding.depositNow}
            </PrimaryButton>
            <SecondaryButton
              onClick={goToProfile}
              size="md"
              fullWidth
              icon="User"
            >
              {BN.onboarding.goToProfile}
            </SecondaryButton>
          </div>
        </div>
      </Modal>
    </>
  );
}

function StepPill({
  n,
  done,
  current,
}: {
  n: number;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full border text-[11px] font-bold",
        current
          ? "border-tcl-gold bg-tcl-gold text-tcl-black"
          : done
            ? "border-tcl-gold/60 bg-tcl-gold/20 text-tcl-gold"
            : "border-tcl-border-muted bg-tcl-surface-2 text-tcl-muted",
      )}
    >
      {done && current ? (
        <ICONS.Check aria-hidden="true" className="size-4" />
      ) : (
        n
      )}
    </span>
  );
}
