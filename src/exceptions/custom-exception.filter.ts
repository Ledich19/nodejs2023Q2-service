import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MyLogger } from 'src/logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: MyLogger) {}

  private getControllerName(context: ExecutionContext): string {
    const controller = context.getClass();
    return controller.name;
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error custom';

    if (exception instanceof HttpException) {
      this.logger.logResponse(`${exception.getStatus()}  ${exception.message}`);
      status = exception.getStatus();
      message = exception.message || message;
    } else {
      this.logger.error(exception, '');
    }
    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}
