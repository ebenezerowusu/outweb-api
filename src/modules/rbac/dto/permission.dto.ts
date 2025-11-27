import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  Length,
  MaxLength,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Create Permission DTO
 */
export class CreatePermissionDto {
  @ApiProperty({
    description: "Permission ID (optional, will be generated if not provided)",
    example: "perm_export_inventory",
    required: false,
    pattern: "^perm_[a-z0-9_]+$",
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^perm_[a-z0-9_]+$/, {
    message: "Permission ID must match pattern: perm_[a-z0-9_]+",
  })
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: "Permission category",
    example: "listings",
    examples: ["listings", "dealer", "admin"],
  })
  @IsString()
  @Length(3, 50)
  category: string;

  @ApiProperty({
    description: "Permission name (must be unique)",
    example: "listings.inventory.export",
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    description: "Permission description",
    example: "Export vehicle inventory to CSV",
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @Length(3, 255)
  description: string;
}

/**
 * Update Permission DTO
 */
export class UpdatePermissionDto {
  @ApiProperty({
    description: "Updated permission category",
    required: false,
    example: "admin",
  })
  @IsString()
  @Length(3, 50)
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: "Updated permission name",
    required: false,
    example: "listings.inventory.export.advanced",
  })
  @IsString()
  @Length(3, 100)
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "Updated permission description",
    required: false,
    example: "Export vehicle inventory to CSV with advanced filters",
  })
  @IsString()
  @Length(3, 255)
  @IsOptional()
  description?: string;
}

/**
 * Query Permissions DTO
 */
export class QueryPermissionsDto {
  @ApiProperty({
    description: "Filter by permission category",
    required: false,
    example: "listings",
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: "Filter by permission name (prefix or exact match)",
    required: false,
    example: "listings.",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "Number of items per page (1-100)",
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: "Continuation token for pagination",
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}
