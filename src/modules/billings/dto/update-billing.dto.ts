import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from "class-validator";
import { BillingStatus } from "../interfaces/billing.interface";

/**
 * Update Billing Status DTO (Admin Only)
 */
export class UpdateBillingStatusDto {
  @ApiProperty({
    description: "Billing status",
    enum: [0, 1, 2, 3, 4, 5, 6, 7],
    example: 5,
  })
  @IsEnum([0, 1, 2, 3, 4, 5, 6, 7])
  status: BillingStatus;

  @ApiProperty({
    description: "Reason for status change",
    example: "Manual refund via support ticket #12345",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  statusReason?: string;
}

/**
 * Create Refund DTO
 */
export class CreateRefundDto {
  @ApiProperty({
    description: "Reason for refund",
    example: "customer_requested",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    description: "Refund amount in minor units (leave empty for full refund)",
    example: 1000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  amount?: number;
}

/**
 * Update Billing from Webhook DTO (Internal Use)
 */
export class UpdateBillingFromWebhookDto {
  @ApiProperty({
    description: "Stripe session ID",
    example: "cs_test_a16zwLyhe2x...",
  })
  @IsString()
  stripeSessionId: string;

  @ApiProperty({
    description: "Billing status",
    enum: [0, 1, 2, 3, 4, 5, 6, 7],
  })
  @IsEnum([0, 1, 2, 3, 4, 5, 6, 7])
  status: BillingStatus;

  @ApiProperty({
    description: "Stripe payment intent ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  stripePaymentIntentId?: string;

  @ApiProperty({
    description: "Additional metadata from Stripe",
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
