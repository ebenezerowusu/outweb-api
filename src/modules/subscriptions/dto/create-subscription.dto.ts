import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';

/**
 * Create Checkout Session DTO
 * Used for POST /subscriptions/checkout
 */
export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Subscription plan category',
    enum: ['cashoffer', 'dealer_wholesale', 'dealer_advertising'],
    example: 'cashoffer',
  })
  @IsEnum(['cashoffer', 'dealer_wholesale', 'dealer_advertising'])
  category: 'cashoffer' | 'dealer_wholesale' | 'dealer_advertising';

  @ApiProperty({
    description: 'Billing interval (currently only monthly is supported)',
    enum: ['monthly'],
    example: 'monthly',
    default: 'monthly',
  })
  @IsEnum(['monthly'])
  interval: 'monthly';

  @ApiProperty({
    description: 'Seller ID to associate with subscription',
    required: false,
    example: 'seller_123abc',
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({
    description: 'Success redirect URL after checkout',
    example: 'https://onlyusedtesla.com/dashboard?session_id={CHECKOUT_SESSION_ID}',
  })
  @IsUrl()
  successUrl: string;

  @ApiProperty({
    description: 'Cancel redirect URL if checkout is cancelled',
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
  category: 'cashoffer' | 'dealer_wholesale' | 'dealer_advertising';
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
