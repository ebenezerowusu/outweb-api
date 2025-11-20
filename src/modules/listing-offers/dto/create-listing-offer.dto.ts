import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsISO8601,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for offer terms and conditions
 */
export class CreateOfferTermsDto {
  @ApiPropertyOptional({ description: 'Offer contingent on inspection', default: false })
  @IsBoolean()
  @IsOptional()
  inspectionContingent?: boolean;

  @ApiPropertyOptional({ description: 'Offer contingent on financing', default: false })
  @IsBoolean()
  @IsOptional()
  financingContingent?: boolean;

  @ApiPropertyOptional({ description: 'Trade-in required', default: false })
  @IsBoolean()
  @IsOptional()
  tradeInRequired?: boolean;

  @ApiPropertyOptional({ description: 'Trade-in vehicle details' })
  @IsString()
  @IsOptional()
  tradeInDetails?: string;

  @ApiPropertyOptional({ description: 'Delivery required', default: false })
  @IsBoolean()
  @IsOptional()
  deliveryRequired?: boolean;

  @ApiPropertyOptional({ description: 'Delivery location' })
  @IsString()
  @IsOptional()
  deliveryLocation?: string;

  @ApiPropertyOptional({ description: 'Additional terms or conditions' })
  @IsString()
  @IsOptional()
  additionalTerms?: string;
}

/**
 * DTO for creating a new offer
 */
export class CreateListingOfferDto {
  @ApiProperty({ description: 'Listing ID to make offer on' })
  @IsString()
  listingId: string;

  @ApiProperty({ description: 'Offer amount', example: 42000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Message to seller' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Offer expiration date (defaults to 7 days)', example: '2024-01-20T00:00:00Z' })
  @IsISO8601()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Offer terms and conditions' })
  @IsObject()
  @ValidateNested()
  @Type(() => CreateOfferTermsDto)
  @IsOptional()
  terms?: CreateOfferTermsDto;
}
