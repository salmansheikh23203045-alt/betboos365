import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, Role } from '../common/interfaces';
import { parseRoles } from '../common/utils/roles';

const STAFF_ROOM = 'staff';
const MAX_SPORT_SUBSCRIPTIONS = 50;

// Read lazily: this runs per handshake, after ConfigModule has loaded .env.
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // non-browser clients send no Origin header
  const allowed = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  return allowed.includes(origin);
}

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) =>
      cb(null, isAllowedOrigin(origin)),
    credentials: true,
  },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, { userId?: string; joinedAt: Date }>();

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Anonymous sockets are allowed (public sports rooms only). A socket that
   * presents a token must present a valid one, and only then joins its
   * private `user:<id>` room.
   */
  async handleConnection(client: Socket) {
    this.connectedClients.set(client.id, { joinedAt: new Date() });
    const token = this.extractToken(client);
    if (token) {
      const ok = await this.bindUser(client, token);
      if (!ok) {
        client.emit('auth_error', { message: 'Invalid or expired token' });
        client.disconnect(true);
        return;
      }
    }
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token?: unknown },
  ) {
    const token = typeof data?.token === 'string' ? data.token : null;
    const ok = token ? await this.bindUser(client, token) : false;
    return { event: 'authenticated', data: { success: ok } };
  }

  @SubscribeMessage('subscribe:sports')
  handleSubscribeSports(@ConnectedSocket() client: Socket, @MessageBody() data: { eventIds?: unknown }) {
    const eventIds = this.cleanEventIds(data?.eventIds);
    for (const id of eventIds) {
      client.join(`sport:${id}`);
    }
    return { event: 'subscribed', data: { channel: 'sports', eventIds } };
  }

  @SubscribeMessage('unsubscribe:sports')
  handleUnsubscribeSports(@ConnectedSocket() client: Socket, @MessageBody() data: { eventIds?: unknown }) {
    const eventIds = this.cleanEventIds(data?.eventIds);
    for (const id of eventIds) {
      client.leave(`sport:${id}`);
    }
    return { event: 'unsubscribed', data: { channel: 'sports', eventIds } };
  }

  // On Vercel (serverless) no WebSocket server is bound; broadcasts become
  // no-ops rather than crashing the request. REST notification writes still
  // land in the DB; clients see them on next `/notifications` fetch.
  sendToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /** Live event for every connected admin / super admin. */
  sendToStaff(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(STAFF_ROOM).emit(event, payload);
  }

  sendToAll(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.emit(event, payload);
  }

  sendSportUpdate(eventId: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`sport:${eventId}`).emit('sport:update', payload);
  }

  getConnectedCount() {
    return this.connectedClients.size;
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth) return fromAuth;
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
    return null;
  }

  private async bindUser(client: Socket, token: string): Promise<boolean> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, roles: true, isActive: true },
      });
      if (!user || !user.isActive) return false;

      const info = this.connectedClients.get(client.id);
      if (info) info.userId = user.id;
      client.join(`user:${user.id}`);
      const roles = parseRoles(user.roles) as Role[];
      if (roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN)) {
        client.join(STAFF_ROOM);
      }
      return true;
    } catch {
      return false;
    }
  }

  private cleanEventIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64)
      .slice(0, MAX_SPORT_SUBSCRIPTIONS);
  }
}
