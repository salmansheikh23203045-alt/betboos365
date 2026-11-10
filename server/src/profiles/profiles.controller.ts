import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string) {
    const profile = await this.profilesService.findByUserId(userId);
    return this.profilesService.toResponseDto(profile);
  }

  @Patch('me')
  async updateMyProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    const profile = await this.profilesService.update(userId, dto);
    return this.profilesService.toResponseDto(profile);
  }
}
