import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { InvoiceStatus } from "../interfaces/subscription-invoice.interface";

export class QuerySubscriptionInvoicesDto {
  @ApiProperty({
    description: "Filter by seller ID",
    required: false,
    example: "dealer_123",
  })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({
    description: "Filter by subscription ID",
    required: false,
    example: "sub_001",
  })
  @IsString()
  @IsOptional()
  subscriptionId?: string;

  @ApiProperty({
    description: "Filter by invoice status",
    enum: InvoiceStatus,
    required: false,
    example: InvoiceStatus.PAID,
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({
    description: "Filter by billing period start date (from)",
    required: false,
    example: "2025-09-01T00:00:00Z",
  })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiProperty({
    description: "Filter by billing period end date (to)",
    required: false,
    example: "2025-12-31T23:59:59Z",
  })
  @IsString()
  @IsOptional()
  to?: string;

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
