import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SellerGroupMemberDto } from './create-seller-group.dto';

/**
 * Update Headquarters Address DTO
 */
export class UpdateHeadquartersAddressDto {
  @ApiProperty({ description: 'Street address', required: false })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'State', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: 'ZIP code', required: false })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ description: 'Country code', required: false })
  @IsString()
  @IsOptional()
  country?: string;
}

/**
 * Update Headquarters DTO
 */
export class UpdateHeadquartersDto {
  @ApiProperty({ description: 'Headquarters address', required: false })
  @ValidateNested()
  @Type(() => UpdateHeadquartersAddressDto)
  @IsOptional()
  address?: UpdateHeadquartersAddressDto;

  @ApiProperty({ description: 'Contact person name', required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({ description: 'Contact email', required: false })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ description: 'Contact phone', required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;
}

/**
 * Update Seller Group DTO
 * Used for PATCH /seller-groups/:id
 */
export class UpdateSellerGroupDto {
  @ApiProperty({ description: 'Group name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Group description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Group logo URL', required: false })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ description: 'Group banner URL', required: false })
  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({ description: 'Group website', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Group phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Group email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Headquarters information', required: false })
  @ValidateNested()
  @Type(() => UpdateHeadquartersDto)
  @IsOptional()
  headquarters?: UpdateHeadquartersDto;
}

/**
 * Update Seller Group Settings DTO
 * Used for PATCH /seller-groups/:id/settings
 */
export class UpdateSellerGroupSettingsDto {
  @ApiProperty({
    description: 'Allow shared inventory across locations',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  sharedInventory?: boolean;

  @ApiProperty({
    description: 'Allow shared pricing across locations',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  sharedPricing?: boolean;

  @ApiProperty({
    description: 'Allow shared branding across locations',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  sharedBranding?: boolean;

  @ApiProperty({
    description: 'Allow cross-location vehicle transfers',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  allowCrossLocationTransfers?: boolean;

  @ApiProperty({
    description: 'Enable centralized payments',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  centralizedPayments?: boolean;
}

/**
 * Update Seller Group Members DTO
 * Used for PATCH /seller-groups/:id/members
 */
export class UpdateSellerGroupMembersDto {
  @ApiProperty({
    description: 'Updated list of group members',
    type: [SellerGroupMemberDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerGroupMemberDto)
  members: SellerGroupMemberDto[];
}

/**
 * Update Seller Group Meta DTO (Admin only - typically system updates)
 * Used for PATCH /seller-groups/:id/meta
 */
export class UpdateSellerGroupMetaDto {
  @ApiProperty({ description: 'Total number of locations', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalLocations?: number;

  @ApiProperty({ description: 'Total listings across all locations', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalListings?: number;

  @ApiProperty({ description: 'Total sales across all locations', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalSales?: number;

  @ApiProperty({ description: 'Average rating across all locations', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  averageRating?: number;

  @ApiProperty({ description: 'Total reviews across all locations', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalReviews?: number;
}
