import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * Sign Up Dealer User Request DTO
 */
export class SignUpDealerDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Smith',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.smith@dealers.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(254)
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+15559876543',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Business address',
    example: '123 Main Street, City, State',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Password',
    example: 'StrongPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Password confirmation',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({
    description: 'Who are you representing (e.g., "dealer_group")',
    example: 'dealer_group',
  })
  @IsString()
  @IsNotEmpty()
  whoAreYouRepresenting: string;

  @ApiProperty({
    description: 'Group name (required when representing dealer_group)',
    example: 'Premium EV Dealers Group',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  groupName?: string;

  @ApiProperty({
    description: 'Number of rooftops',
    example: '4',
    required: false,
  })
  @IsString()
  rooftop?: string;

  @ApiProperty({
    description: 'Business type',
    example: 'used_tesla_dealer',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  businessType: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Premium Used Tesla',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Syndication system',
    example: 'internal_crm',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  syndicationSystem: string;

  @ApiProperty({
    description: 'Is owner of the business',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  owner: boolean;

  @ApiProperty({
    description: 'Business site locations (1-20 locations)',
    example: ['Downtown branch - 123 Main Street', 'Airport branch - Terminal Road'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsNotEmpty()
  businessSiteLocations: string[];

  @ApiProperty({
    description: 'Stripe subscription product IDs (at least 1)',
    example: ['prod_dealer_wholesale', 'prod_dealer_advertisement'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty()
  subscriptionIds: string[];

  @ApiProperty({
    description: 'Must accept terms of service',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  acceptTermsOfService: boolean;
}
