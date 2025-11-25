import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Query Taxonomies DTO (GET /taxonomies)
 * List all taxonomy categories (lightweight)
 */
export class QueryTaxonomiesDto {
  @ApiProperty({
    description: 'Include empty categories (with no options)',
    required: false,
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeEmpty?: boolean = true;

  @ApiProperty({
    description: 'Sort by field',
    enum: ['order', 'id'],
    required: false,
    default: 'order',
  })
  @IsEnum(['order', 'id'])
  @IsOptional()
  sortBy?: 'order' | 'id' = 'order';
}

/**
 * Get Taxonomy Options DTO (GET /taxonomies/:categoryId/options)
 */
export class GetTaxonomyOptionsDto {
  @ApiProperty({
    description: 'Return only active options',
    required: false,
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean = true;

  @ApiProperty({
    description: 'Sort options by field',
    enum: ['order', 'label'],
    required: false,
    default: 'order',
  })
  @IsEnum(['order', 'label'])
  @IsOptional()
  sortBy?: 'order' | 'label' = 'order';

  @ApiProperty({
    description: 'Filter models by make (only for model taxonomy)',
    required: false,
  })
  @IsString()
  @IsOptional()
  make?: string;

  @ApiProperty({
    description: 'Search query (case-insensitive search in label)',
    required: false,
    minLength: 1,
    maxLength: 64,
  })
  @IsString()
  @Length(1, 64)
  @IsOptional()
  q?: string;

  @ApiProperty({
    description: 'Limit number of results',
    required: false,
    default: 100,
    minimum: 1,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number = 100;

  @ApiProperty({
    description: 'Cursor for pagination',
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}

/**
 * Bulk Get Taxonomies DTO (GET /taxonomies/bulk)
 */
export class BulkGetTaxonomiesDto {
  @ApiProperty({
    description: 'Comma-separated list of category IDs',
    example: 'make,model,color,bodyStyle,drivetrain',
    required: true,
  })
  @IsString()
  categories: string;

  @ApiProperty({
    description: 'Return only active options',
    required: false,
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean = true;
}
