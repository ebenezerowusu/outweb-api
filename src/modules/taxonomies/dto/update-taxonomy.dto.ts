import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';

/**
 * Update Taxonomy DTO
 * Used for PATCH /taxonomies/:id
 */
export class UpdateTaxonomyDto {
  @ApiProperty({ description: 'Taxonomy name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'URL-friendly slug', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Taxonomy description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Display order for sorting', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({ description: 'Mark as popular', required: false })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiProperty({ description: 'SEO meta title', required: false })
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiProperty({ description: 'SEO meta description', required: false })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiProperty({ description: 'SEO meta keywords', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metaKeywords?: string[];

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Update Taxonomy Status DTO
 * Used for PATCH /taxonomies/:id/status
 */
export class UpdateTaxonomyStatusDto {
  @ApiProperty({ description: 'Active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Visibility status', required: false })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}

/**
 * Bulk Update Taxonomies DTO
 * Used for PATCH /taxonomies/bulk
 */
export class BulkUpdateTaxonomiesDto {
  @ApiProperty({
    description: 'Array of taxonomy IDs to update',
    type: [String],
    example: ['tax_123', 'tax_456'],
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ description: 'Active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Visibility status', required: false })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiProperty({ description: 'Mark as popular', required: false })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;
}
