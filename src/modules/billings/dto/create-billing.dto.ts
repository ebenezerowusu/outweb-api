import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsUrl,
  IsNotEmpty,
  MaxLength,
} from "class-validator";

/**
 * Create Billing Checkout DTO
 * Used internally by subscriptions module when creating one-time checkouts
 */
export class CreateBillingDto {
  @ApiProperty({
    description: "Product type for one-time payment",
    enum: ["featured_listing", "bump_listing", "highlight_listing"],
    example: "featured_listing",
  })
  @IsEnum(["featured_listing", "bump_listing", "highlight_listing"])
  @IsNotEmpty()
  productType: "featured_listing" | "bump_listing" | "highlight_listing";

  @ApiProperty({
    description: "Listing ID to apply the payment to",
    example: "listing_123abc",
  })
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty({
    description: "Seller ID associated with the listing",
    example: "seller_123abc",
  })
  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({
    description: "User ID from Auth0",
    example: "auth0|611e333b9892e30069276fc3",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "Stripe checkout session ID",
    example: "cs_test_a16zwLyhe2x...",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  stripeSessionId: string;

  @ApiProperty({
    description: "Stripe price ID",
    example: "price_featured_listing_001",
  })
  @IsString()
  @IsNotEmpty()
  stripePriceId: string;

  @ApiProperty({
    description: "Amount in minor units (e.g., 1000 = $10.00)",
    example: 1000,
  })
  amount: number;

  @ApiProperty({
    description: "Currency code (ISO 4217)",
    example: "USD",
  })
  @IsString()
  @MaxLength(3)
  currency: string;

  @ApiProperty({
    description: "Success redirect URL (already resolved)",
    example: "https://onlyusedtesla.com/listings/listing_123abc?payment=success",
  })
  @IsUrl()
  @IsNotEmpty()
  returnUrl: string;

  @ApiProperty({
    description: "Cancel redirect URL",
    example: "https://onlyusedtesla.com/listings/listing_123abc",
  })
  @IsUrl()
  @IsNotEmpty()
  cancelUrl: string;
}
