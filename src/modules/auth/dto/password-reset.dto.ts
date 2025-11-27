import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * Forgot Password Request DTO
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: "Email address",
    example: "akua.mensah@gmail.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * Reset Password DTO
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: "Password reset token from email",
    example: "password-reset-token",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: "New password",
    example: "NewStrongPassword123!",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({
    description: "Confirm new password",
    example: "NewStrongPassword123!",
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
