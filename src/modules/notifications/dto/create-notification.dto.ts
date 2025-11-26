import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationPriority, ChannelType } from '../interfaces/notification.interface';

/**
 * DTO for creating a notification (internal use)
 */
export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to notify' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: [
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
    ],
  })
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
  notificationType: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Action URL (link to relevant page)' })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Action button text' })
  @IsString()
  @IsOptional()
  actionText?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Priority level', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' })
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Channels to send notification through', type: [String], enum: ['in_app', 'email', 'sms', 'push'] })
  @IsArray()
  @IsEnum(['in_app', 'email', 'sms', 'push'], { each: true })
  @IsOptional()
  channels?: ChannelType[];

  @ApiPropertyOptional({ description: 'Related entity IDs' })
  @IsObject()
  @IsOptional()
  related?: {
    orderId?: string;
    listingId?: string;
    offerId?: string;
    reviewId?: string;
    chatId?: string;
    subscriptionId?: string;
  };

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
