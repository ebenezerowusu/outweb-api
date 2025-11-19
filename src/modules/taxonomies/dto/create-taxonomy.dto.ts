import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsObject,
  MinLength,
  Min,
} from 'class-validator';
import { TaxonomyCategory } from '../interfaces/taxonomy.interface';

/**
 * Create Taxonomy DTO
 * Used for POST /taxonomies
 */
export class CreateTaxonomyDto {
  @ApiProperty({
    description: 'Taxonomy category',
    enum: [
      'make',
      'model',
      'trim',
      'year',
      'color',
      'interior_color',
      'body_type',
      'drivetrain',
      'battery_size',
      'feature',
      'condition',
    ],
    example: 'make',
  })
  @IsEnum([
    'make',
    'model',
    'trim',
    'year',
    'color',
    'interior_color',
    'body_type',
    'drivetrain',
    'battery_size',
    'feature',
    'condition',
  ])
  category: TaxonomyCategory;

  @ApiProperty({ description: 'Taxonomy name', example: 'Tesla' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'tesla',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Taxonomy description',
    example: 'American electric vehicle manufacturer',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Parent taxonomy ID (for hierarchical relationships)',
    example: 'tax_make_tesla',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Mark as popular',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiProperty({
    description: 'SEO meta title',
    required: false,
  })
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiProperty({
    description: 'SEO meta description',
    required: false,
  })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiProperty({
    description: 'SEO meta keywords',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metaKeywords?: string[];

  @ApiProperty({
    description: 'Additional metadata as key-value pairs',
    example: { manufacturer: 'Tesla, Inc.', founded: '2003' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
