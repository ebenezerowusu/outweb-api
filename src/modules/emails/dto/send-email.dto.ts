import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsEmail,
  IsObject,
  IsOptional,
  ValidateNested,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";
import { EmailTemplateType } from "../interfaces/email-template.interface";
import { EmailRecipientDto } from "./email-recipient.dto";

/**
 * Send Email DTO
 * For sending email to single or multiple recipients with same variables
 */
export class SendEmailDto {
  @ApiProperty({
    description: "Email template type",
    enum: EmailTemplateType,
    example: EmailTemplateType.VERIFY_EMAIL,
  })
  @IsEnum(EmailTemplateType)
  templateType: EmailTemplateType;

  @ApiProperty({
    description:
      "Single email recipient - use this OR recipients array, not both",
    type: EmailRecipientDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => EmailRecipientDto)
  @IsOptional()
  recipient?: EmailRecipientDto;

  @ApiProperty({
    description:
      "Multiple email recipients (same content) - use this OR recipient, not both",
    type: [EmailRecipientDto],
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsArray()
  @IsOptional()
  recipients?: EmailRecipientDto[];

  @ApiProperty({
    description: "Template variables (same for all recipients)",
    example: {
      firstName: "Jane",
      verifyUrl: "https://app.onlyusedtesla.com/verify?token=abc",
    },
  })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({
    description: "Reply-to email address",
    example: "support@onlyusedtesla.com",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  replyTo?: string;
}
