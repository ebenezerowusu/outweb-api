import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

/**
 * SEO Listing Context DTO (POST /seo/listings/context)
 * Build meta title, description, canonical from taxonomy slugs
 */
export class SeoListingContextDto {
  @ApiProperty({
    description: 'Make slug',
    example: 'tesla',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  makeSlug?: string;

  @ApiProperty({
    description: 'Model slug',
    example: 'model-s',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  modelSlug?: string;

  @ApiProperty({
    description: 'Trim slug',
    example: 'p100d',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  trimSlug?: string;

  @ApiProperty({
    description: 'Body style slug',
    example: 'sedan',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  bodyStyleSlug?: string;

  @ApiProperty({
    description: 'Country slug',
    example: 'usa',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  countrySlug?: string;

  @ApiProperty({
    description: 'Condition slug',
    example: 'used',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  conditionSlug?: string;

  @ApiProperty({
    description: 'Color slug',
    example: 'blue-metallic',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  colorSlug?: string;

  @ApiProperty({
    description: 'Vehicle condition slug (new/used/certified)',
    example: 'used',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  vehicleConditionSlug?: string;
}
