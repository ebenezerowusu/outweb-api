import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsISO8601,
  IsObject,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderState, DeliveryMethod } from '../interfaces/order.interface';

/**
 * DTO for updating order status
 */
export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order state',
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
  state: OrderState;

  @ApiPropertyOptional({ description: 'Substatus for additional context' })
  @IsString()
  @IsOptional()
  substatus?: string;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * DTO for canceling an order
 */
export class CancelOrderDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Whether to issue a refund', default: false })
  @IsBoolean()
  @IsOptional()
  issueRefund?: boolean;

  @ApiPropertyOptional({ description: 'Refund amount (if different from deposit)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  refundAmount?: number;
}

/**
 * DTO for scheduling inspection
 */
export class ScheduleInspectionDto {
  @ApiProperty({ description: 'Scheduled inspection date/time', example: '2024-01-15T10:00:00Z' })
  @IsISO8601()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Inspection location or instructions' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Inspector name or company' })
  @IsString()
  @IsOptional()
  inspector?: string;
}

/**
 * DTO for completing inspection
 */
export class CompleteInspectionDto {
  @ApiProperty({ description: 'Whether inspection passed', example: true })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ description: 'Inspection findings or notes' })
  @IsString()
  @IsOptional()
  findings?: string;

  @ApiPropertyOptional({ description: 'Inspection report document URL' })
  @IsString()
  @IsOptional()
  reportUrl?: string;
}

/**
 * DTO for updating delivery information
 */
export class UpdateDeliveryDto {
  @ApiPropertyOptional({ description: 'Delivery method', enum: ['pickup', 'delivery', 'shipping'] })
  @IsEnum(['pickup', 'delivery', 'shipping'])
  @IsOptional()
  deliveryMethod?: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Delivery address' })
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateDeliveryAddressDto)
  @IsOptional()
  deliveryAddress?: UpdateDeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Scheduled delivery date', example: '2024-01-20T09:00:00Z' })
  @IsISO8601()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Estimated arrival date', example: '2024-01-22T14:00:00Z' })
  @IsISO8601()
  @IsOptional()
  estimatedArrival?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier name' })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;
}

export class UpdateDeliveryAddressDto {
  @ApiPropertyOptional({ description: 'Street address' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country code' })
  @IsString()
  @IsOptional()
  country?: string;
}

/**
 * DTO for adding notes to an order
 */
export class AddOrderNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Whether note is internal only (not visible to buyer)', default: false })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}

/**
 * DTO for adding documents to an order
 */
export class AddOrderDocumentDto {
  @ApiProperty({ description: 'Document type', example: 'contract' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Document name', example: 'Purchase Agreement.pdf' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Document URL' })
  @IsString()
  url: string;
}
