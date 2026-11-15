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
  /** Number the deposit was sent from (any mobile number), if the player gave one. */
  senderPhone?: string | null;
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

export interface StaffRef {
  id: string;
  username: string;
}
export interface AdminDepositRow extends DepositTransaction {
  user: StaffRef | null;
  /** Staff member who approved or rejected it. */
  processedBy?: StaffRef | null;
}
export interface AdminWithdrawalRow extends WithdrawalTransaction {
  user: StaffRef | null;
  /** The requester is an agent withdrawing from their own agent wallet. */
  requesterIsAgent?: boolean;
  processedBy?: StaffRef | null;
  completedBy?: StaffRef | null;
  /** Agent the payout is assigned to. */
  assignedAgent?: StaffRef | null;
  assignedAt?: string | null;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
