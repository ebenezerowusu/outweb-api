import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class PriceDetailsDto {
  @ApiProperty({
    description: "Currency code",
    example: "USD",
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: "Amount in minor units (cents)",
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: "Whether amount is in minor units",
    example: true,
  })
  @IsBoolean()
  minorUnit: boolean;
}

class StripeDetailsDto {
  @ApiProperty({
    description: "Stripe Price ID for monthly billing",
    example: "price_cashoffer_monthly",
  })
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @ApiProperty({
    description: "Stripe Product ID",
    example: "prod_cashoffer",
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: "Stripe Price ID for yearly billing",
    example: "price_cashoffer_yearly",
    required: false,
  })
  @IsString()
  @IsOptional()
  yearlyPriceId?: string | null;

  @ApiProperty({
    description: "Stripe Product ID for yearly billing",
    example: "prod_cashoffer_yearly",
    required: false,
  })
  @IsString()
  @IsOptional()
  yearlyProductId?: string | null;
}

class BillingDetailsDto {
  @ApiProperty({
    description: "Current active billing cycle",
    enum: ["monthly", "yearly"],
    example: "monthly",
  })
  @IsEnum(["monthly", "yearly"])
  cycle: "monthly" | "yearly";

  @ApiProperty({
    description: "Supported billing cycles",
    type: [String],
    example: ["monthly", "yearly"],
  })
  @IsArray()
  @IsEnum(["monthly", "yearly"], { each: true })
  supportedCycles: ("monthly" | "yearly")[];

  @ApiProperty({
    description: "Number of trial days",
    example: 14,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  trialDays: number;

  @ApiProperty({
    description: "Stripe integration details",
    type: StripeDetailsDto,
  })
  @ValidateNested()
  @Type(() => StripeDetailsDto)
  stripe: StripeDetailsDto;
}

class UIDetailsDto {
  @ApiProperty({
    description: "Display order in UI (lower numbers appear first)",
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  sortOrder: number;

  @ApiProperty({
    description: "UI badge/label",
    example: "Cash Offers",
  })
  @IsString()
  @IsNotEmpty()
  badge: string;
}

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: "Unique plan ID",
    example: "plan_cashoffer",
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "Plan name",
    example: "Cash offer",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Plan description",
    example: "Subscription for accessing instant CashOffer leads and tools.",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "Plan category",
    enum: ["cashoffer", "dealer_wholesale", "dealer_advertising"],
    example: "cashoffer",
  })
  @IsEnum(["cashoffer", "dealer_wholesale", "dealer_advertising"])
  category: "cashoffer" | "dealer_wholesale" | "dealer_advertising";

  @ApiProperty({
    description: "Pricing details",
    type: PriceDetailsDto,
  })
  @ValidateNested()
  @Type(() => PriceDetailsDto)
  price: PriceDetailsDto;

  @ApiProperty({
    description: "Billing details",
    type: BillingDetailsDto,
  })
  @ValidateNested()
  @Type(() => BillingDetailsDto)
  billing: BillingDetailsDto;

  @ApiProperty({
    description: "List of plan features",
    type: [String],
    example: [
      "Access to CashOffer leads",
      "Receive instant cash offers from qualified dealers",
    ],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({
    description: "UI configuration",
    type: UIDetailsDto,
  })
  @ValidateNested()
  @Type(() => UIDetailsDto)
  ui: UIDetailsDto;

  @ApiProperty({
    description: "Whether plan is active and available for subscription",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
