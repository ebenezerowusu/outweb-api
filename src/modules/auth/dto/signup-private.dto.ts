import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsOptional,
  Matches,
} from "class-validator";

/**
 * Sign Up Private User Request DTO
 */
export class SignUpPrivateDto {
  @ApiProperty({
    description: "First name",
    example: "Akua",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Last name",
    example: "Mensah",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "Email address",
    example: "akua.mensah@gmail.com",
  })
  @IsEmail({}, { message: "Invalid email format" })
  @MaxLength(254)
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "Phone number (E.164 or international format)",
    example: "+233244123456",
  })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: "ZIP/Postal code",
    example: "00233",
    required: false,
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    description: "Password (min 8 chars, recommended: letters + numbers)",
    example: "StrongPassword123!",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "Password confirmation (must match password)",
    example: "StrongPassword123!",
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({
    description: "Must accept terms of service",
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  acceptTermsOfService: boolean;
}
