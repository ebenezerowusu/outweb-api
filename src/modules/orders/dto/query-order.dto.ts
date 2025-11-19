import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderState, TransactionType, TransactionState } from '../interfaces/order.interface';

/**
 * DTO for querying orders
 */
export class QueryOrdersDto {
  @ApiPropertyOptional({ description: 'Filter by buyer ID' })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiPropertyOptional({ description: 'Filter by seller ID' })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Filter by listing ID' })
  @IsString()
  @IsOptional()
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order state',
    enum: [
      'pending_deposit',
      'deposit_paid',
      'inspection_scheduled',
      'inspection_completed',
      'pending_payment',
      'payment_completed',
      'ready_for_delivery',
      'in_transit',
      'delivered',
      'completed',
      'canceled',
      'disputed',
    ],
  })
  @IsEnum([
    'pending_deposit',
    'deposit_paid',
    'inspection_scheduled',
    'inspection_completed',
    'pending_payment',
    'payment_completed',
    'ready_for_delivery',
    'in_transit',
    'delivered',
    'completed',
    'canceled',
    'disputed',
  ])
  @IsOptional()
  state?: OrderState;

  @ApiPropertyOptional({ description: 'Filter by VIN (last 4 digits)', example: '1234' })
  @IsString()
  @IsOptional()
  vinLastFour?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'updatedAt', 'totalAmount'], default: 'createdAt' })
  @IsEnum(['createdAt', 'updatedAt', 'totalAmount'])
  @IsOptional()
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Continuation token for pagination' })
  @IsString()
  @IsOptional()
  continuationToken?: string;
}

/**
 * DTO for querying order transactions
 */
export class QueryOrderTransactionsDto {
  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: ['deposit', 'balance', 'refund', 'fee', 'tax'],
  })
  @IsEnum(['deposit', 'balance', 'refund', 'fee', 'tax'])
  @IsOptional()
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by transaction state',
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'],
  })
  @IsEnum(['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'])
  @IsOptional()
  state?: TransactionState;

  @ApiPropertyOptional({ description: 'Filter by payment provider', enum: ['stripe', 'manual', 'other'] })
  @IsEnum(['stripe', 'manual', 'other'])
  @IsOptional()
  provider?: 'stripe' | 'manual' | 'other';

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'amount'], default: 'createdAt' })
  @IsEnum(['createdAt', 'amount'])
  @IsOptional()
  sortBy?: 'createdAt' | 'amount';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Continuation token for pagination' })
  @IsString()
  @IsOptional()
  continuationToken?: string;
}
