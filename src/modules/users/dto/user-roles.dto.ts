import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsString,
  ArrayMinSize,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * User Role Item
 */
export class UserRoleItem {
  @ApiProperty({
    description: "Role ID",
    example: "role_private",
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}

/**
 * Update User Roles DTO (Admin Only)
 */
export class UpdateUserRolesDto {
  @ApiProperty({
    description: "Array of roles to assign to user (at least one required)",
    example: [{ roleId: "role_private" }, { roleId: "role_dealer" }],
    type: [UserRoleItem],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UserRoleItem)
  roles: UserRoleItem[];
}
