import {
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { SmsTemplateType } from "../interfaces/sms-template.interface";
import { SmsRecipientDto } from "./sms-recipient.dto";

/**
 * Personalized SMS DTO
 * Each recipient gets their own unique variables
 */
export class PersonalizedSmsDto {
  @ApiProperty({
    description: "Recipient information",
    type: SmsRecipientDto,
  })
  @ValidateNested()
  @Type(() => SmsRecipientDto)
  recipient: SmsRecipientDto;

  @ApiProperty({
    description: "Unique variables for this specific recipient",
    example: { amount: "$48,000", year: 2016, make: "Tesla" },
  })
  @IsObject()
  variables: Record<string, any>;
}

/**
 * Send Batch SMS DTO
 * Sends personalized messages to multiple recipients (each with different variables)
 */
export class SendBatchSmsDto {
  @ApiProperty({
    description: "SMS template type to use for all messages",
    enum: SmsTemplateType,
    example: SmsTemplateType.OFFER_NEW,
  })
  @IsEnum(SmsTemplateType)
  templateType: SmsTemplateType;

  @ApiProperty({
    description: "Array of recipients with their personalized variables",
    type: [PersonalizedSmsDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PersonalizedSmsDto)
  messages: PersonalizedSmsDto[];
}
