import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Length,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaxonomyOptionDto } from './create-taxonomy.dto';

/**
 * Update Taxonomy DTO (PATCH /taxonomies/:categoryId)
 * Can update order or replace entire options array
 */
export class UpdateTaxonomyDto {
  @ApiProperty({
    description: 'Display order',
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Replace entire options array',
    type: [CreateTaxonomyOptionDto],
    required: false,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTaxonomyOptionDto)
  @IsOptional()
  options?: CreateTaxonomyOptionDto[];
}

/**
 * Update Taxonomy Option DTO (PATCH /taxonomies/:categoryId/options/:optionId)
 */
export class UpdateTaxonomyOptionDto {
  @ApiProperty({
    description: 'Option label',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  label?: string;

  @ApiProperty({
    description: 'Option value',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  value?: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    required: false,
  })
  @IsString()
  @Length(1, 100)
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Display order',
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Is option active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Make (for model taxonomy)',
    required: false,
  })
  @IsString()
  @IsOptional()
  make?: string;

  // Allow additional fields
  [key: string]: any;
}
