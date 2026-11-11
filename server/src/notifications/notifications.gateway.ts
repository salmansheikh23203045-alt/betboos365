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
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, { userId?: string; joinedAt: Date }>();

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, { joinedAt: new Date() });
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    const info = this.connectedClients.get(client.id);
    if (info) {
      info.userId = data.userId;
      client.join(`user:${data.userId}`);
      this.logger.log(`Client ${client.id} authenticated as user ${data.userId}`);
    }
    return { event: 'authenticated', data: { success: true } };
  }

  @SubscribeMessage('subscribe:sports')
  handleSubscribeSports(@ConnectedSocket() client: Socket, @MessageBody() data: { eventIds: string[] }) {
    for (const id of data.eventIds) {
      client.join(`sport:${id}`);
    }
    return { event: 'subscribed', data: { channel: 'sports', eventIds: data.eventIds } };
  }

  @SubscribeMessage('unsubscribe:sports')
  handleUnsubscribeSports(@ConnectedSocket() client: Socket, @MessageBody() data: { eventIds: string[] }) {
    for (const id of data.eventIds) {
      client.leave(`sport:${id}`);
    }
    return { event: 'unsubscribed', data: { channel: 'sports', eventIds: data.eventIds } };
  }

  // On Vercel (serverless) no WebSocket server is bound; broadcasts become
  // no-ops rather than crashing the request. REST notification writes still
  // land in the DB; clients see them on next `/notifications` fetch.
  sendToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
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
}
