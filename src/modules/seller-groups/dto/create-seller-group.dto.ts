import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUrl,
  IsArray,
  ValidateNested,
  MinLength,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Address DTO for headquarters
 */
export class HeadquartersAddressDto {
  @ApiProperty({ description: "Street address", example: "123 Main St" })
  @IsString()
  @MinLength(1)
  street: string;

  @ApiProperty({ description: "City", example: "San Francisco" })
  @IsString()
  @MinLength(1)
  city: string;

  @ApiProperty({ description: "State", example: "CA" })
  @IsString()
  @MinLength(1)
  state: string;

  @ApiProperty({ description: "ZIP code", example: "94102" })
  @IsString()
  @MinLength(1)
  zipCode: string;

  @ApiProperty({
    description: "Country code (ISO 3166-1 alpha-2)",
    example: "US",
  })
  @IsString()
  @MinLength(2)
  country: string;
}

/**
 * Headquarters Information DTO
 */
export class HeadquartersDto {
  @ApiProperty({ description: "Headquarters address" })
  @ValidateNested()
  @Type(() => HeadquartersAddressDto)
  address: HeadquartersAddressDto;

  @ApiProperty({ description: "Contact person name", required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({ description: "Contact email", required: false })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ description: "Contact phone", required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;
}

/**
 * Seller Group Member DTO
 */
export class SellerGroupMemberDto {
  @ApiProperty({ description: "Seller ID to add to the group" })
  @IsString()
  @MinLength(1)
  sellerId: string;

  @ApiProperty({
    description: "Role in the group",
    enum: ["primary", "member"],
    example: "member",
  })
  @IsEnum(["primary", "member"])
  role: "primary" | "member";
}

/**
 * Create Seller Group DTO
 * Used for POST /seller-groups
 */
export class CreateSellerGroupDto {
  @ApiProperty({
    description: "Group name",
    example: "Tesla Elite Dealers Network",
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: "Group description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Group logo URL", required: false })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ description: "Group banner URL", required: false })
  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({ description: "Group website", required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: "Group phone number", example: "+1-555-0100" })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiProperty({ description: "Group email", example: "info@teslaelite.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Headquarters information" })
  @ValidateNested()
  @Type(() => HeadquartersDto)
  headquarters: HeadquartersDto;

  @ApiProperty({
    description: "Initial group members",
    type: [SellerGroupMemberDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerGroupMemberDto)
  @IsOptional()
  members?: SellerGroupMemberDto[];
}
