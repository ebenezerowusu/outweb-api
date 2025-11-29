/**
 * Email Template Interfaces
 * Defines the structure for email templates and sending
 */

export enum EmailTemplateType {
  VERIFY_EMAIL = "VERIFY_EMAIL",
  WELCOME_PRIVATE = "WELCOME_PRIVATE",
  WELCOME_DEALER = "WELCOME_DEALER",
  RESET_PASSWORD = "RESET_PASSWORD",
  MFA_CODE_EMAIL = "MFA_CODE_EMAIL",
  CHANGE_EMAIL_VERIFY = "CHANGE_EMAIL_VERIFY",
  NEW_LOGIN_ALERT = "NEW_LOGIN_ALERT",
  DEALER_APP_RECEIVED = "DEALER_APP_RECEIVED",
  DEALER_APP_APPROVED = "DEALER_APP_APPROVED",
  DEALER_APP_REJECTED = "DEALER_APP_REJECTED",
  KYC_APPROVED = "KYC_APPROVED",
  KYC_REJECTED = "KYC_REJECTED",
  DEALER_STAFF_INVITE = "DEALER_STAFF_INVITE",
  ROLE_CHANGED = "ROLE_CHANGED",
  CASH_OFFER_ALERT = "CASH_OFFER_ALERT",
}

export interface EmailTemplate {
  type: EmailTemplateType;
  sendGridTemplateId: string;
  subject: string; // Fallback subject if not in template
  requiredVariables: string[]; // For validation
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailResult {
  sent: number;
  failed: number;
  results: Array<{
    email: string;
    success: boolean;
    error?: string;
  }>;
}
