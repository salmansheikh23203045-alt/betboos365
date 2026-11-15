import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Throttle signed-in actions per account rather than per IP. Many players in
 * Bangladesh share one public IP behind carrier NAT, so an IP key would let
 * one busy network lock everyone else out. Runs after the global JWT guard,
 * so req.user is set; falls back to the IP if it somehow is not.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const id = req.user?.id;
    return typeof id === 'string' ? `user:${id}` : `ip:${req.ip ?? 'unknown'}`;
  }
}
