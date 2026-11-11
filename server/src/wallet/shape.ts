import {
  DepositRequest,
  PaymentProvider,
  WithdrawalRequest,
} from '@prisma/client';

export interface ProviderView {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  brandColor: string;
  isActive: boolean;
}

export interface DepositView {
  id: string;
  type: 'DEPOSIT';
  provider: ProviderView | null;
  paymentType: string;
  amount: number;
  currency: string;
  agentNumber: string;
  transactionReference: string;
  status: string;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalView {
  id: string;
  type: 'WITHDRAWAL';
  provider: ProviderView | null;
  receivingPhone: string;
  amount: number;
  currency: string;
  status: string;
  adminNote: string | null;
  payoutReference: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function providerView(p: PaymentProvider): ProviderView {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    logoUrl: p.logoUrl,
    brandColor: p.brandColor,
    isActive: p.isActive,
  };
}

export function depositView(d: DepositRequest & { provider?: PaymentProvider | null }): DepositView {
  return {
    id: d.id,
    type: 'DEPOSIT',
    provider: d.provider ? providerView(d.provider) : null,
    paymentType: d.paymentType,
    amount: Number(d.amount),
    currency: d.currency,
    agentNumber: d.agentNumber,
    transactionReference: d.transactionReference,
    status: d.status,
    adminNote: d.adminNote,
    processedAt: d.processedAt ? d.processedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function withdrawalView(
  w: WithdrawalRequest & { provider?: PaymentProvider | null },
): WithdrawalView {
  return {
    id: w.id,
    type: 'WITHDRAWAL',
    provider: w.provider ? providerView(w.provider) : null,
    receivingPhone: w.receivingPhone,
    amount: Number(w.amount),
    currency: w.currency,
    status: w.status,
    adminNote: w.adminNote,
    payoutReference: w.payoutReference,
    processedAt: w.processedAt ? w.processedAt.toISOString() : null,
    completedAt: w.completedAt ? w.completedAt.toISOString() : null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}
