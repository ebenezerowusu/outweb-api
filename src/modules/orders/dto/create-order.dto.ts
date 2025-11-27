import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  Min,
  IsISO8601,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DeliveryMethod } from "../interfaces/order.interface";

/**
 * DTO for delivery address
 */
export class CreateDeliveryAddressDto {
  @ApiProperty({ description: "Street address" })
  @IsString()
  street: string;

  @ApiProperty({ description: "City" })
  @IsString()
  city: string;

  @ApiProperty({ description: "State/Province" })
  @IsString()
  state: string;

  @ApiProperty({ description: "Postal code" })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: "Country code", example: "US" })
  @IsString()
  country: string;
}

/**
 * DTO for creating a new order
 */
export class CreateOrderDto {
  @ApiProperty({ description: "Listing ID to purchase" })
  @IsString()
  listingId: string;

  @ApiProperty({ description: "Agreed purchase price", example: 45000 })
  @IsNumber()
  @Min(0)
  agreedPrice: number;

  @ApiProperty({ description: "Deposit amount", example: 2000 })
  @IsNumber()
  @Min(0)
  depositAmount: number;

  @ApiPropertyOptional({
    description: "Delivery method",
    enum: ["pickup", "delivery", "shipping"],
  })
  @IsEnum(["pickup", "delivery", "shipping"])
  @IsOptional()
  deliveryMethod?: DeliveryMethod;

  @ApiPropertyOptional({
    description: "Delivery address",
    type: CreateDeliveryAddressDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CreateDeliveryAddressDto)
  @IsOptional()
  deliveryAddress?: CreateDeliveryAddressDto;

  @ApiPropertyOptional({ description: "Special delivery instructions" })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: "Buyer notes or comments" })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for creating an order transaction
 */
export class CreateOrderTransactionDto {
  @ApiProperty({ description: "Order ID" })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: "Transaction type",
    enum: ["deposit", "balance", "refund", "fee", "tax"],
  })
  @IsEnum(["deposit", "balance", "refund", "fee", "tax"])
  transactionType: "deposit" | "balance" | "refund" | "fee" | "tax";

  @ApiProperty({ description: "Transaction amount", example: 2000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: "Payment intent ID from Stripe" })
  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
