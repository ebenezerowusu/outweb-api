import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Review Rating DTO
 */
export class ReviewRatingDto {
  @ApiProperty({ description: 'Overall rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  overall: number;

  @ApiProperty({
    description: 'Communication rating (1-5)',
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  communication?: number;

  @ApiProperty({
    description: 'Vehicle condition rating (1-5)',
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  vehicleCondition?: number;

  @ApiProperty({
    description: 'Pricing rating (1-5)',
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  pricing?: number;

  @ApiProperty({
    description: 'Process smoothness rating (1-5)',
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  processSmoothness?: number;
}

/**
 * Create Seller Review DTO
 * Used for POST /sellers/:sellerId/reviews
 */
export class CreateSellerReviewDto {
  @ApiProperty({
    description: 'Order ID (for verified purchase)',
    required: false,
  })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Review title', example: 'Great dealer, smooth transaction!' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Review body',
    example: 'The entire process was smooth and professional. Highly recommended!',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  body: string;

  @ApiProperty({
    description: 'List of pros',
    example: ['Fast response', 'Honest pricing', 'Great communication'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pros?: string[];

  @ApiProperty({
    description: 'List of cons',
    example: ['Slightly delayed paperwork'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cons?: string[];

  @ApiProperty({ description: 'Review ratings' })
  @ValidateNested()
  @Type(() => ReviewRatingDto)
  rating: ReviewRatingDto;
}
