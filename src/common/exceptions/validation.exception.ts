import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Validation Exception
 * For 422 Unprocessable Entity with field-level validation errors
 */
export class ValidationException extends HttpException {
  constructor(details: Record<string, string[]>, message = 'Validation failed') {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Unprocessable Entity',
        message,
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
