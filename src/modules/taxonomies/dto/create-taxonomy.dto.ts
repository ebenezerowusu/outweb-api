import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
  Length,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create Taxonomy Option DTO
 */
export class CreateTaxonomyOptionDto {
  @ApiProperty({ description: 'Option ID (unique within taxonomy)', example: 1 })
  @IsNumber()
  @Min(1)
  id: number;

  @ApiProperty({ description: 'Option label', example: 'Tesla' })
  @IsString()
  @Length(1, 100)
  label: string;

  @ApiProperty({ description: 'Option value', example: 'Tesla' })
  @IsString()
  @Length(1, 100)
  value: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'tesla',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Display order', example: 1 })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Is option active', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Make (for model taxonomy)',
    example: 'Tesla',
    required: false,
  })
  @IsString()
  @IsOptional()
  make?: string;

  // Allow additional fields
  [key: string]: any;
}

/**
 * Create Taxonomy DTO (POST /taxonomies)
 */
export class CreateTaxonomyDto {
  @ApiProperty({
    description: 'Taxonomy ID (must equal category)',
    example: 'make',
  })
  @IsString()
  @Length(1, 64)
  id: string;

  @ApiProperty({
    description: 'Taxonomy category (must equal id)',
    example: 'make',
  })
  @IsString()
  @Length(1, 64)
  category: string;

  @ApiProperty({ description: 'Display order', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({
    description: 'Taxonomy options',
    type: [CreateTaxonomyOptionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTaxonomyOptionDto)
  options: CreateTaxonomyOptionDto[];
}

/**
 * Add Taxonomy Options DTO (POST /taxonomies/:categoryId/options)
 */
export class AddTaxonomyOptionsDto {
  @ApiProperty({
    description: 'Options to add',
    type: [CreateTaxonomyOptionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTaxonomyOptionDto)
  options: CreateTaxonomyOptionDto[];
}
