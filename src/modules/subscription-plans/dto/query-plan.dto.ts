import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsEnum, IsBoolean, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class QuerySubscriptionPlansDto {
  @ApiProperty({
    description: "Filter by plan category",
    enum: ["cashoffer", "dealer_wholesale", "dealer_advertising"],
    required: false,
    example: "cashoffer",
  })
  @IsEnum(["cashoffer", "dealer_wholesale", "dealer_advertising"])
  @IsOptional()
  category?: "cashoffer" | "dealer_wholesale" | "dealer_advertising";

  @ApiProperty({
    description: "Filter by active status",
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    description: "Filter by billing cycle",
    enum: ["monthly", "yearly"],
    required: false,
    example: "monthly",
  })
  @IsEnum(["monthly", "yearly"])
  @IsOptional()
  billingCycle?: "monthly" | "yearly";

  @ApiProperty({
    description: "Page number for pagination",
    required: false,
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: "Number of items per page",
    required: false,
    example: 20,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;

  @ApiProperty({
    description: "Continuation token for cursor-based pagination",
    required: false,
  })
  @IsOptional()
  cursor?: string;
}
