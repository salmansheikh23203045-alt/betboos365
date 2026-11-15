import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'UnknownError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) ?? message;
        error = (resp.error as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      // Unhandled errors (Prisma, runtime) carry file paths and database names:
      // log them, never send them to the client.
      this.logger.error(`${exception.name}: ${exception.message}`, exception.stack);
      response.status(status).json({
        success: false,
        error: 'InternalServerError',
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (status >= 500) {
      this.logger.error(`${status} ${error}: ${message}`, (exception as Error)?.stack);
    } else {
      this.logger.warn(`${status} ${error}: ${message}`);
    }

    response.status(status).json({
      success: false,
      error,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
