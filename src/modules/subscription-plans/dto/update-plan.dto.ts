import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { CreateSubscriptionPlanDto } from "./create-plan.dto";
import { IsBoolean, IsOptional } from "class-validator";

/**
 * Update Subscription Plan DTO
 * All fields are optional except those we want to prevent from being updated
 */
export class UpdateSubscriptionPlanDto extends PartialType(
  OmitType(CreateSubscriptionPlanDto, ["id", "category"] as const),
) {
  @ApiProperty({
    description: "Whether plan is active and available for subscription",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
