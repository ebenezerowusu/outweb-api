import { IsString, IsOptional, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * SMS Recipient DTO
 * Represents a single SMS recipient with phone number validation
 */
export class SmsRecipientDto {
  @ApiProperty({
    description: "Recipient phone number in E.164 format",
    example: "+14155551234",
  })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      "Phone number must be in E.164 format (e.g., +14155551234). Must start with + followed by country code and number.",
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: "Optional recipient name",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  name?: string;
}
