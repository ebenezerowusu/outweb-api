import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Query Users DTO
 * Used for filtering and pagination in GET /users
 */
export class QueryUsersDto {
  @ApiProperty({
    description: "Filter by email (supports wildcards with ilike)",
    example: "akua.mensah@gmail.com",
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "Filter by username",
    example: "akuamensah",
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: "Filter by active status",
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: "Filter by blocked status",
    example: false,
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  blocked?: boolean;

  @ApiProperty({
    description: "Filter by role ID",
    example: "role_admin",
    required: false,
  })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    description: "Number of items per page (1-100)",
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: "Continuation token from previous page",
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}
