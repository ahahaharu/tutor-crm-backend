import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal Server Error';

    let code = 'UNKNOWN_ERROR';
    let field: string | undefined = undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;

        if ('message' in responseObj) {
          const msg = responseObj.message;
          if (typeof msg === 'string' || Array.isArray(msg)) {
            message = msg as string | string[];
          }
        }

        if ('code' in responseObj && typeof responseObj.code === 'string') {
          code = responseObj.code;
        } else if (Array.isArray(responseObj.message)) {
          code = 'VALIDATION_ERROR';
        }

        if ('field' in responseObj && typeof responseObj.field === 'string') {
          field = responseObj.field;
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[Unhandled Exception] ${exception.message}`,
        exception.stack,
      );
      code = 'INTERNAL_SERVER_ERROR';
    }

    if (status === (HttpStatus.TOO_MANY_REQUESTS as number)) {
      code = 'TOO_MANY_REQUESTS';
      message = 'Слишком много попыток. Пожалуйста, подождите минуту.';
    }

    const formattedMessage = Array.isArray(message) ? message : [message];

    const errorResponse = {
      statusCode: status,
      code,
      field,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: formattedMessage,
    };

    if (status !== (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.warn(
        `[${request.method}] ${request.url} - Status: ${status} - Code: ${code} - Message: ${JSON.stringify(formattedMessage)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
