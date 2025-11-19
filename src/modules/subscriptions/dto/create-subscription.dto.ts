import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';

/**
 * Create Checkout Session DTO
 * Used for POST /subscriptions/checkout
 */
export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Subscription tier',
    enum: ['basic', 'pro', 'enterprise'],
    example: 'pro',
  })
  @IsEnum(['basic', 'pro', 'enterprise'])
  tier: 'basic' | 'pro' | 'enterprise';

  @ApiProperty({
    description: 'Billing interval',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsEnum(['monthly', 'yearly'])
  interval: 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Seller ID to associate with subscription',
    required: false,
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({
    description: 'Success redirect URL',
    example: 'https://onlyusedtesla.com/dashboard?session_id={CHECKOUT_SESSION_ID}',
  })
  @IsUrl()
  successUrl: string;

  @ApiProperty({
    description: 'Cancel redirect URL',
    example: 'https://onlyusedtesla.com/pricing',
  })
  @IsUrl()
  cancelUrl: string;
}

/**
 * Create Subscription DTO (from webhook)
 * Internal use only for processing Stripe webhooks
 */
export class CreateSubscriptionFromWebhookDto {
  userId: string;
  sellerId: string | null;
  tier: 'basic' | 'pro' | 'enterprise';
  interval: 'monthly' | 'yearly';
  productId: string;
  priceId: string;
  amount: number;
  currency: string;
  customerId: string;
  subscriptionId: string;
  checkoutSessionId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status: string;
}
