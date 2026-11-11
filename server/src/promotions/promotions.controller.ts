import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto';
import { Public, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/interfaces';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Public()
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    // Admins hitting /promotions?includeInactive=true see drafts too. The
    // query flag is not a security gate (data is public), just a filter.
    return this.promotionsService.findAll(includeInactive !== 'true');
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
