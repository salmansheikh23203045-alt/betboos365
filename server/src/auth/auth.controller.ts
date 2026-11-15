import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto';
import { Public, CurrentUser, AllowPendingPasswordChange } from '../common/decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { UserThrottlerGuard } from '../common/guards/user-throttler.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.authService.register(dto, ip, ua);
  }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.authService.login(dto, ip, ua);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @AllowPendingPasswordChange()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') ua?: string,
  ) {
    await this.authService.changePassword(userId, dto, ip, ua);
    return { message: 'Password changed. Please sign in again.' };
  }

  // Public on purpose: holding the refresh token is the authority to revoke
  // it, and logout must still work after the access token has expired.
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out' };
  }
}
