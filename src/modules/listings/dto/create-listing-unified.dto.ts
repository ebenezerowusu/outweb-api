import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateVehicleDto } from "../../vehicles/dto/create-vehicle.dto";

/**
 * Listing Price DTO
 */
export class ListingPriceDto {
  @ApiProperty({
    description: "Currency code",
    example: "USD",
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: "Price amount (in cents or smallest unit)",
    example: 49950,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}

/**
 * Listing Location DTO
 */
export class ListingLocationDto {
  @ApiProperty({
    description: "City",
    example: "Fremont",
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: "State/Province",
    example: "CA",
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: "Country name",
    example: "USA",
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: "ISO country code",
    example: "US",
  })
  @IsString()
  countryCode: string;
}

/**
 * Listing Mileage DTO
 */
export class ListingMileageDto {
  @ApiProperty({
    description: "Mileage value",
    example: 25583,
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({
    description: "Mileage unit",
    enum: ["miles", "km"],
    example: "miles",
  })
  @IsString()
  unit: "miles" | "km";
}

/**
 * Listing Lease DTO
 */
export class ListingLeaseDto {
  @ApiProperty({
    description: "Is vehicle leased",
    example: false,
  })
  @IsBoolean()
  isLeased: boolean;

  @ApiProperty({
    description: "Months remaining on lease",
    example: 0,
  })
  @IsInt()
  @Min(0)
  monthsRemaining: number;
}

/**
 * Listing State DTO
 */
export class ListingStateDto {
  @ApiProperty({
    description: "Vehicle condition taxonomy ID (from /taxonomies/vehicleCondition)",
    example: "Excellent",
  })
  @IsString()
  condition: string;

  @ApiProperty({
    description: "Current mileage",
  })
  @ValidateNested()
  @Type(() => ListingMileageDto)
  mileage: ListingMileageDto;

  @ApiProperty({
    description: "Title status (clean, salvage, etc.)",
    example: "clean",
  })
  @IsString()
  titleStatus: string;

  @ApiProperty({
    description: "Number of previous owners",
    example: 1,
  })
  @IsInt()
  @Min(0)
  previousOwners: number;

  @ApiProperty({
    description: "Insurance category taxonomy ID",
    example: "Unspecified",
  })
  @IsString()
  insuranceCategory: string;

  @ApiProperty({
    description: "Lease information",
  })
  @ValidateNested()
  @Type(() => ListingLeaseDto)
  lease: ListingLeaseDto;
}

/**
 * Create Listing Unified DTO
 * Single payload for creating both vehicle and listing
 */
export class CreateListingUnifiedDto {
  // ========== VEHICLE DATA (for vehicles container) ==========
  @ApiProperty({
    description: "Vehicle data (will be upserted in vehicles container)",
  })
  @ValidateNested()
  @Type(() => CreateVehicleDto)
  vehicle: CreateVehicleDto;

  // ========== LISTING DATA (for listings container) ==========
  @ApiPropertyOptional({
    description: "Seller ID (defaults to authenticated user)",
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiPropertyOptional({
    description: "Seller type",
    enum: ["dealer", "private"],
    example: "dealer",
  })
  @IsString()
  @IsOptional()
  sellerType?: "dealer" | "private";

  @ApiPropertyOptional({
    description: "Seller display name",
    example: "Tesla Fremont Inc.",
  })
  @IsString()
  @IsOptional()
  sellerDisplayName?: string;

  @ApiProperty({
    description: "Listing status (from /taxonomies/listingStatus)",
    example: "Published",
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: "Sale type taxonomy ID (from /taxonomies/saleTypes)",
    example: "ForSale",
  })
  @IsString()
  saleTypes: string; // Note: singular field, plural name (matches spec)

  @ApiProperty({
    description: "Publish type taxonomy ID (from /taxonomies/publishTypes)",
    example: "WholeSale",
  })
  @IsString()
  publishTypes: string; // Note: singular field, plural name (matches spec)

  @ApiProperty({
    description: "Price information",
  })
  @ValidateNested()
  @Type(() => ListingPriceDto)
  price: ListingPriceDto;

  @ApiProperty({
    description: "Location information",
  })
  @ValidateNested()
  @Type(() => ListingLocationDto)
  location: ListingLocationDto;

  @ApiProperty({
    description: "Listing-level vehicle state (condition, mileage, etc.)",
  })
  @ValidateNested()
  @Type(() => ListingStateDto)
  state: ListingStateDto;

  @ApiPropertyOptional({
    description: "Listing title",
    example: "2016 Tesla Model X 90D – Red Multi Coat Paint",
  })
  @IsString()
  @IsOptional()
  contentTitle?: string;

  @ApiPropertyOptional({
    description: "Listing description",
    example: "2016 Tesla Model X 90D with Autopilot...",
  })
  @IsString()
  @IsOptional()
  contentDescription?: string;

  @ApiPropertyOptional({
    description: "Market source",
    enum: ["web", "user", "phone", "kyc"],
    example: "web",
  })
  @IsString()
  @IsOptional()
  marketSource?: "web" | "user" | "phone" | "kyc";

  @ApiPropertyOptional({
    description: "Allowed countries for visibility",
    type: [String],
    example: ["US"],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedCountries?: string[];
}
