import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Refresh Token Request DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'jwt-refresh-token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
