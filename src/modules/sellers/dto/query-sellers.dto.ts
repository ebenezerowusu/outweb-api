import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum SellerTypeFilter {
  DEALER = 'dealer',
  PRIVATE = 'private',
}

/**
 * Query Sellers DTO
 * Used for filtering and pagination in GET /sellers
 */
export class QuerySellersDto {
  @ApiProperty({
    description: 'Filter by seller type',
    enum: SellerTypeFilter,
    required: false,
  })
  @IsEnum(SellerTypeFilter)
  @IsOptional()
  sellerType?: SellerTypeFilter;

  @ApiProperty({
    description: 'Filter by email',
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Filter by company name (dealers only)',
    required: false,
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({
    description: 'Filter by city',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Filter by state',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Filter by country',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Filter by verified status',
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiProperty({
    description: 'Filter by approved status',
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  @ApiProperty({
    description: 'Filter by blocked status',
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  blocked?: boolean;

  @ApiProperty({
    description: 'Filter by user ID (sellers that user belongs to)',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Number of items per page (1-100)',
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
    description: 'Continuation token from previous page',
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}
