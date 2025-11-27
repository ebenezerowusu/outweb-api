import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsISO8601,
  IsObject,
  ValidateNested,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for accepting an offer
 */
export class AcceptOfferDto {
  @ApiPropertyOptional({ description: "Acceptance message to buyer" })
  @IsString()
  @IsOptional()
  message?: string;
}

/**
 * DTO for rejecting an offer
 */
export class RejectOfferDto {
  @ApiProperty({ description: "Rejection reason" })
  @IsString()
  reason: string;
}

/**
 * DTO for offer terms update
 */
export class UpdateOfferTermsDto {
  @ApiPropertyOptional({ description: "Offer contingent on inspection" })
  @IsBoolean()
  @IsOptional()
  inspectionContingent?: boolean;

  @ApiPropertyOptional({ description: "Offer contingent on financing" })
  @IsBoolean()
  @IsOptional()
  financingContingent?: boolean;

  @ApiPropertyOptional({ description: "Trade-in required" })
  @IsBoolean()
  @IsOptional()
  tradeInRequired?: boolean;

  @ApiPropertyOptional({ description: "Trade-in vehicle details" })
  @IsString()
  @IsOptional()
  tradeInDetails?: string;

  @ApiPropertyOptional({ description: "Delivery required" })
  @IsBoolean()
  @IsOptional()
  deliveryRequired?: boolean;

  @ApiPropertyOptional({ description: "Delivery location" })
  @IsString()
  @IsOptional()
  deliveryLocation?: string;

  @ApiPropertyOptional({ description: "Additional terms or conditions" })
  @IsString()
  @IsOptional()
  additionalTerms?: string;
}

/**
 * DTO for making a counter-offer
 */
export class CounterOfferDto {
  @ApiProperty({ description: "Counter-offer amount", example: 44000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: "Message to buyer" })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({
    description: "Counter-offer expiration date (defaults to 7 days)",
    example: "2024-01-20T00:00:00Z",
  })
  @IsISO8601()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: "Modified terms" })
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateOfferTermsDto)
  @IsOptional()
  terms?: UpdateOfferTermsDto;
}

/**
 * DTO for withdrawing an offer
 */
export class WithdrawOfferDto {
  @ApiProperty({ description: "Withdrawal reason" })
  @IsString()
  reason: string;
}
