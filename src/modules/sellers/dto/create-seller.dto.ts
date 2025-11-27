import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";

export enum SellerType {
  DEALER = "Dealer",
  PRIVATE = "Private Seller",
}

class AddressDto {
  @ApiProperty({ example: "45500 Fremont Blvd" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: "Fremont" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city: string;

  @ApiProperty({ example: "California" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  state: string;

  @ApiProperty({ example: "USA" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  country: string;
}

class DealerDetailsDto {
  @ApiProperty({ example: "Tesla Fremont" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName: string;

  @ApiProperty({
    description: "Dealer brand type (use /taxonomies/dealerBrand for options: Independent, Franchise, OEM-owned, Group-affiliated, Corporate-owned, Private, Other)",
    example: "Independent",
    enum: ['Independent', 'Franchise', 'OEM-owned', 'Group-affiliated', 'Corporate-owned', 'Private', 'Other'],
  })
  @IsString()
  dealerType: string;

  @ApiProperty({
    description: "Business type (use /taxonomies/businessType for options: Single Dealer, Dealer group, Group-affiliated dealership, Franchise dealership, OEM, Fleet, Vendor, Other)",
    example: "Franchise dealership",
    enum: ['Single Dealer', 'Dealer group', 'Group-affiliated dealership', 'Franchise dealership', 'OEM', 'Fleet', 'Vendor', 'Other'],
  })
  @IsString()
  businessType: string;

  @ApiProperty({ example: null, required: false })
  @IsString()
  @IsOptional()
  dealerGroupId?: string;

  @ApiProperty({ example: "Brian Antwi" })
  @IsString()
  ownerName: string;

  @ApiProperty({ example: "brian.antwi@teslafremont.com" })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isOwner: boolean;

  @ApiProperty({
    description: "Syndication system (use /taxonomies/syndicationSystem for options: vAuto, Authenticom, Dealertrack, HomeNet, CDK Global, AutoManager, Chrome Inventory, ReyRey, CDKDrive, Dealer eProcess, DealerSocket, Dominion, Elead, Frazer, VinSolutions, Xtime, Other)",
    example: "vAuto",
    enum: ['vAuto', 'Authenticom', 'Dealertrack', 'HomeNet', 'CDK Global', 'AutoManager', 'Chrome Inventory', 'ReyRey', 'CDKDrive', 'Dealer eProcess', 'DealerSocket', 'Dominion', 'Elead', 'Frazer', 'VinSolutions', 'Xtime', 'Other'],
    required: false,
  })
  @IsString()
  @IsOptional()
  syndicationSystem?: string;

  @ApiProperty({
    example: { site1: "Lousina", site2: "California" },
    required: false,
  })
  @IsOptional()
  businessSite?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  licensePhotoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licenseExpiration?: string;

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
  syndicationApiKey?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  businessSiteLocations?: string[];
}

class PrivateDetailsDto {
  @ApiProperty({ example: "Edem" })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  idVerificationPhotoUrl?: string;
}

class SellerUserDto {
  @ApiProperty({ example: "usr_123" })
  @IsString()
  userId: string;

  @ApiProperty({ example: "owner" })
  @IsString()
  role: string;
}

/**
 * Create Seller DTO
 */
export class CreateSellerDto {
  @ApiProperty({
    description: "Seller type (use /taxonomies/sellerType for options: Dealer, Private Seller)",
    enum: SellerType,
    example: SellerType.DEALER,
  })
  @IsEnum(SellerType)
  sellerType: SellerType;

  @ApiProperty({ example: "contact@teslafremont.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "+1-555-123-4567" })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ type: DealerDetailsDto, required: false })
  @ValidateNested()
  @Type(() => DealerDetailsDto)
  @IsOptional()
  dealerDetails?: DealerDetailsDto;

  @ApiProperty({ type: PrivateDetailsDto, required: false })
  @ValidateNested()
  @Type(() => PrivateDetailsDto)
  @IsOptional()
  privateDetails?: PrivateDetailsDto;

  @ApiProperty({ type: [SellerUserDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerUserDto)
  users: SellerUserDto[];
}
