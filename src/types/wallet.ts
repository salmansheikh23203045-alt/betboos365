export type TransactionStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type PaymentType = "SEND_MONEY" | "CASH_OUT";

export interface PaymentProvider {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  brandColor: string;
  isActive: boolean;
}

export interface WalletView {
  id: string;
  userId: string;
  currency: string;
  availableBalance: number;
  reservedBalance: number;
  totalBalance: number;
}

export interface WalletConfig {
  currency: string;
  agentNumber: string;
  deposit: { min: number; max: number };
  withdrawal: { min: number; max: number };
}

export interface DepositTransaction {
  id: string;
  type: "DEPOSIT";
  provider: PaymentProvider | null;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  agentNumber: string;
  transactionReference: string;
  status: TransactionStatus;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalTransaction {
  id: string;
  type: "WITHDRAWAL";
  provider: PaymentProvider | null;
  receivingPhone: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  adminNote: string | null;
  payoutReference: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WalletTransaction = DepositTransaction | WithdrawalTransaction;

export interface AdminDepositRow extends DepositTransaction {
  user: { id: string; username: string } | null;
}
export interface AdminWithdrawalRow extends WithdrawalTransaction {
  user: { id: string; username: string } | null;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
