import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, ArrayMinSize, MinLength } from "class-validator";

/**
 * Check Permission DTO
 * Used for POST /rbac/check
 */
export class CheckPermissionDto {
  @ApiProperty({
    description: "User ID to check permissions for",
    example: "user_abc123",
  })
  @IsString()
  @MinLength(1)
  userId: string;

  @ApiProperty({
    description: "Permission to check",
    example: "perm_manage_listings",
  })
  @IsString()
  @MinLength(1)
  permission: string;
}

/**
 * Check Permissions Batch DTO
 * Used for POST /rbac/check/batch
 */
export class CheckPermissionsBatchDto {
  @ApiProperty({
    description: "User ID to check permissions for",
    example: "user_abc123",
  })
  @IsString()
  @MinLength(1)
  userId: string;

  @ApiProperty({
    description: "Array of permissions to check",
    example: [
      "perm_manage_listings",
      "perm_manage_users",
      "perm_view_analytics",
    ],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissions: string[];
}
