import type { Metadata } from "next";
import { cookies } from "next/headers";
import { readAccessToken } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { NeonCard } from "@/components/ui/NeonCard";
import { UserManagementClient } from "./UserManagementClient";

export const metadata: Metadata = { title: "User Management | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

export interface AdminUserRow {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

async function fetchUsers(accessToken: string, page: number, limit: number) {
  const res = await backendFetch(`/users?page=${page}&limit=${limit}`, { accessToken });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    data?: { data?: AdminUserRow[]; meta?: { page: number; limit: number; total: number; totalPages: number } };
  };
  return body.data ?? null;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const session = (await getSession())!;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(10, parseInt(sp.limit ?? "25", 10) || 25));

  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  const result = at ? await fetchUsers(at, page, limit) : null;

  if (!result) {
    return (
      <NeonCard className="p-6 text-center text-tcl-red-bright">
        Could not load users from the backend.
      </NeonCard>
    );
  }

  return (
    <UserManagementClient
      rows={result.data ?? []}
      meta={result.meta ?? { page, limit, total: 0, totalPages: 0 }}
      currentUserId={session.id}
      isSuperAdmin={session.roles.includes("super_admin")}
      canViewWallet={(session.permissions ?? []).includes("transactions.view")}
      canAdjustWallet={(session.permissions ?? []).includes("wallet.adjust")}
    />
  );
}
