import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional } from "class-validator";

export class EmailRecipientDto {
  @ApiProperty({
    description: "Recipient email address",
    example: "jane@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Recipient name",
    example: "Jane Doe",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
