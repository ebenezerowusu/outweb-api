import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

/**
 * Query Seller Groups DTO
 * Used for filtering and pagination in GET /seller-groups
 */
export class QuerySellerGroupsDto {
  @ApiProperty({
    description: "Filter by group name (partial match)",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "Filter by email",
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "Filter by city",
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: "Filter by state",
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: "Filter by country",
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: "Filter by seller membership (groups that seller belongs to)",
    required: false,
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

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
