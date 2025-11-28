import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsISO8601,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Query Billings DTO
 * Used for GET /billings with filters and pagination
 */
export class QueryBillingsDto {
  @ApiProperty({
    description: "Filter by user ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: "Filter by seller ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({
    description: "Filter by listing ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  listingId?: string;

  @ApiProperty({
    description: "Filter by billing status (0=pending, 1=success, 2=failed, 3=canceled, 4=expired, 5=refunded, 6=chargeback, 7=disputed)",
    enum: [0, 1, 2, 3, 4, 5, 6, 7],
    required: false,
  })
  @IsEnum([0, 1, 2, 3, 4, 5, 6, 7])
  @Type(() => Number)
  @IsOptional()
  status?: number;

  @ApiProperty({
    description: "Filter by product type",
    enum: ["featured_listing", "bump_listing", "highlight_listing"],
    required: false,
  })
  @IsEnum(["featured_listing", "bump_listing", "highlight_listing"])
  @IsOptional()
  productType?: "featured_listing" | "bump_listing" | "highlight_listing";

  @ApiProperty({
    description: "Filter by start date (ISO 8601)",
    example: "2025-01-01T00:00:00Z",
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  from?: string;

  @ApiProperty({
    description: "Filter by end date (ISO 8601)",
    example: "2025-12-31T23:59:59Z",
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  to?: string;

  @ApiProperty({
    description: "Page number (1-based)",
    example: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: "Page size (1-100)",
    example: 20,
    default: 20,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @ApiProperty({
    description: "Continuation token from previous page",
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}
