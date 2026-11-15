import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProd = nodeEnv === 'production';

  const apiPrefix = config.get<string>('apiPrefix') ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Behind Railway's load balancer we see X-Forwarded-* headers. Trust the
  // first proxy so `req.ip` and `req.protocol` reflect the real client.
  app.set('trust proxy', 1);

  app.use(helmet());

  const corsOrigins = config.get<string[]>('cors.origins') ?? ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Swagger is useful locally and in dev/staging but we don't want it on
  // the open internet by default. Gate it behind an explicit opt-in.
  const exposeSwagger = !isProd || process.env.ENABLE_SWAGGER === 'true';
  if (exposeSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TCL11 API')
      .setDescription('TCL11 Backend REST + WebSocket API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  const port = config.get<number>('port') ?? 3200;
  // Bind to 0.0.0.0 so the process answers on every interface. Railway (and
  // most container platforms) route traffic to the container's external IP,
  // which won't hit a socket bound only to 127.0.0.1.
  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on port ${port} (env=${nodeEnv})`);
  logger.log(`API prefix: /${apiPrefix}`);
  logger.log(`Healthcheck: /${apiPrefix}/health`);
  if (exposeSwagger) logger.log(`Swagger:    /${apiPrefix}/docs`);
}

bootstrap();
