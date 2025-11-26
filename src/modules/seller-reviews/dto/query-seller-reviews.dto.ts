import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Query Seller Reviews DTO
 * Used for filtering and pagination in GET /sellers/:sellerId/reviews
 */
export class QuerySellerReviewsDto {
  @ApiProperty({
    description: "Filter by reviewer user ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: "Filter by minimum rating (1-5)",
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @ApiProperty({
    description: "Filter by maximum rating (1-5)",
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  maxRating?: number;

  @ApiProperty({
    description: "Filter by verified purchase status",
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isVerifiedPurchase?: boolean;

  @ApiProperty({
    description: "Filter by moderation status",
    enum: ["pending", "approved", "rejected", "flagged"],
    required: false,
  })
  @IsEnum(["pending", "approved", "rejected", "flagged"])
  @IsOptional()
  status?: "pending" | "approved" | "rejected" | "flagged";

  @ApiProperty({
    description: "Filter by presence of seller response",
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  hasResponse?: boolean;

  @ApiProperty({
    description: "Number of items per page (1-100)",
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: "Continuation token from previous page",
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}
