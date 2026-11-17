"use client";

import { useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";

interface DepositNumbers {
  depositNumber: string;
  agentSendMoneyCashoutNumber: string;
}

export function DepositNumbersClient() {
  const [numbers, setNumbers] = useState<DepositNumbers | null>(null);
  const [depositInput, setDepositInput] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [submittingAgent, setSubmittingAgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedDeposit, setCopiedDeposit] = useState(false);
  const [copiedAgent, setCopiedAgent] = useState(false);

  async function loadNumbers() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/deposit-numbers", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as { data?: DepositNumbers; message?: string };
      if (res.ok && body.data) {
        setNumbers(body.data);
        setDepositInput(body.data.depositNumber);
        setAgentInput(body.data.agentSendMoneyCashoutNumber);
        setError(null);
      } else {
        setError(body.message ?? "Failed to load deposit numbers");
      }
    } catch {
      setError("Network error loading numbers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNumbers();
  }, []);

  async function handleSaveDeposit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingDeposit(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/admin/deposit-numbers", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ depositNumber: depositInput.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { data?: DepositNumbers; message?: string };
      if (res.ok && body.data) {
        setNumbers(body.data);
        setDepositInput(body.data.depositNumber);
        setSuccess("Deposit number updated successfully.");
      } else {
        setError(body.message ?? "Failed to update deposit number");
      }
    } catch {
      setError("Network error updating deposit number");
    } finally {
      setSubmittingDeposit(false);
    }
  }

  async function handleSaveAgent(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingAgent(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/admin/deposit-numbers", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentSendMoneyCashoutNumber: agentInput.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { data?: DepositNumbers; message?: string };
      if (res.ok && body.data) {
        setNumbers(body.data);
        setAgentInput(body.data.agentSendMoneyCashoutNumber);
        setSuccess("Agent Send Money & Cashout number updated successfully.");
      } else {
        setError(body.message ?? "Failed to update agent number");
      }
    } catch {
      setError("Network error updating agent number");
    } finally {
      setSubmittingAgent(false);
    }
  }

  async function copyToClipboard(text: string, type: "deposit" | "agent") {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "deposit") {
        setCopiedDeposit(true);
        window.setTimeout(() => setCopiedDeposit(false), 1500);
      } else {
        setCopiedAgent(true);
        window.setTimeout(() => setCopiedAgent(false), 1500);
      }
    } catch {
      /* ignore */
    }
  }

  if (loading && !numbers) {
    return (
      <NeonCard className="py-12 text-center text-tcl-muted">
        <ICONS.Loader2 aria-hidden="true" className="inline size-6 animate-spin" />
        <p className="mt-2 text-sm">Loading deposit numbers…</p>
      </NeonCard>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-tcl-red/40 bg-tcl-red/10 px-4 py-3 text-sm text-tcl-red-bright">
          <ICONS.AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
          {error}
        </div>
      ) : null}

      {success ? (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-tcl-success/40 bg-tcl-success/10 px-4 py-3 text-sm text-tcl-success">
          <ICONS.CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deposit Number Section */}
        <NeonCard className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-tcl-gold/40 bg-tcl-gold/10 text-tcl-gold">
                <ICONS.ArrowDownCircle aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-heading-md uppercase text-tcl-white">Deposit Number</h2>
                <p className="text-[11px] text-tcl-muted">Shown to users on the deposit page</p>
              </div>
            </div>
            {numbers?.depositNumber ? (
              <button
                type="button"
                onClick={() => copyToClipboard(numbers.depositNumber, "deposit")}
                className="inline-flex items-center gap-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-1.5 text-caption font-semibold text-tcl-gold hover:border-tcl-gold/40 cursor-pointer"
              >
                {copiedDeposit ? <ICONS.Check className="size-4" /> : <ICONS.Copy className="size-4" />}
                {copiedDeposit ? "Copied" : "Copy"}
              </button>
            ) : null}
          </div>

          <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-tcl-muted">Currently Active</p>
            <p className="mt-1 font-mono text-lg font-bold text-tcl-gold">
              {numbers?.depositNumber ?? "Not configured"}
            </p>
          </div>

          <form onSubmit={handleSaveDeposit} className="space-y-3 pt-2">
            <label className="block space-y-1.5">
              <span className="text-caption font-semibold text-tcl-white">New Deposit Number</span>
              <input
                type="text"
                value={depositInput}
                onChange={(e) => setDepositInput(e.target.value)}
                placeholder="e.g. 01956869852 or +8801956869852"
                maxLength={20}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 font-mono text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
              />
              <span className="block text-[11px] text-tcl-muted">
                Accepts Bangladeshi mobile numbers (+8801XXXXXXXXX, 01XXXXXXXXX, etc.).
              </span>
            </label>

            <PrimaryButton type="submit" size="lg" fullWidth disabled={submittingDeposit || !depositInput.trim()}>
              {submittingDeposit ? "Saving…" : "Save Deposit Number"}
            </PrimaryButton>
          </form>
        </NeonCard>

        {/* Agent Send Money & Cashout Number Section */}
        <NeonCard className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-tcl-gold/40 bg-tcl-gold/10 text-tcl-gold">
                <ICONS.Smartphone aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-heading-md uppercase text-tcl-white">Send Money & Cashout</h2>
                <p className="text-[11px] text-tcl-muted">Shared number for agent send money and cashout</p>
              </div>
            </div>
            {numbers?.agentSendMoneyCashoutNumber ? (
              <button
                type="button"
                onClick={() => copyToClipboard(numbers.agentSendMoneyCashoutNumber, "agent")}
                className="inline-flex items-center gap-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-1.5 text-caption font-semibold text-tcl-gold hover:border-tcl-gold/40 cursor-pointer"
              >
                {copiedAgent ? <ICONS.Check className="size-4" /> : <ICONS.Copy className="size-4" />}
                {copiedAgent ? "Copied" : "Copy"}
              </button>
            ) : null}
          </div>

          <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-tcl-muted">Currently Active</p>
            <p className="mt-1 font-mono text-lg font-bold text-tcl-gold">
              {numbers?.agentSendMoneyCashoutNumber ?? "Not configured"}
            </p>
          </div>

          <form onSubmit={handleSaveAgent} className="space-y-3 pt-2">
            <label className="block space-y-1.5">
              <span className="text-caption font-semibold text-tcl-white">New Send Money & Cashout Number</span>
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder="e.g. 01956869852 or +8801956869852"
                maxLength={20}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 font-mono text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
              />
              <span className="block text-[11px] text-tcl-muted">
                Used by agents for both Send Money and Cashout actions.
              </span>
            </label>

            <PrimaryButton type="submit" size="lg" fullWidth disabled={submittingAgent || !agentInput.trim()}>
              {submittingAgent ? "Saving…" : "Save Send Money & Cashout Number"}
            </PrimaryButton>
          </form>
        </NeonCard>
      </div>
    </div>
  );
}
