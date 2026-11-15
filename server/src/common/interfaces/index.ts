export enum Role {
  USER = 'user',
  VIP = 'vip',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  AGENT = 'agent',
  SUB_ADMIN = 'sub_admin',
}

/**
 * Fine-grained permissions. Roles decide which dashboard a person belongs to;
 * permissions decide what they may do inside it. Every protected staff endpoint
 * names the permission it needs via @RequirePermissions().
 */
export enum Permission {
  DASHBOARD_VIEW = 'dashboard.view',
  USERS_VIEW = 'users.view',
  USERS_MANAGE = 'users.manage',
  ADMINS_MANAGE = 'admins.manage',
  SUB_ADMINS_MANAGE = 'sub_admins.manage',
  AGENTS_MANAGE = 'agents.manage',
  DEPOSITS_VIEW = 'deposits.view',
  DEPOSITS_REVIEW = 'deposits.review',
  WITHDRAWALS_VIEW = 'withdrawals.view',
  WITHDRAWALS_REVIEW = 'withdrawals.review',
  WITHDRAWALS_ASSIGN = 'withdrawals.assign',
  WITHDRAWALS_COMPLETE = 'withdrawals.complete',
  TRANSACTIONS_VIEW = 'transactions.view',
  /** Manual credit/debit of a player's wallet. Admin and Super Admin only; never grantable to Sub Admins. */
  WALLET_ADJUST = 'wallet.adjust',
  AUDIT_VIEW = 'audit.view',
  CONTENT_MANAGE = 'content.manage',
  SETTINGS_MANAGE = 'settings.manage',
  AGENT_WITHDRAWALS_PROCESS = 'agent.withdrawals.process',
}

/** The authenticated principal attached to each request by JwtStrategy. */
export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  roles: Role[];
  permissions: Permission[];
  /** True while the account still holds a temporary password. */
  mustChangePassword: boolean;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email?: string | null;
  roles: Role[];
  /** Password change required. Lets the edge proxy route to the change form. */
  pwc?: boolean;
  iat?: number;
  exp?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  GAME_LAUNCH = 'GAME_LAUNCH',
  PROMOTION_CLAIM = 'PROMOTION_CLAIM',
  ADMIN_ACTION = 'ADMIN_ACTION',
  SUPPORT_TICKET = 'SUPPORT_TICKET',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING = 'waiting_on_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationType {
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  GAME = 'game',
  SUPPORT = 'support',
  ACCOUNT = 'account',
  SPORT = 'sport',
}
