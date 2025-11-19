import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEmail,
  MaxLength,
  MinLength,
  IsUrl,
  IsArray,
} from 'class-validator';

/**
 * Update User Profile DTO
 */
export class UpdateUserDto {
  @ApiProperty({
    description: 'Display name',
    example: 'Jane D.',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    description: 'First name',
    example: 'Jane',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+15550000000',
    required: false,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'ZIP/Postal code',
    example: '00233',
    required: false,
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://cdn.onlyusedtesla.com/avatars/usr_abc123.png',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'en-US',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Timezone',
    example: 'America/Los_Angeles',
    required: false,
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({
    description: 'Email notifications enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notificationsEmail?: boolean;

  @ApiProperty({
    description: 'SMS notifications enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notificationsSms?: boolean;

  @ApiProperty({
    description: 'Push notifications enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notificationsPush?: boolean;
}

/**
 * Update User Status DTO (Admin Only)
 */
export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Is user active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Is user blocked',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  blocked?: boolean;

  @ApiProperty({
    description: 'Reason for blocking',
    example: 'Violation of terms of service',
    required: false,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  blockedReason?: string;
}

/**
 * Update User Market DTO (Admin Only)
 */
export class UpdateUserMarketDto {
  @ApiProperty({
    description: 'Primary country code',
    example: 'US',
    required: false,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Allowed countries',
    example: ['US', 'CA'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedCountries?: string[];

  @ApiProperty({
    description: 'Source of country assignment',
    example: 'user|phone|kyc',
    required: false,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  source?: string;
}
