import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationPriority } from '../interfaces/notification.interface';

/**
 * DTO for querying notifications
 */
export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Filter by notification type' })
  @IsEnum([
    'order_created',
    'order_status_changed',
    'payment_received',
    'payment_failed',
    'inspection_scheduled',
    'inspection_completed',
    'delivery_scheduled',
    'order_delivered',
    'order_completed',
    'order_canceled',
    'listing_approved',
    'listing_rejected',
    'listing_expired',
    'listing_sold',
    'new_offer_received',
    'offer_accepted',
    'offer_rejected',
    'offer_countered',
    'subscription_created',
    'subscription_renewed',
    'subscription_canceled',
    'subscription_expiring',
    'payment_method_expiring',
    'invoice_paid',
    'invoice_failed',
    'new_review_received',
    'review_response_posted',
    'new_message_received',
    'offer_chat_started',
    'account_verified',
    'password_changed',
    'security_alert',
    'system_announcement',
  ])
  @IsOptional()
  notificationType?: NotificationType;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: ['low', 'normal', 'high', 'urgent'] })
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Filter by read status (true = read, false = unread)' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @ApiPropertyOptional({ description: 'Filter by archived status (true = archived, false = active)' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @ApiPropertyOptional({ description: 'Filter by related order ID' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Filter by related listing ID' })
  @IsString()
  @IsOptional()
  listingId?: string;

  @ApiPropertyOptional({ description: 'Filter by related offer ID' })
  @IsString()
  @IsOptional()
  offerId?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'priority'], default: 'createdAt' })
  @IsEnum(['createdAt', 'priority'])
  @IsOptional()
  sortBy?: 'createdAt' | 'priority';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Continuation token for pagination' })
  @IsString()
  @IsOptional()
  continuationToken?: string;
}
