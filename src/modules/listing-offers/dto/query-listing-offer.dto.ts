import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OfferState } from '../interfaces/listing-offer.interface';

/**
 * DTO for querying listing offers
 */
export class QueryListingOffersDto {
  @ApiPropertyOptional({ description: 'Filter by listing ID' })
  @IsString()
  @IsOptional()
  listingId?: string;

  @ApiPropertyOptional({ description: 'Filter by buyer ID' })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiPropertyOptional({ description: 'Filter by seller ID' })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by offer state',
    enum: ['pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired'],
  })
  @IsEnum(['pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired'])
  @IsOptional()
  state?: OfferState;

  @ApiPropertyOptional({ description: 'Minimum offer amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum offer amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'amount'], default: 'createdAt' })
  @IsEnum(['createdAt', 'amount'])
  @IsOptional()
  sortBy?: 'createdAt' | 'amount';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Continuation token for pagination' })
  @IsString()
  @IsOptional()
  continuationToken?: string;
}
