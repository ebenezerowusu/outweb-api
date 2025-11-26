import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsInt,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Create Listing Vehicle DTO
 */
export class CreateListingVehicleDto {
  @ApiProperty({
    description: "VIN (17 characters)",
    example: "5YJ3E1EA1KF123456",
  })
  @IsString()
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
    message: "VIN must be 17 alphanumeric characters",
  })
  vin: string;

  @ApiProperty({
    description: "Vehicle make taxonomy ID",
    example: "tax_make_tesla",
  })
  @IsString()
  makeId: string;

  @ApiProperty({
    description: "Vehicle model taxonomy ID",
    example: "tax_model_model3",
  })
  @IsString()
  modelId: string;

  @ApiProperty({ description: "Vehicle trim taxonomy ID", required: false })
  @IsString()
  @IsOptional()
  trimId?: string;

  @ApiProperty({
    description: "Manufacturing year",
    example: 2021,
    minimum: 2008,
    maximum: 2030,
  })
  @IsInt()
  @Min(2008)
  @Max(2030)
  year: number;

  @ApiProperty({ description: "Current mileage", example: 15000, minimum: 0 })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ description: "Exterior color taxonomy ID" })
  @IsString()
  exteriorColorId: string;

  @ApiProperty({ description: "Interior color taxonomy ID" })
  @IsString()
  interiorColorId: string;

  @ApiProperty({ description: "Body type taxonomy ID" })
  @IsString()
  bodyTypeId: string;

  @ApiProperty({ description: "Drivetrain taxonomy ID" })
  @IsString()
  drivetrainId: string;

  @ApiProperty({ description: "Battery size taxonomy ID", required: false })
  @IsString()
  @IsOptional()
  batterySizeId?: string;

  @ApiProperty({
    description: "Battery health percentage (0-100)",
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  batteryHealth?: number;

  @ApiProperty({ description: "Estimated range in miles", required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  range?: number;

  @ApiProperty({ description: "Autopilot version", required: false })
  @IsString()
  @IsOptional()
  autopilotVersion?: string;

  @ApiProperty({ description: "Full Self-Driving capable", required: false })
  @IsBoolean()
  @IsOptional()
  fsdCapable?: boolean;

  @ApiProperty({ description: "Additional specifications", required: false })
  @IsOptional()
  specifications?: Record<string, any>;
}

/**
 * Create Listing Pricing DTO
 */
export class CreateListingPricingDto {
  @ApiProperty({ description: "List price in cents", example: 4500000 })
  @IsInt()
  @Min(0)
  listPrice: number;

  @ApiProperty({ description: "Original MSRP in cents", required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @ApiProperty({ description: "Currency code", example: "USD", default: "USD" })
  @IsString()
  @IsOptional()
  currency?: string = "USD";

  @ApiProperty({ description: "Price is negotiable", default: true })
  @IsBoolean()
  @IsOptional()
  negotiable?: boolean = true;

  @ApiProperty({ description: "Accepts offers", default: true })
  @IsBoolean()
  @IsOptional()
  acceptsOffers?: boolean = true;

  @ApiProperty({ description: "Trade-in accepted", default: false })
  @IsBoolean()
  @IsOptional()
  tradeinAccepted?: boolean = false;

  @ApiProperty({ description: "Financing available", default: false })
  @IsBoolean()
  @IsOptional()
  financingAvailable?: boolean = false;
}

/**
 * Create Listing Location DTO
 */
export class CreateListingLocationDto {
  @ApiProperty({ description: "Country code", example: "US" })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string;

  @ApiProperty({ description: "State", example: "CA" })
  @IsString()
  state: string;

  @ApiProperty({ description: "City", example: "Los Angeles" })
  @IsString()
  city: string;

  @ApiProperty({ description: "ZIP code", example: "90001" })
  @IsString()
  zipCode: string;

  @ApiProperty({ description: "Latitude", required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: "Longitude", required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

/**
 * Create Listing Condition DTO
 */
export class CreateListingConditionDto {
  @ApiProperty({
    description: "Overall condition",
    enum: ["excellent", "good", "fair", "needs_work"],
    example: "excellent",
  })
  @IsEnum(["excellent", "good", "fair", "needs_work"])
  overall: "excellent" | "good" | "fair" | "needs_work";

  @ApiProperty({
    description: "Exterior rating (1-10)",
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  exteriorRating: number;

  @ApiProperty({
    description: "Interior rating (1-10)",
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  interiorRating: number;

  @ApiProperty({
    description: "Mechanical rating (1-10)",
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  mechanicalRating: number;

  @ApiProperty({
    description: "Condition description",
    example: "Excellent condition, well maintained",
  })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: "Known issues", type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownIssues?: string[];

  @ApiProperty({
    description: "Modifications",
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modifications?: string[];
}

/**
 * Create Listing DTO
 * Used for POST /listings
 */
export class CreateListingDto {
  @ApiProperty({
    description: "Seller ID (optional, defaults to current user)",
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({ description: "Vehicle information" })
  @ValidateNested()
  @Type(() => CreateListingVehicleDto)
  vehicle: CreateListingVehicleDto;

  @ApiProperty({ description: "Pricing information" })
  @ValidateNested()
  @Type(() => CreateListingPricingDto)
  pricing: CreateListingPricingDto;

  @ApiProperty({ description: "Location information" })
  @ValidateNested()
  @Type(() => CreateListingLocationDto)
  location: CreateListingLocationDto;

  @ApiProperty({ description: "Condition information" })
  @ValidateNested()
  @Type(() => CreateListingConditionDto)
  condition: CreateListingConditionDto;

  @ApiProperty({
    description: "Standard features (taxonomy IDs)",
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  standardFeatures?: string[];

  @ApiProperty({
    description: "Optional features (taxonomy IDs)",
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  optionalFeatures?: string[];

  @ApiProperty({
    description: "Highlight features",
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  highlights?: string[];
}
