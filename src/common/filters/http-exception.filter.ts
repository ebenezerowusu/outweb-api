import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { StandardError } from "../types/standard-error.type";

/**
 * Global HTTP Exception Filter
 * Formats all errors in RFC-7807 problem+json format
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    let status: number;
    let errorResponse: StandardError;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;

        errorResponse = {
          statusCode: status,
          error: this.getErrorName(status),
          message: responseObj.message || exception.message,
          details: responseObj.details || undefined,
        };
      } else {
        errorResponse = {
          statusCode: status,
          error: this.getErrorName(status),
          message: exceptionResponse as string,
        };
      }
    } else if (exception instanceof Error) {
      // Unknown/unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        error: "Internal Server Error",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : exception.message,
      };

      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        {
          url: request.url,
          method: request.method,
          body: request.body,
        },
      );
    } else {
      // Non-Error exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      };

      this.logger.error("Non-Error exception caught", exception);
    }

    response.status(status).send(errorResponse);
  }

  /**
   * Get standard error name from HTTP status code
   */
  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
    };

    return errorNames[status] || "Error";
  }
}
