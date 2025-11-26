import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosService } from '@/common/services/cosmos.service';
import { EmailService } from '@/common/services/email.service';
import {
  NotificationDocument,
  PublicNotification,
  NotificationPreferencesDocument,
  PublicNotificationPreferences,
  ChannelType,
  NotificationType,
  ChannelPreferences,
  CategoryPreferences,
} from './interfaces/notification.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  MarkNotificationReadDto,
  ArchiveNotificationDto,
  UpdateNotificationPreferencesDto,
} from './dto/update-notification.dto';
import { QueryNotificationsDto } from './dto/query-notification.dto';

const NOTIFICATIONS_CONTAINER = 'Notifications';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly cosmosService: CosmosService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * List notifications for a user
   */
  async findAll(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<{ items: PublicNotification[]; continuationToken?: string; unreadCount: number }> {
    const {
      notificationType,
      priority,
      read,
      archived,
      orderId,
      listingId,
      offerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      continuationToken,
    } = query;

    const conditions: string[] = ["c.type = 'notification'", 'c.userId = @userId'];
    const parameters: Array<{ name: string; value: any }> = [{ name: '@userId', value: userId }];

    if (notificationType) {
      conditions.push('c.notification.notificationType = @notificationType');
      parameters.push({ name: '@notificationType', value: notificationType });
    }

    if (priority) {
      conditions.push('c.notification.priority = @priority');
      parameters.push({ name: '@priority', value: priority });
    }

    if (read !== undefined) {
      conditions.push('c.status.read = @read');
      parameters.push({ name: '@read', value: read });
    }

    if (archived !== undefined) {
      conditions.push('c.status.archived = @archived');
      parameters.push({ name: '@archived', value: archived });
    }

    if (orderId) {
      conditions.push('c.related.orderId = @orderId');
      parameters.push({ name: '@orderId', value: orderId });
    }

    if (listingId) {
      conditions.push('c.related.listingId = @listingId');
      parameters.push({ name: '@listingId', value: listingId });
    }

    if (offerId) {
      conditions.push('c.related.offerId = @offerId');
      parameters.push({ name: '@offerId', value: offerId });
    }

    const orderByClause = `ORDER BY c.${sortBy === 'priority' ? 'notification.priority' : 'audit.createdAt'} ${sortOrder.toUpperCase()}`;
    const querySpec = `SELECT * FROM c WHERE ${conditions.join(' AND ')} ${orderByClause}`;

    const { items, continuationToken: nextToken } = await this.cosmosService.queryItems<NotificationDocument>(
      NOTIFICATIONS_CONTAINER,
      querySpec,
      parameters,
      limit,
      continuationToken,
    );

    // Get unread count
    const unreadCount = await this.getUnreadCount(userId);

    return {
      items,
      continuationToken: nextToken,
      unreadCount,
    };
  }

  /**
   * Get notification by ID
   */
  async findOne(id: string, userId: string): Promise<PublicNotification> {
    const notification = await this.cosmosService.getItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, id, userId);

    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    return notification;
  }

  /**
   * Create notification (internal)
   */
  async create(dto: CreateNotificationDto): Promise<PublicNotification> {
    const now = new Date().toISOString();

    // Get user preferences to determine which channels to use
    const preferences = await this.getOrCreatePreferences(dto.userId);
    const enabledChannels = this.getEnabledChannels(dto.notificationType, dto.channels || ['in_app'], preferences);

    // Create notification channels
    const channels = enabledChannels.map((channelType) => ({
      type: channelType,
      status: 'pending' as const,
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
      failureReason: null,
      externalId: null,
    }));

    const notification: NotificationDocument = {
      id: this.cosmosService.generateId(),
      type: 'notification',
      userId: dto.userId,
      notification: {
        notificationType: dto.notificationType,
        title: dto.title,
        message: dto.message,
        actionUrl: dto.actionUrl || null,
        actionText: dto.actionText || null,
        imageUrl: dto.imageUrl || null,
        priority: dto.priority || 'normal',
        metadata: dto.metadata || {},
      },
      channels,
      status: {
        read: false,
        readAt: null,
        archived: false,
        archivedAt: null,
      },
      related: dto.related || null,
      audit: {
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      },
    };

    const created = await this.cosmosService.createItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, notification);

    // Send notifications through enabled channels (async)
    this.sendNotificationChannels(created).catch((error) => {
      console.error('Failed to send notification channels:', error);
    });

    return created;
  }

  /**
   * Mark notification as read/unread
   */
  async markAsRead(id: string, userId: string, dto: MarkNotificationReadDto): Promise<PublicNotification> {
    const notification = await this.cosmosService.getItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, id, userId);

    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    const now = new Date().toISOString();
    const read = dto.read !== undefined ? dto.read : true;

    notification.status.read = read;
    notification.status.readAt = read ? now : null;
    notification.audit.updatedAt = now;

    const updated = await this.cosmosService.upsertItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, notification);
    return updated;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    // Query all unread notifications
    const querySpec = "SELECT * FROM c WHERE c.type = 'notification' AND c.userId = @userId AND c.status.read = false";
    const { items } = await this.cosmosService.queryItems<NotificationDocument>(
      NOTIFICATIONS_CONTAINER,
      querySpec,
      [{ name: '@userId', value: userId }],
      100,
    );

    const now = new Date().toISOString();

    // Update all to read
    const updatePromises = items.map((notification) => {
      notification.status.read = true;
      notification.status.readAt = now;
      notification.audit.updatedAt = now;
      return this.cosmosService.upsertItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, notification);
    });

    await Promise.all(updatePromises);

    return { updated: items.length };
  }

  /**
   * Archive notification
   */
  async archive(id: string, userId: string, dto: ArchiveNotificationDto): Promise<PublicNotification> {
    const notification = await this.cosmosService.getItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, id, userId);

    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    const now = new Date().toISOString();
    const archived = dto.archived !== undefined ? dto.archived : true;

    notification.status.archived = archived;
    notification.status.archivedAt = archived ? now : null;
    notification.audit.updatedAt = now;

    const updated = await this.cosmosService.upsertItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, notification);
    return updated;
  }

  /**
   * Delete notification
   */
  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.cosmosService.getItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, id, userId);

    if (!notification) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      throw new NotFoundException({ message: 'Notification not found' });
    }

    await this.cosmosService.deleteItem(NOTIFICATIONS_CONTAINER, id, userId);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const querySpec =
      "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'notification' AND c.userId = @userId AND c.status.read = false AND c.status.archived = false";
    const { items } = await this.cosmosService.queryItems<number>(
      NOTIFICATIONS_CONTAINER,
      querySpec,
      [{ name: '@userId', value: userId }],
      1,
    );

    return items[0] || 0;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<PublicNotificationPreferences> {
    return this.getOrCreatePreferences(userId);
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<PublicNotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    const now = new Date().toISOString();

    // Update global preferences
    if (dto.global) {
      preferences.preferences.global = {
        ...preferences.preferences.global,
        ...dto.global,
      };
    }

    // Update category preferences
    const categories = ['orders', 'listings', 'subscriptions', 'reviews', 'chats', 'system'] as const;
    for (const category of categories) {
      if (dto[category]) {
        preferences.preferences[category] = {
          ...preferences.preferences[category],
          ...dto[category],
        };
      }
    }

    preferences.audit.updatedAt = now;

    const updated = await this.cosmosService.upsertItem<NotificationPreferencesDocument>(
      NOTIFICATIONS_CONTAINER,
      preferences,
    );
    return updated;
  }

  /**
   * Helper: Get or create default preferences
   */
  private async getOrCreatePreferences(userId: string): Promise<NotificationPreferencesDocument> {
    const prefId = `prefs_${userId}`;
    let preferences = await this.cosmosService.getItem<NotificationPreferencesDocument>(
      NOTIFICATIONS_CONTAINER,
      prefId,
      userId,
    );

    if (!preferences) {
      const now = new Date().toISOString();
      const defaultCategoryPrefs: CategoryPreferences = {
        inApp: true,
        email: true,
        sms: false,
        push: true,
      };

      preferences = {
        id: prefId,
        type: 'notification_preferences',
        userId,
        preferences: {
          global: { inApp: true, email: true, sms: false, push: true },
          orders: defaultCategoryPrefs,
          listings: defaultCategoryPrefs,
          subscriptions: defaultCategoryPrefs,
          reviews: defaultCategoryPrefs,
          chats: { ...defaultCategoryPrefs, email: false }, // Don't spam email for every chat
          system: defaultCategoryPrefs,
        },
        audit: {
          createdAt: now,
          updatedAt: now,
        },
      };

      preferences = await this.cosmosService.createItem<NotificationPreferencesDocument>(
        NOTIFICATIONS_CONTAINER,
        preferences,
      );
    }

    return preferences;
  }

  /**
   * Helper: Determine enabled channels based on preferences
   */
  private getEnabledChannels(
    notificationType: NotificationType,
    requestedChannels: ChannelType[],
    preferences: NotificationPreferencesDocument,
  ): ChannelType[] {
    // Determine category
    let category: keyof ChannelPreferences = 'system';
    if (notificationType.startsWith('order_') || notificationType.includes('payment_') || notificationType.includes('inspection_') || notificationType.includes('delivery_')) {
      category = 'orders';
    } else if (notificationType.startsWith('listing_') || notificationType.includes('offer_')) {
      category = 'listings';
    } else if (notificationType.startsWith('subscription_') || notificationType.includes('invoice_')) {
      category = 'subscriptions';
    } else if (notificationType.includes('review_')) {
      category = 'reviews';
    } else if (notificationType.includes('message_') || notificationType.includes('chat_')) {
      category = 'chats';
    }

    const categoryPrefs = preferences.preferences[category];
    const globalPrefs = preferences.preferences.global;

    // Filter requested channels by both global and category preferences
    return requestedChannels.filter((channel) => {
      const globalEnabled = globalPrefs[channel as keyof typeof globalPrefs];
      const categoryEnabled = categoryPrefs[channel as keyof typeof categoryPrefs];
      return globalEnabled && categoryEnabled;
    });
  }

  /**
   * Helper: Send notifications through channels
   */
  private async sendNotificationChannels(notification: NotificationDocument): Promise<void> {
    const now = new Date().toISOString();

    for (const channel of notification.channels) {
      try {
        switch (channel.type) {
          case 'in_app':
            // In-app notifications are already created, just mark as sent
            channel.status = 'sent';
            channel.sentAt = now;
            channel.deliveredAt = now;
            break;

          case 'email':
            // Email sending through SendGrid is now available via EmailService
            // Specific email templates should be called based on notification type
            // For now, mark as sent - implement specific email templates as needed
            channel.status = 'sent';
            channel.sentAt = now;
            break;

          case 'sms':
            // TODO: Send SMS via Twilio
            // const twilioClient = this.configService.get('twilioAccountSid');
            // await sendSMS(notification);
            channel.status = 'sent';
            channel.sentAt = now;
            break;

          case 'push':
            // TODO: Send push notification
            // await sendPush(notification);
            channel.status = 'sent';
            channel.sentAt = now;
            break;
        }
      } catch (error) {
        channel.status = 'failed';
        channel.failedAt = now;
        channel.failureReason = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    notification.audit.updatedAt = now;
    await this.cosmosService.upsertItem<NotificationDocument>(NOTIFICATIONS_CONTAINER, notification);
  }
}
