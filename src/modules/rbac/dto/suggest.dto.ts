import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Suggest Permissions DTO
 * Used for GET /rbac/permissions/suggest
 */
export class SuggestPermissionsDto {
  @ApiProperty({
    description: 'Search query for permission suggestions',
    example: 'manage',
    required: false,
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    description: 'Limit number of suggestions',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;
}

/**
 * Suggest Roles DTO
 * Used for GET /rbac/roles/suggest
 */
export class SuggestRolesDto {
  @ApiProperty({
    description: 'Search query for role suggestions',
    example: 'admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    description: 'Limit number of suggestions',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;
}
