import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, TransactionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { Permission, Role } from '../../common/interfaces';
import { parseRoles } from '../../common/utils/roles';
import { SUB_ADMIN_DEFAULT, subAdminPermissions } from '../../common/permissions';
import { CreateStaffDto, UpdateStaffDto } from './dto';
import { bdPhoneVariants, normalizeBdPhone } from '../../common/utils/phone';

export type StaffKind = Role.AGENT | Role.SUB_ADMIN;

const LABEL: Record<StaffKind, string> = {
  [Role.AGENT]: 'Agent',
  [Role.SUB_ADMIN]: 'Sub Admin',
};

type StaffRow = {
  id: string;
  username: string;
  firstName: string;
  email: string | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  isActive: boolean;
  roles: unknown;
  permissions: unknown;
  createdAt: Date;
};

const STAFF_SELECT = {
  id: true,
  username: true,
  firstName: true,
  email: true,
  phone: true,
  phoneVerifiedAt: true,
  isActive: true,
  roles: true,
  permissions: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * Staff accounts managed from the Admin Dashboard: Agents and Sub Admins.
 * Both are ordinary rows in `users` that hold exactly one role, so they sign
 * in through the normal login and get the normal JWT/refresh-token session.
 * Every write here is audited against the acting admin.
 */
@Injectable()
export class StaffManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private view(u: StaffRow, kind: StaffKind) {
    return {
      id: u.id,
      username: u.username,
      name: u.firstName,
      email: u.email,
      phone: u.phone,
      phoneVerified: Boolean(u.phoneVerifiedAt),
      isActive: u.isActive,
      role: kind,
      createdAt: u.createdAt.toISOString(),
      ...(kind === Role.SUB_ADMIN ? { permissions: subAdminPermissions(u.permissions) } : {}),
    };
  }

  /** Roles live in a JSON column, so membership is filtered in code. Staff lists are small. */
  private async allOfKind(kind: StaffKind): Promise<StaffRow[]> {
    const rows = await this.prisma.user.findMany({
      select: STAFF_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.filter((u) => (parseRoles(u.roles) as string[]).includes(kind));
  }

  /**
   * Loads the target and proves it is a staff account of this kind and nothing
   * more. An account that also holds admin or super_admin is never manageable
   * here, so these endpoints cannot be used to edit, lock out or take over an
   * Admin by attaching a staff role to it.
   */
  private async target(id: string, kind: StaffKind, actorId: string): Promise<StaffRow> {
    if (id === actorId) throw new ForbiddenException('You cannot manage your own account here.');
    const user = await this.prisma.user.findUnique({ where: { id }, select: STAFF_SELECT });
    const roles = user ? (parseRoles(user.roles) as string[]) : [];
    if (!user || !roles.includes(kind)) throw new NotFoundException(`${LABEL[kind]} not found.`);
    if (roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN)) {
      throw new ForbiddenException('This account holds an admin role and cannot be managed here.');
    }
    return user;
  }

  /**
   * Staff phone numbers are stored canonically (+8801XXXXXXXXX) and must be
   * unique across all accounts: an agent's number is where the agent's own
   * withdrawals are paid, exactly as for players.
   */
  private async canonicalPhone(raw: string, exceptId?: string): Promise<string> {
    const phone = normalizeBdPhone(raw);
    if (!phone) throw new BadRequestException('Enter a valid Bangladeshi mobile number (01XXXXXXXXX).');
    const clash = await this.prisma.user.findFirst({
      where: { phone: { in: bdPhoneVariants(phone) }, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (clash) throw new ConflictException('This phone number is already registered to another account.');
    return phone;
  }

  private log(actorId: string, action: string, targetUserId: string, extra: Record<string, unknown> = {}) {
    return this.audit.log(AuditAction.ADMIN_ACTION, actorId, { action, targetUserId, ...extra });
  }

  async list(kind: StaffKind) {
    const staff = await this.allOfKind(kind);
    const ids = staff.map((s) => s.id);
    const counts = new Map<string, Record<string, number>>();
    const bump = (id: string | null, key: string, n: number) => {
      if (!id) return;
      counts.set(id, { ...(counts.get(id) ?? {}), [key]: n });
    };

    if (ids.length && kind === Role.AGENT) {
      const [open, done] = await Promise.all([
        this.prisma.withdrawalRequest.groupBy({
          by: ['assignedAgentId'],
          where: { assignedAgentId: { in: ids }, status: TransactionStatus.APPROVED },
          _count: { _all: true },
        }),
        this.prisma.withdrawalRequest.groupBy({
          by: ['completedById'],
          where: { completedById: { in: ids }, status: TransactionStatus.COMPLETED },
          _count: { _all: true },
        }),
      ]);
      open.forEach((r) => bump(r.assignedAgentId, 'awaitingPayout', r._count._all));
      done.forEach((r) => bump(r.completedById, 'completed', r._count._all));
    }
    if (ids.length && kind === Role.SUB_ADMIN) {
      const [deps, wds] = await Promise.all([
        this.prisma.depositRequest.groupBy({
          by: ['processedById'],
          where: { processedById: { in: ids } },
          _count: { _all: true },
        }),
        this.prisma.withdrawalRequest.groupBy({
          by: ['processedById'],
          where: { processedById: { in: ids } },
          _count: { _all: true },
        }),
      ]);
      deps.forEach((r) => bump(r.processedById, 'depositsProcessed', r._count._all));
      wds.forEach((r) => bump(r.processedById, 'withdrawalsProcessed', r._count._all));
    }

    return {
      data: staff.map((s) => ({ ...this.view(s, kind), stats: counts.get(s.id) ?? {} })),
      meta: {
        total: staff.length,
        active: staff.filter((s) => s.isActive).length,
        inactive: staff.filter((s) => !s.isActive).length,
      },
    };
  }

  async create(
    actorId: string,
    kind: StaffKind,
    dto: CreateStaffDto & { permissions?: Permission[] },
  ) {
    const username = dto.username.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { username }, select: { id: true } })) {
      throw new ConflictException('This username is already taken.');
    }
    const email = dto.email ? dto.email.toLowerCase() : null;
    if (email && (await this.prisma.user.findUnique({ where: { email }, select: { id: true } }))) {
      throw new ConflictException('This email is already registered.');
    }

    const phone = dto.phone ? await this.canonicalPhone(dto.phone) : null;
    const passwordHash = await bcrypt.hash(dto.password, await bcrypt.genSalt(12));
    const permissions =
      kind === Role.SUB_ADMIN ? (dto.permissions ?? SUB_ADMIN_DEFAULT) : undefined;

    let user: StaffRow;
    try {
      user = await this.prisma.user.create({
        data: {
          username,
          firstName: dto.name?.trim() || username,
          lastName: LABEL[kind],
          email,
          phone,
          passwordHash,
          // The admin chose this password, so it is temporary: the new staff
          // member must replace it at first sign-in.
          mustChangePassword: true,
          // Exactly one role. Staff accounts are not players.
          roles: [kind] as unknown as Prisma.InputJsonValue,
          ...(permissions ? { permissions: permissions as unknown as Prisma.InputJsonValue } : {}),
        },
        select: STAFF_SELECT,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('This username or email is already registered.');
      }
      throw err;
    }

    await this.log(actorId, `${kind}_created`, user.id, {
      username,
      ...(permissions ? { permissions } : {}),
    });
    return this.view(user, kind);
  }

  async update(actorId: string, kind: StaffKind, id: string, dto: UpdateStaffDto) {
    const current = await this.target(id, kind, actorId);
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.firstName = dto.name.trim();
    if (dto.phone !== undefined) {
      const phone = await this.canonicalPhone(dto.phone, id);
      if (phone !== normalizeBdPhone(current.phone)) {
        data.phone = phone;
        // A new number has not been confirmed by anyone: payouts stop until it is.
        data.phoneVerifiedAt = null;
      }
    }
    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase();
      const clash = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (clash && clash.id !== id) throw new ConflictException('This email is already registered.');
      data.email = email;
    }
    if (Object.keys(data).length === 0) throw new BadRequestException('Nothing to update.');

    const updated = await this.prisma.user.update({ where: { id }, data, select: STAFF_SELECT });
    await this.log(actorId, `${kind}_updated`, id, { fields: Object.keys(data) });
    return this.view(updated, kind);
  }

  /** Deactivating also ends every open session; the JWT check refuses the account at once. */
  async setStatus(actorId: string, kind: StaffKind, id: string, isActive: boolean) {
    await this.target(id, kind, actorId);
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isActive }, select: STAFF_SELECT }),
      ...(isActive
        ? []
        : [
            this.prisma.refreshToken.updateMany({
              where: { userId: id },
              data: { revokedAt: new Date(Date.now() - 60_000) },
            }),
          ]),
    ]);
    await this.log(actorId, isActive ? `${kind}_activated` : `${kind}_deactivated`, id);
    return this.view(updated as StaffRow, kind);
  }

  /** New password is hashed with bcrypt; all of the account's sessions are ended. */
  async resetPassword(actorId: string, kind: StaffKind, id: string, password: string) {
    await this.target(id, kind, actorId);
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { passwordHash, mustChangePassword: true } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date(Date.now() - 60_000) },
      }),
    ]);
    await this.log(actorId, `${kind}_password_reset`, id);
    return { id, passwordReset: true };
  }

  async setSubAdminPermissions(actorId: string, id: string, permissions: Permission[]) {
    const before = await this.target(id, Role.SUB_ADMIN, actorId);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { permissions: permissions as unknown as Prisma.InputJsonValue },
      select: STAFF_SELECT,
    });
    await this.log(actorId, 'sub_admin_permissions_updated', id, {
      before: subAdminPermissions(before.permissions),
      after: permissions,
    });
    return this.view(updated, Role.SUB_ADMIN);
  }

  /** What this staff member did: their audit trail, newest first. */
  async activity(actorId: string, kind: StaffKind, id: string) {
    await this.target(id, kind, actorId);
    return this.audit.recentForUser(id, 100);
  }
}
