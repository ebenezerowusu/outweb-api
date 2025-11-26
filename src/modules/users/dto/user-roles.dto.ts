import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, ArrayMinSize } from "class-validator";

/**
 * User Role Item
 */
export class UserRoleItem {
  @ApiProperty({
    description: "Role ID",
    example: "role_buyer",
  })
  @IsString()
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
  roles: UserRoleItem[];
}
