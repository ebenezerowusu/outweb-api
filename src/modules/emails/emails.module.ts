import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EmailsController } from "./emails.controller";
import { EmailsService } from "./emails.service";

/**
 * Emails Module
 * Handles email sending via SendGrid with template support
 */
@Module({
  imports: [ConfigModule],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
