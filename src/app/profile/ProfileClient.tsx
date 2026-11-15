"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/components/auth/AuthProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { SecurityPanel } from "@/components/profile/SecurityPanel";
import { SecurityScoreCard } from "@/components/profile/SecurityScoreCard";
import { MobileProfileHome } from "@/components/profile/MobileProfileHome";
import { fetchMyWallet } from "@/lib/wallet-client";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { WalletView } from "@/types/wallet";
import { BN } from "@/i18n/bn";

export interface ProfileData {
  userId: string;
  displayName: string;
  avatarUrl: string;
  preferredCurrency: string;
  language: string;
  timezone: string;
  vipLevel: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeBonuses: number;
  gamesPlayed: number;
  createdAt: string;
}

export function ProfileClient({
  user,
  profile,
}: {
  user: SessionUser;
  profile: ProfileData | null;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = useCallback(async () => {
    setRefreshing(true);
    const res = await fetchMyWallet();
    if (res.ok) setWallet(res.data);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  async function handleLogout() {
    await auth.logout();
    router.replace("/login");
  }

  return (
    <>
      {/* Mobile: dedicated homepage */}
      <div className="lg:hidden">
        <MobileProfileHome user={user} />
      </div>

      {/* Desktop: full user center with sidebar */}
      <div className="hidden lg:block">
        <UserCenterShell title={BN.userCenter.myAccount}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <UserInfoCard
              user={user}
              wallet={wallet}
              joinedOn={profile?.createdAt ?? null}
              onRefresh={loadWallet}
              refreshing={refreshing}
            />
            <SecurityScoreCard score={0} />
            <SecurityPanel
              hasEmail={Boolean(user.email)}
              onLogout={handleLogout}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <PrimaryButton
              href="/profile/deposit"
              icon="ArrowDownCircle"
              className="py-6 text-lg uppercase font-display"
            >
              {BN.wallet.depositFunds}
            </PrimaryButton>
            <PrimaryButton
              href="/profile/withdraw"
              icon="ArrowUpCircle"
              className="py-6 text-lg uppercase font-display"
            >
              {BN.wallet.withdrawFunds}
            </PrimaryButton>
          </div>
        </UserCenterShell>
      </div>
    </>
  );
}
