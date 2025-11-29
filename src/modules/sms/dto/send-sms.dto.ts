import {
  IsEnum,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SmsTemplateType } from "../interfaces/sms-template.interface";
import { SmsRecipientDto } from "./sms-recipient.dto";

/**
 * Send SMS DTO
 * Supports both single recipient and broadcast (same message to multiple recipients)
 */
export class SendSmsDto {
  @ApiProperty({
    description: "SMS template type to use",
    enum: SmsTemplateType,
    example: SmsTemplateType.MFA_CODE,
  })
  @IsEnum(SmsTemplateType)
  templateType: SmsTemplateType;

  @ApiPropertyOptional({
    description: "Single recipient (use this OR recipients, not both)",
    type: SmsRecipientDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmsRecipientDto)
  recipient?: SmsRecipientDto;

  @ApiPropertyOptional({
    description:
      "Multiple recipients for broadcast (use this OR recipient, not both)",
    type: [SmsRecipientDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SmsRecipientDto)
  recipients?: SmsRecipientDto[];

  @ApiProperty({
    description:
      "Variables for template interpolation (same for all recipients in broadcast mode)",
    example: { code: "123456", expiresMinutes: 10 },
  })
  @IsObject()
  variables: Record<string, any>;
}
