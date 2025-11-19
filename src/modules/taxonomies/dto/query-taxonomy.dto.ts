import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaxonomyCategory } from '../interfaces/taxonomy.interface';

/**
 * Query Taxonomies DTO
 * Used for filtering and pagination in GET /taxonomies
 */
export class QueryTaxonomiesDto {
  @ApiProperty({
    description: 'Filter by taxonomy category',
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
    required: false,
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
  @IsOptional()
  category?: TaxonomyCategory;

  @ApiProperty({
    description: 'Filter by parent taxonomy ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Search by name or slug',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by visibility status',
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiProperty({
    description: 'Filter by popular status',
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

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

/**
 * Autocomplete/Suggest Taxonomies DTO
 * Used for GET /taxonomies/suggest
 */
export class SuggestTaxonomiesDto {
  @ApiProperty({
    description: 'Category to search within',
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

  @ApiProperty({
    description: 'Search query',
    example: 'tes',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Parent taxonomy ID (for hierarchical filtering)',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Limit number of suggestions',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;
}
