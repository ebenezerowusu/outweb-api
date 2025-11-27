import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsBoolean, IsOptional } from "class-validator";

/**
 * Update Subscription Plan DTO
 * Used for PATCH /subscriptions/:id/plan
 */
export class UpdateSubscriptionPlanDto {
  @ApiProperty({
    description: "New subscription category",
    enum: ["cashoffer", "dealer_wholesale", "dealer_advertising"],
    example: "dealer_wholesale",
  })
  @IsEnum(["cashoffer", "dealer_wholesale", "dealer_advertising"])
  category: "cashoffer" | "dealer_wholesale" | "dealer_advertising";

  @ApiProperty({
    description: "New billing interval (currently only monthly is supported)",
    enum: ["monthly"],
    example: "monthly",
    default: "monthly",
  })
  @IsEnum(["monthly"])
  interval: "monthly";

  @ApiProperty({
    description: "Prorate the change (charge/credit immediately)",
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  prorate?: boolean = true;
}

/**
 * Cancel Subscription DTO
 * Used for POST /subscriptions/:id/cancel
 */
export class CancelSubscriptionDto {
  @ApiProperty({
    description: "Cancel immediately or at period end",
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  immediately?: boolean = false;

  @ApiProperty({
    description: "Cancellation reason",
    required: false,
  })
  @IsOptional()
  reason?: string;
}

/**
 * Reactivate Subscription DTO
 * Used for POST /subscriptions/:id/reactivate
 */
export class ReactivateSubscriptionDto {
  // Empty for now, but can add fields for plan selection if needed
}
