export enum Role {
  USER = 'user',
  VIP = 'vip',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface JwtPayload {
  sub: string;
  username: string;
  email?: string | null;
  roles: Role[];
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
