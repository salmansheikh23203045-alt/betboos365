import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, AddMessageDto, ContactFormDto } from './dto';
import { TicketStatus as PrismaTicketStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export type TicketMessageType = {
  id: string;
  senderId: string;
  senderRole: string;
  message: string;
  createdAt: Date;
};

export type TicketEntity = {
  id: string;
  userId: string;
  subject: string;
  priority: string;
  status: string;
  messages: TicketMessageType[];
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTicket(userId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        priority: dto.priority as any,
        messages: {
          create: {
            senderId: userId,
            senderRole: 'user',
            message: dto.message,
          },
        },
      },
      include: { messages: true },
    });
    this.logger.log(`Ticket created: ${ticket.id} by user ${userId}`);
    return ticket;
  }

  async addMessage(ticketId: string, senderId: string, senderRole: 'user' | 'agent', dto: AddMessageDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        senderRole,
        message: dto.message,
      },
    });

    const updateData: Record<string, unknown> = {};
    if (senderRole === 'agent' && ticket.status === 'open') {
      updateData.status = 'in_progress' as PrismaTicketStatus;
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return updated;
  }

  async findByUser(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: { messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.supportTicket.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateStatus(ticketId: string, status: PrismaTicketStatus) {
    const ticket = await this.findById(ticketId);
    return this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async submitContactForm(dto: ContactFormDto) {
    const referenceId = uuidv4();
    await this.prisma.contactSubmission.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        referenceId,
      },
    });
    this.logger.log(`Contact form submitted by ${dto.name} (${dto.email}): ${dto.subject}`);
    return { message: 'Your message has been received. We will respond within 24 hours.', referenceId };
  }
}
