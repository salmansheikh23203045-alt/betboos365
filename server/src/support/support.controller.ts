import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto, AddMessageDto, ContactFormDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public, Roles, CurrentUser } from '../common/decorators';
import { Role } from '../common/interfaces';
import { TicketStatus } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Public()
  @Post('contact')
  submitContactForm(@Body() dto: ContactFormDto) {
    return this.supportService.submitContactForm(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tickets')
  createTicket(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tickets/mine')
  getMyTickets(@CurrentUser('id') userId: string) {
    return this.supportService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tickets/:id')
  getTicket(@Param('id') id: string) {
    return this.supportService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tickets/:id/messages')
  addMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(ticketId, userId, 'user', dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Get('tickets')
  getAllTickets(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.supportService.findAll(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Patch('tickets/:id/status')
  updateTicketStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.supportService.updateStatus(id, status);
  }
}
