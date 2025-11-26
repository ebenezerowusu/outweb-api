import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query Listings DTO
 * Used for GET /listings with advanced filtering
 */
export class QueryListingsDto {
  @ApiProperty({ description: 'Search query (make, model, VIN)', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ description: 'Filter by seller ID', required: false })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({ description: 'Filter by make taxonomy ID', required: false })
  @IsString()
  @IsOptional()
  makeId?: string;

  @ApiProperty({ description: 'Filter by model taxonomy ID', required: false })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiProperty({ description: 'Filter by minimum year', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(2008)
  @IsOptional()
  minYear?: number;

  @ApiProperty({ description: 'Filter by maximum year', required: false })
  @Type(() => Number)
  @IsInt()
  @Max(2030)
  @IsOptional()
  maxYear?: number;

  @ApiProperty({ description: 'Filter by minimum price (cents)', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ description: 'Filter by maximum price (cents)', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ description: 'Filter by minimum mileage', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minMileage?: number;

  @ApiProperty({ description: 'Filter by maximum mileage', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxMileage?: number;

  @ApiProperty({ description: 'Filter by exterior color taxonomy ID', required: false })
  @IsString()
  @IsOptional()
  exteriorColorId?: string;

  @ApiProperty({ description: 'Filter by interior color taxonomy ID', required: false })
  @IsString()
  @IsOptional()
  interiorColorId?: string;

  @ApiProperty({ description: 'Filter by body type taxonomy ID', required: false })
  @IsString()
  @IsOptional()
  bodyTypeId?: string;

  @ApiProperty({ description: 'Filter by drivetrain taxonomy ID', required: false })
  @IsString()
  @IsOptional()
  drivetrainId?: string;

  @ApiProperty({
    description: 'Filter by condition',
    enum: ['excellent', 'good', 'fair', 'needs_work'],
    required: false,
  })
  @IsEnum(['excellent', 'good', 'fair', 'needs_work'])
  @IsOptional()
  condition?: 'excellent' | 'good' | 'fair' | 'needs_work';

  @ApiProperty({
    description: 'Filter by listing state',
    enum: ['draft', 'pending_review', 'published', 'sold', 'expired', 'suspended', 'archived'],
    required: false,
  })
  @IsEnum(['draft', 'pending_review', 'published', 'sold', 'expired', 'suspended', 'archived'])
  @IsOptional()
  state?: 'draft' | 'pending_review' | 'published' | 'sold' | 'expired' | 'suspended' | 'archived';

  @ApiProperty({ description: 'Filter by featured status', required: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiProperty({ description: 'Filter by verified status', required: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiProperty({ description: 'Filter by FSD capable', required: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  fsdCapable?: boolean;

  @ApiProperty({ description: 'Filter by required features (taxonomy IDs)', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({ description: 'Filter by country', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Filter by state', required: false })
  @IsString()
  @IsOptional()
  state_location?: string;

  @ApiProperty({ description: 'Filter by city', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Filter by ZIP code', required: false })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    description: 'Sort by field',
    enum: ['price_asc', 'price_desc', 'mileage_asc', 'mileage_desc', 'year_asc', 'year_desc', 'created_asc', 'created_desc'],
    default: 'created_desc',
    required: false,
  })
  @IsEnum(['price_asc', 'price_desc', 'mileage_asc', 'mileage_desc', 'year_asc', 'year_desc', 'created_asc', 'created_desc'])
  @IsOptional()
  sortBy?: string = 'created_desc';

  @ApiProperty({ description: 'Number of items per page (1-100)', example: 20, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ description: 'Continuation token from previous page', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;
}
