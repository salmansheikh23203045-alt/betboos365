import type {
  PaymentProvider,
  WalletConfig,
  WalletTransaction,
  WalletView,
  PageMeta,
} from "@/types/wallet";

async function parse<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; message: string; status: number }> {
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    message?: string;
  };
  if (!res.ok) {
    return { ok: false, message: body.message ?? res.statusText, status: res.status };
  }
  return { ok: true, data: body.data as T };
}

export async function fetchWalletConfig() {
  return parse<WalletConfig>(await fetch("/api/me/wallet/config", { cache: "no-store" }));
}

export async function fetchWalletProviders() {
  return parse<PaymentProvider[]>(
    await fetch("/api/me/wallet/providers", { cache: "no-store" }),
  );
}

export async function fetchMyWallet() {
  return parse<WalletView>(await fetch("/api/me/wallet", { cache: "no-store" }));
}

export async function createDeposit(payload: {
  providerCode: string;
  paymentType: "SEND_MONEY" | "CASH_OUT";
  amount: number;
  transactionReference: string;
}) {
  return parse<WalletTransaction>(
    await fetch("/api/me/deposits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function createWithdrawal(payload: {
  providerCode: string;
  receivingPhone: string;
  amount: number;
}) {
  return parse<WalletTransaction>(
    await fetch("/api/me/withdrawals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function fetchTransactions(params: {
  type?: "all" | "deposit" | "withdrawal";
  status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const url = `/api/me/transactions${qs.toString() ? `?${qs}` : ""}`;
  return parse<{ data: WalletTransaction[]; meta: PageMeta }>(
    await fetch(url, { cache: "no-store" }),
  );
}
