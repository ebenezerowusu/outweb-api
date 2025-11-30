import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Vehicle Specification DTO
 */
export class VehicleSpecificationDto {
  @ApiProperty({
    description: "Exterior color",
    example: "Red Multi-Coat",
  })
  @IsString()
  exteriorColor: string;

  @ApiProperty({
    description: "Interior color",
    example: "Tan Leather",
  })
  @IsString()
  interiorColor: string;

  @ApiProperty({
    description: "Seat configuration",
    example: "6 Seat Interior",
  })
  @IsString()
  seatConfiguration: string;

  @ApiProperty({
    description: "Number of doors",
    example: 5,
  })
  @IsInt()
  @Min(2)
  @Max(6)
  doors: number;

  @ApiProperty({
    description: "Number of seats",
    example: 6,
  })
  @IsInt()
  @Min(2)
  @Max(7)
  seats: number;

  @ApiProperty({
    description: "Steering wheel type",
    enum: ["Round", "Yoke"],
    example: "Round",
  })
  @IsEnum(["Round", "Yoke"])
  steeringWheel: "Round" | "Yoke";
}

/**
 * Vehicle Charging DTO
 */
export class VehicleChargingDto {
  @ApiProperty({
    description: "Charger type",
    example: "Supercharger",
  })
  @IsString()
  chargerType: string;

  @ApiProperty({
    description: "Charging port type",
    example: "Type 2",
  })
  @IsString()
  chargingPort: string;

  @ApiProperty({
    description: "Full charge time in hours",
    example: 1.2,
  })
  @IsNumber()
  @Min(0)
  chargeTimeHrs: number;

  @ApiProperty({
    description: "Quick charge time in minutes",
    example: 30,
  })
  @IsInt()
  @Min(0)
  quickChargeTimeMins: number;
}

/**
 * Vehicle Battery DTO
 */
export class VehicleBatteryDto {
  @ApiProperty({
    description: "Battery capacity in kWh",
    example: 90,
  })
  @IsNumber()
  @Min(0)
  capacityKWh: number;

  @ApiProperty({
    description: "EPA estimated range in miles",
    example: 257,
  })
  @IsInt()
  @Min(0)
  rangeEPA: number;

  @ApiProperty({
    description: "Battery health status",
    enum: ["Excellent", "Good", "Average", "Fair", "Poor"],
    example: "Good",
  })
  @IsEnum(["Excellent", "Good", "Average", "Fair", "Poor"])
  batteryHealth: "Excellent" | "Good" | "Average" | "Fair" | "Poor";

  @ApiProperty({
    description: "Charging information",
  })
  @ValidateNested()
  @Type(() => VehicleChargingDto)
  charging: VehicleChargingDto;
}

/**
 * Vehicle Performance DTO
 */
export class VehiclePerformanceDto {
  @ApiProperty({
    description: "Engine power in HP",
    example: 518,
  })
  @IsInt()
  @Min(0)
  enginePowerHP: number;

  @ApiProperty({
    description: "Acceleration (0-60 mph)",
    example: "0-60 in 3.8s",
  })
  @IsString()
  acceleration: string;

  @ApiProperty({
    description: "Drive train",
    example: "AWD",
  })
  @IsString()
  driveTrain: string;

  @ApiProperty({
    description: "Transmission type",
    example: "1-speed automatic",
  })
  @IsString()
  transmission: string;

  @ApiProperty({
    description: "Top speed in mph",
    example: 155,
  })
  @IsInt()
  @Min(0)
  topSpeedMph: number;
}

/**
 * Vehicle Features DTO
 */
export class VehicleFeaturesDto {
  @ApiProperty({
    description: "Autopilot version",
    example: "AP1",
  })
  @IsString()
  autopilot: string;

  @ApiProperty({
    description: "Has autopilot",
    example: true,
  })
  @IsBoolean()
  hasAutopilot: boolean;

  @ApiProperty({
    description: "Has warranty",
    example: false,
  })
  @IsBoolean()
  hasWarranty: boolean;

  @ApiProperty({
    description: "Has Full Self-Driving",
    example: false,
  })
  @IsBoolean()
  IsFullSelfDriving: boolean;

  @ApiProperty({
    description: "Has premium package",
    example: true,
  })
  @IsBoolean()
  premiumPackage: boolean;

  @ApiProperty({
    description: "Wheel type",
    example: "22\" Turbine Wheels",
  })
  @IsString()
  wheels: string;

  @ApiProperty({
    description: "Has satellite navigation",
    example: true,
  })
  @IsBoolean()
  satNav: boolean;

  @ApiProperty({
    description: "Has cruise control",
    example: true,
  })
  @IsBoolean()
  cruiseControl: boolean;

  @ApiPropertyOptional({
    description: "Extra features",
    type: [String],
    example: ["Smart Air Suspension", "Cold Weather Package"],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  extras?: string[];
}

/**
 * Vehicle External References DTO
 */
export class VehicleExternalRefsDto {
  @ApiPropertyOptional({
    description: "Carfax ID",
    example: "cf_12345",
  })
  @IsString()
  @IsOptional()
  carfaxId?: string | null;

  @ApiPropertyOptional({
    description: "AutoTrader ID",
    example: "at_7890",
  })
  @IsString()
  @IsOptional()
  autotraderId?: string | null;
}

/**
 * Vehicle Sync DTO
 */
export class VehicleSyncDto {
  @ApiProperty({
    description: "External references",
  })
  @ValidateNested()
  @Type(() => VehicleExternalRefsDto)
  externalRefs: VehicleExternalRefsDto;

  @ApiProperty({
    description: "Is duplicate record",
    example: false,
  })
  @IsBoolean()
  isDuplicate: boolean;
}

/**
 * Create Vehicle DTO
 */
export class CreateVehicleDto {
  @ApiProperty({
    description: "VIN (17 characters)",
    example: "5YJXCBE29GF012345",
  })
  @IsString()
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
    message: "VIN must be 17 alphanumeric characters",
  })
  vin: string;

  @ApiProperty({
    description: "Vehicle make",
    example: "Tesla",
  })
  @IsString()
  make: string;

  @ApiProperty({
    description: "Vehicle model",
    example: "Model X",
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: "Vehicle trim",
    example: "90D",
  })
  @IsString()
  trim: string;

  @ApiProperty({
    description: "Manufacturing year",
    example: 2016,
  })
  @IsInt()
  @Min(2008)
  @Max(2030)
  year: number;

  @ApiProperty({
    description: "Body style",
    example: "SUV",
  })
  @IsString()
  bodyStyle: string;

  @ApiProperty({
    description: "Vehicle specification",
  })
  @ValidateNested()
  @Type(() => VehicleSpecificationDto)
  specification: VehicleSpecificationDto;

  @ApiProperty({
    description: "Battery information",
  })
  @ValidateNested()
  @Type(() => VehicleBatteryDto)
  battery: VehicleBatteryDto;

  @ApiProperty({
    description: "Performance information",
  })
  @ValidateNested()
  @Type(() => VehiclePerformanceDto)
  performance: VehiclePerformanceDto;

  @ApiProperty({
    description: "Features",
  })
  @ValidateNested()
  @Type(() => VehicleFeaturesDto)
  features: VehicleFeaturesDto;

  @ApiPropertyOptional({
    description: "Sync information",
  })
  @ValidateNested()
  @Type(() => VehicleSyncDto)
  @IsOptional()
  sync?: VehicleSyncDto;

  @ApiPropertyOptional({
    description: "Tags",
    type: [String],
    example: ["Model X", "Performance"],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
