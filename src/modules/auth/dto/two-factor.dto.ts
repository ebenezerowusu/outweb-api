import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum TwoFactorMethod {
  SMS = "sms",
  AUTHENTICATOR_APP = "authenticatorApp",
}

/**
 * Setup 2FA DTO
 */
export class Setup2FaDto {
  @ApiProperty({
    description: "Two-factor authentication method",
    enum: TwoFactorMethod,
    example: TwoFactorMethod.SMS,
  })
  @IsEnum(TwoFactorMethod, {
    message: 'Method must be either "sms" or "authenticatorApp"',
  })
  @IsNotEmpty()
  method: TwoFactorMethod;
}

/**
 * Disable 2FA DTO
 */
export class Disable2FaDto {
  @ApiProperty({
    description: "Two-factor authentication method to disable",
    enum: TwoFactorMethod,
    example: TwoFactorMethod.SMS,
    required: false,
  })
  @IsEnum(TwoFactorMethod)
  @IsOptional()
  method?: TwoFactorMethod;
}
