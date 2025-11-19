import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateAddressDto {
  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsOptional()
  street?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  country?: string;
}

/**
 * Update Seller Profile DTO
 */
export class UpdateSellerDto {
  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @ApiProperty({ type: UpdateAddressDto, required: false })
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: UpdateAddressDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dealerType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licenseExpiration?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licensePhotoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insurancePolicyNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insuranceExpiration?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  syndicationSystem?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  syndicationApiKey?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  businessSiteLocations?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idVerificationPhotoUrl?: string;
}

/**
 * Update Seller Status DTO (Admin Only)
 */
export class UpdateSellerStatusDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  blocked?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  blockedReason?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licenseStatus?: string;
}

/**
 * Update Seller Meta DTO
 */
export class UpdateSellerMetaDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reviewsCount?: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalListings?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  activeListings?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  soldListings?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  averageRating?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalReviews?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalSales?: number;
}

/**
 * Update Seller Users DTO
 */
class SellerUserItemDto {
  @ApiProperty({ example: 'usr_123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'owner' })
  @IsString()
  role: string;
}

export class UpdateSellerUsersDto {
  @ApiProperty({ type: [SellerUserItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerUserItemDto)
  users: SellerUserItemDto[];
}
