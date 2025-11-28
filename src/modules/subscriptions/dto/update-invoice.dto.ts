import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { InvoiceStatus } from "../interfaces/subscription-invoice.interface";

/**
 * Update Subscription Invoice DTO
 * Used to update invoice status (e.g., from webhook events)
 */
export class UpdateSubscriptionInvoiceDto {
  @ApiProperty({
    description: "Updated invoice status",
    enum: InvoiceStatus,
    example: InvoiceStatus.PAID,
    required: false,
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
