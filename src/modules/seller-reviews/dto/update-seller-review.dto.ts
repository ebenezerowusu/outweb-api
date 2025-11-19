import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewRatingDto } from './create-seller-review.dto';

/**
 * Update Seller Review DTO (Reviewer only)
 * Used for PATCH /sellers/:sellerId/reviews/:id
 */
export class UpdateSellerReviewDto {
  @ApiProperty({ description: 'Review title', required: false })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Review body', required: false })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  @IsOptional()
  body?: string;

  @ApiProperty({ description: 'List of pros', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pros?: string[];

  @ApiProperty({ description: 'List of cons', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cons?: string[];

  @ApiProperty({ description: 'Review ratings', required: false })
  @ValidateNested()
  @Type(() => ReviewRatingDto)
  @IsOptional()
  rating?: ReviewRatingDto;
}

/**
 * Create Seller Response DTO
 * Used for POST /sellers/:sellerId/reviews/:id/response
 */
export class CreateSellerResponseDto {
  @ApiProperty({
    description: 'Seller response message',
    example: 'Thank you for your feedback! We appreciate your business.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}

/**
 * Update Review Moderation DTO (Admin only)
 * Used for PATCH /sellers/:sellerId/reviews/:id/moderation
 */
export class UpdateReviewModerationDto {
  @ApiProperty({
    description: 'Moderation status',
    enum: ['pending', 'approved', 'rejected', 'flagged'],
  })
  @IsEnum(['pending', 'approved', 'rejected', 'flagged'])
  @IsOptional()
  status?: 'pending' | 'approved' | 'rejected' | 'flagged';

  @ApiProperty({
    description: 'Flag reason (for flagged status)',
    required: false,
  })
  @IsString()
  @IsOptional()
  flagReason?: string;

  @ApiProperty({
    description: 'Moderation notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  moderationNotes?: string;
}
