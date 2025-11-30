import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsInt, IsOptional, Min, Max } from "class-validator";
import { Type } from "class-transformer";

/**
 * Query Vehicles DTO
 * Used for filtering and pagination
 */
export class QueryVehicleDto {
  @ApiPropertyOptional({
    description: "Filter by VIN",
    example: "5YJXCBE29GF012345",
  })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiPropertyOptional({
    description: "Filter by make",
    example: "Tesla",
  })
  @IsString()
  @IsOptional()
  make?: string;

  @ApiPropertyOptional({
    description: "Filter by model",
    example: "Model X",
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: "Filter by year",
    example: 2016,
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: "Page number",
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    example: 20,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
