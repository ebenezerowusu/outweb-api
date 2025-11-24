import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Length,
  MaxLength,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Permission reference DTO
 */
export class RolePermissionDto {
  @ApiProperty({
    description: 'Permission ID',
    example: 'perm_create_listing',
  })
  @IsString()
  @Length(1, 64)
  key: string;

  @ApiProperty({
    description: 'Permission description (optional, will be populated from permission if missing)',
    required: false,
    example: 'Allows user to create a car listing',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;
}

/**
 * Create Role DTO
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Role ID (optional, will be generated if not provided)',
    example: 'role_moderator',
    required: false,
    pattern: '^role_[a-z0-9_]+$',
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^role_[a-z0-9_]+$/, {
    message: 'Role ID must match pattern: role_[a-z0-9_]+',
  })
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Role scope',
    enum: ['system'],
    example: 'system',
  })
  @IsEnum(['system'])
  scope: 'system';

  @ApiProperty({
    description: 'Role name (must be unique)',
    example: 'moderator',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Can moderate listings and chats',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Permissions assigned to this role',
    type: [RolePermissionDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  @IsOptional()
  permissions?: RolePermissionDto[];
}

/**
 * Update Role DTO
 */
export class UpdateRoleDto {
  @ApiProperty({
    description: 'Updated role description',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Updated permissions for the role',
    type: [RolePermissionDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  @IsOptional()
  permissions?: RolePermissionDto[];
}

/**
 * Query Roles DTO
 */
export class QueryRolesDto {
  @ApiProperty({
    description: 'Filter by role scope',
    required: false,
    enum: ['system'],
  })
  @IsEnum(['system'])
  @IsOptional()
  scope?: 'system';

  @ApiProperty({
    description: 'Filter by role name (exact or partial match)',
    required: false,
    example: 'dealer',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Number of items per page (1-100)',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: 'Continuation token for pagination',
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}

/**
 * Attach Permissions to Role DTO
 */
export class AttachPermissionsDto {
  @ApiProperty({
    description: 'Permission IDs to attach to the role',
    example: ['perm_create_listing', 'perm_edit_listing', 'perm_close_listing'],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  permissionIds: string[];
}
