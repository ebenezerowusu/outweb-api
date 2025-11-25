import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { CosmosService } from '@/common/services/cosmos.service';
import { EmailService } from '@/common/services/email.service';

/**
 * Notifications Module
 * Manages multi-channel notifications and user preferences
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, CosmosService, EmailService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
