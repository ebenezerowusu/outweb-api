import {
  IsBoolean,
  IsOptional,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for marking notification as read
 */
export class MarkNotificationReadDto {
  @ApiPropertyOptional({
    description: "Mark as read (true) or unread (false)",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}

/**
 * DTO for archiving notification
 */
export class ArchiveNotificationDto {
  @ApiPropertyOptional({
    description: "Archive (true) or unarchive (false)",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}

/**
 * DTO for global notification channel preferences
 */
export class GlobalPreferencesDto {
  @ApiPropertyOptional({
    description: "Enable in-app notifications",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  inApp?: boolean;

  @ApiPropertyOptional({
    description: "Enable email notifications",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @ApiPropertyOptional({
    description: "Enable SMS notifications",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @ApiPropertyOptional({
    description: "Enable push notifications",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  push?: boolean;
}

/**
 * DTO for category-specific notification preferences
 */
export class CategoryPreferencesDto {
  @ApiPropertyOptional({
    description: "Enable in-app notifications for this category",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  inApp?: boolean;

  @ApiPropertyOptional({
    description: "Enable email notifications for this category",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @ApiPropertyOptional({
    description: "Enable SMS notifications for this category",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @ApiPropertyOptional({
    description: "Enable push notifications for this category",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  push?: boolean;
}

/**
 * DTO for updating notification preferences
 */
export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: "Global channel preferences" })
  @IsObject()
  @ValidateNested()
  @Type(() => GlobalPreferencesDto)
  @IsOptional()
  global?: GlobalPreferencesDto;

  @ApiPropertyOptional({ description: "Order notification preferences" })
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryPreferencesDto)
  @IsOptional()
  orders?: CategoryPreferencesDto;

  @ApiPropertyOptional({ description: "Listing notification preferences" })
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryPreferencesDto)
  @IsOptional()
  listings?: CategoryPreferencesDto;

  @ApiPropertyOptional({ description: "Subscription notification preferences" })
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryPreferencesDto)
  @IsOptional()
  subscriptions?: CategoryPreferencesDto;

  @ApiPropertyOptional({ description: "Review notification preferences" })
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryPreferencesDto)
  @IsOptional()
  reviews?: CategoryPreferencesDto;

  @ApiPropertyOptional({ description: "Chat notification preferences" })
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryPreferencesDto)
  @IsOptional()
  chats?: CategoryPreferencesDto;

  @ApiPropertyOptional({ description: "System notification preferences" })
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryPreferencesDto)
  @IsOptional()
  system?: CategoryPreferencesDto;
}
