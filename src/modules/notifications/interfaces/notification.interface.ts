/**
 * Notification Document Interface
 * Represents a multi-channel notification to a user
 */
export interface NotificationDocument {
  id: string;
  type: "notification";

  // Recipient
  userId: string;

  // Notification details
  notification: NotificationDetails;

  // Channels
  channels: NotificationChannel[];

  // Status
  status: NotificationStatus;

  // Related entities
  related: NotificationRelated | null;

  // Audit
  audit: NotificationAudit;
}

/**
 * Notification details
 */
export interface NotificationDetails {
  notificationType: NotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  actionText: string | null;
  imageUrl: string | null;
  priority: NotificationPriority;
  metadata: Record<string, any>;
}

export type NotificationType =
  // Order notifications
  | "order_created"
  | "order_status_changed"
  | "payment_received"
  | "payment_failed"
  | "inspection_scheduled"
  | "inspection_completed"
  | "delivery_scheduled"
  | "order_delivered"
  | "order_completed"
  | "order_canceled"

  // Listing notifications
  | "listing_approved"
  | "listing_rejected"
  | "listing_expired"
  | "listing_sold"
  | "new_offer_received"
  | "offer_accepted"
  | "offer_rejected"
  | "offer_countered"

  // Subscription notifications
  | "subscription_created"
  | "subscription_renewed"
  | "subscription_canceled"
  | "subscription_expiring"
  | "payment_method_expiring"
  | "invoice_paid"
  | "invoice_failed"

  // Review notifications
  | "new_review_received"
  | "review_response_posted"

  // Chat notifications
  | "new_message_received"
  | "offer_chat_started"

  // System notifications
  | "account_verified"
  | "password_changed"
  | "security_alert"
  | "system_announcement";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/**
 * Notification channel (in-app, email, SMS, push)
 */
export interface NotificationChannel {
  type: ChannelType;
  status: ChannelStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  externalId: string | null; // Email ID, SMS ID, etc.
}

export type ChannelType = "in_app" | "email" | "sms" | "push";

export type ChannelStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "skipped";

/**
 * Notification status
 */
export interface NotificationStatus {
  read: boolean;
  readAt: string | null;
  archived: boolean;
  archivedAt: string | null;
}

/**
 * Related entities for context
 */
export interface NotificationRelated {
  orderId?: string;
  listingId?: string;
  offerId?: string;
  reviewId?: string;
  chatId?: string;
  subscriptionId?: string;
}

/**
 * Audit information
 */
export interface NotificationAudit {
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null; // Auto-delete after certain period
}

/**
 * Public Notification
 */
export type PublicNotification = NotificationDocument;

/**
 * Notification Preferences Document
 * User preferences for notification channels
 */
export interface NotificationPreferencesDocument {
  id: string;
  type: "notification_preferences";
  userId: string;

  preferences: ChannelPreferences;

  audit: {
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Channel preferences by notification type
 */
export interface ChannelPreferences {
  // Global preferences
  global: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  // Per-category preferences
  orders: CategoryPreferences;
  listings: CategoryPreferences;
  subscriptions: CategoryPreferences;
  reviews: CategoryPreferences;
  chats: CategoryPreferences;
  system: CategoryPreferences;
}

export interface CategoryPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

/**
 * Public Notification Preferences
 */
export type PublicNotificationPreferences = NotificationPreferencesDocument;
