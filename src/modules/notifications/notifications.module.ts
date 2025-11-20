import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { CosmosService } from '@/common/services/cosmos.service';

/**
 * Notifications Module
 * Manages multi-channel notifications and user preferences
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, CosmosService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
