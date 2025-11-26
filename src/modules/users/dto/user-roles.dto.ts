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
    description: "Array of roles to assign to user",
    example: [{ roleId: "role_buyer" }, { roleId: "role_seller" }],
    type: [UserRoleItem],
  })
  @IsArray()
  @ArrayMinSize(0)
  roles: UserRoleItem[];
}
