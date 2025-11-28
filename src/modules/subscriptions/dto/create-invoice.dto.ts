import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { InvoiceStatus } from "../interfaces/subscription-invoice.interface";

class AmountDetailsDto {
  @ApiProperty({
    description: "Currency code",
    example: "USD",
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: "Total amount charged",
    example: 49,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: "Tax amount",
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  tax: number;

  @ApiProperty({
    description: "Net amount (total - tax)",
    example: 44,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  net: number;
}

class BillingPeriodDto {
  @ApiProperty({
    description: "Billing period start date (ISO 8601)",
    example: "2025-09-01T00:00:00Z",
  })
  @IsString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({
    description: "Billing period end date (ISO 8601)",
    example: "2025-10-01T00:00:00Z",
  })
  @IsString()
  @IsNotEmpty()
  end: string;
}

class StripeInvoiceDetailsDto {
  @ApiProperty({
    description: "Stripe invoice ID",
    example: "in_123",
  })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({
    description: "Stripe payment intent ID",
    example: "pi_123",
  })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiProperty({
    description: "Stripe charge ID",
    example: "ch_123",
  })
  @IsString()
  @IsNotEmpty()
  chargeId: string;
}

/**
 * Create Subscription Invoice DTO
 * Used internally by WebhooksModule to create invoice records
 */
export class CreateSubscriptionInvoiceDto {
  @ApiProperty({
    description: "Subscription ID this invoice belongs to",
    example: "sub_001",
  })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({
    description: "Seller ID (partition key)",
    example: "dealer_123",
  })
  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({
    description: "Amount details",
    type: AmountDetailsDto,
  })
  @ValidateNested()
  @Type(() => AmountDetailsDto)
  amount: AmountDetailsDto;

  @ApiProperty({
    description: "Invoice status",
    enum: InvoiceStatus,
    example: InvoiceStatus.PAID,
  })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({
    description: "Payment method",
    example: "credit_card",
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({
    description: "Unique transaction reference",
    example: "txn_456",
  })
  @IsString()
  @IsNotEmpty()
  transactionRef: string;

  @ApiProperty({
    description: "Billing period",
    type: BillingPeriodDto,
  })
  @ValidateNested()
  @Type(() => BillingPeriodDto)
  billingPeriod: BillingPeriodDto;

  @ApiProperty({
    description: "Stripe invoice details",
    type: StripeInvoiceDetailsDto,
  })
  @ValidateNested()
  @Type(() => StripeInvoiceDetailsDto)
  stripe: StripeInvoiceDetailsDto;

  @ApiProperty({
    description: "Idempotency key to prevent duplicate writes",
    example: "idempotency_key_123",
    required: false,
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
