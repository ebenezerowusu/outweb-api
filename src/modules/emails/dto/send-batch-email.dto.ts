import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsEmail,
  IsObject,
  IsOptional,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { EmailTemplateType } from "../interfaces/email-template.interface";
import { EmailRecipientDto } from "./email-recipient.dto";

/**
 * Personalized Email DTO
 * Single email with recipient and personalized variables
 */
export class PersonalizedEmailDto {
  @ApiProperty({
    description: "Email recipient",
    type: EmailRecipientDto,
  })
  @ValidateNested()
  @Type(() => EmailRecipientDto)
  recipient: EmailRecipientDto;

  @ApiProperty({
    description: "Template variables for this specific recipient",
    example: {
      firstName: "Jane",
      verifyUrl: "https://app.onlyusedtesla.com/verify?token=abc123",
    },
  })
  @IsObject()
  variables: Record<string, any>;
}

/**
 * Send Batch Email DTO
 * For sending personalized emails to multiple recipients
 */
export class SendBatchEmailDto {
  @ApiProperty({
    description: "Email template type (same for all recipients)",
    enum: EmailTemplateType,
    example: EmailTemplateType.VERIFY_EMAIL,
  })
  @IsEnum(EmailTemplateType)
  templateType: EmailTemplateType;

  @ApiProperty({
    description: "Array of personalized emails",
    type: [PersonalizedEmailDto],
    example: [
      {
        recipient: { email: "jane@example.com", name: "Jane Doe" },
        variables: {
          firstName: "Jane",
          verifyUrl: "https://.../verify?token=abc123",
        },
      },
      {
        recipient: { email: "john@example.com", name: "John Smith" },
        variables: {
          firstName: "John",
          verifyUrl: "https://.../verify?token=def456",
        },
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => PersonalizedEmailDto)
  @IsArray()
  @ArrayMinSize(1)
  emails: PersonalizedEmailDto[];

  @ApiProperty({
    description: "Reply-to email address (applies to all)",
    example: "support@onlyusedtesla.com",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  replyTo?: string;
}
