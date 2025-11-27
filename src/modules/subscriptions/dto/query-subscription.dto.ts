import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

/**
 * Query Subscriptions DTO
 * Used for GET /subscriptions
 */
export class QuerySubscriptionsDto {
  @ApiProperty({
    description: "Filter by user ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: "Filter by seller ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({
    description: "Filter by subscription category",
    enum: ["cashoffer", "dealer_wholesale", "dealer_advertising"],
    required: false,
  })
  @IsEnum(["cashoffer", "dealer_wholesale", "dealer_advertising"])
  @IsOptional()
  category?: "cashoffer" | "dealer_wholesale" | "dealer_advertising";

  @ApiProperty({
    description: "Filter by subscription state",
    enum: [
      "incomplete",
      "incomplete_expired",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
    ],
    required: false,
  })
  @IsEnum([
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
  ])
  @IsOptional()
  state?:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid";

  @ApiProperty({
    description: "Number of items per page (1-100)",
    example: 20,
    required: false,
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

/**
 * Query Invoices DTO
 * Used for GET /subscriptions/:id/invoices
 */
export class QueryInvoicesDto {
  @ApiProperty({
    description: "Filter by payment status",
    enum: ["draft", "open", "paid", "uncollectible", "void"],
    required: false,
  })
  @IsEnum(["draft", "open", "paid", "uncollectible", "void"])
  @IsOptional()
  status?: "draft" | "open" | "paid" | "uncollectible" | "void";

  @ApiProperty({
    description: "Number of items per page (1-100)",
    example: 20,
    required: false,
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
