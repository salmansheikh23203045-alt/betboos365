import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Throttle key for auth and public form routes. Login attempts are counted
 * per target username so an account cannot be brute-forced from many IPs;
 * everything else is counted per client IP.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const username = req.body?.username;
    if (typeof username === 'string' && req.path?.endsWith('/login')) {
      return `login:${username.toLowerCase()}`;
    }
    return `ip:${req.ip ?? 'unknown'}`;
  }
}
