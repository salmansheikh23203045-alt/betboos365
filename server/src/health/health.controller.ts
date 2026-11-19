import { Controller, Get, Headers } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../common/decorators';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check() {
    return this.healthService.check();
  }

  @Public()
  @Get('version')
  async getVersion(@Headers('x-deployment-secret') secretHeader?: string): Promise<{ status: string; buildId: string }> {
    return this.healthService.getVersion(secretHeader);
  }
}
