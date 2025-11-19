import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Request Email Verification DTO
 */
export class RequestEmailVerificationDto {
  @ApiProperty({
    description: 'Email address to verify',
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * Confirm Email Verification DTO
 */
export class ConfirmEmailVerificationDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'email-verification-token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
