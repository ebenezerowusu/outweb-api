import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';

/**
 * Update Listing DTO
 * Used for PATCH /listings/:id
 */
export class UpdateListingDto {
  @ApiProperty({ description: 'Current mileage', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;

  @ApiProperty({ description: 'List price in cents', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  listPrice?: number;

  @ApiProperty({ description: 'Price change reason', required: false })
  @IsString()
  @IsOptional()
  priceChangeReason?: string;

  @ApiProperty({ description: 'Price is negotiable', required: false })
  @IsBoolean()
  @IsOptional()
  negotiable?: boolean;

  @ApiProperty({ description: 'Accepts offers', required: false })
  @IsBoolean()
  @IsOptional()
  acceptsOffers?: boolean;

  @ApiProperty({ description: 'Trade-in accepted', required: false })
  @IsBoolean()
  @IsOptional()
  tradeinAccepted?: boolean;

  @ApiProperty({ description: 'Financing available', required: false })
  @IsBoolean()
  @IsOptional()
  financingAvailable?: boolean;

  @ApiProperty({ description: 'Condition description', required: false })
  @IsString()
  @IsOptional()
  conditionDescription?: string;

  @ApiProperty({ description: 'Known issues', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownIssues?: string[];

  @ApiProperty({ description: 'Modifications', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modifications?: string[];

  @ApiProperty({ description: 'Highlight features', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  highlights?: string[];
}

/**
 * Update Listing Status DTO
 * Used for PATCH /listings/:id/status
 */
export class UpdateListingStatusDto {
  @ApiProperty({
    description: 'Listing state',
    enum: ['draft', 'pending_review', 'published', 'sold', 'expired', 'suspended', 'archived'],
  })
  @IsEnum(['draft', 'pending_review', 'published', 'sold', 'expired', 'suspended', 'archived'])
  state: 'draft' | 'pending_review' | 'published' | 'sold' | 'expired' | 'suspended' | 'archived';

  @ApiProperty({ description: 'Substatus or reason', required: false })
  @IsString()
  @IsOptional()
  substatus?: string;
}

/**
 * Update Listing Visibility DTO
 * Used for PATCH /listings/:id/visibility
 */
export class UpdateListingVisibilityDto {
  @ApiProperty({ description: 'Publicly visible', required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ description: 'Show seller information', required: false })
  @IsBoolean()
  @IsOptional()
  showSellerInfo?: boolean;

  @ApiProperty({ description: 'Show pricing', required: false })
  @IsBoolean()
  @IsOptional()
  showPricing?: boolean;

  @ApiProperty({ description: 'Allow messages', required: false })
  @IsBoolean()
  @IsOptional()
  allowMessages?: boolean;

  @ApiProperty({ description: 'Allow offers', required: false })
  @IsBoolean()
  @IsOptional()
  allowOffers?: boolean;
}

/**
 * Feature Listing DTO
 * Used for POST /listings/:id/feature
 */
export class FeatureListingDto {
  @ApiProperty({ description: 'Duration in days', example: 7, minimum: 1, maximum: 30 })
  @IsInt()
  @Min(1)
  @Max(30)
  durationDays: number;
}
