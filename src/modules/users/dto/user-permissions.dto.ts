import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

/**
 * Update User Permissions DTO (Admin Only)
 */
export class UpdateUserPermissionsDto {
  @ApiProperty({
    description: 'Array of custom permission keys to assign to user',
    example: ['perm_manage_inventory', 'perm_export_data'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  customPermissions: string[];
}
