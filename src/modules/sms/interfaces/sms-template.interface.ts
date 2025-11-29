/**
 * SMS Template Types
 * Enum of all available SMS templates
 */
export enum SmsTemplateType {
  MFA_CODE = "MFA_CODE",
  OFFER_NEW = "OFFER_NEW",
  OFFER_COUNTER = "OFFER_COUNTER",
  OFFER_ACCEPTED = "OFFER_ACCEPTED",
  OFFER_REJECTED = "OFFER_REJECTED",
  CASHOFFER_NEW_LISTING = "CASHOFFER_NEW_LISTING",
  KYC_APPROVED = "KYC_APPROVED",
  KYC_REJECTED = "KYC_REJECTED",
}

/**
 * SMS Template Configuration Interface
 */
export interface SmsTemplate {
  type: SmsTemplateType;
  twilioTemplateId?: string; // Twilio Content SID (optional, uses default if not set)
  defaultMessage: string; // Fallback message if Twilio template not available
  requiredVariables: string[];
}

/**
 * SMS Recipient Interface
 */
export interface SmsRecipient {
  phoneNumber: string; // E.164 format (e.g., +14155551234)
  name?: string; // Optional recipient name
}

/**
 * SMS Send Result Interface
 */
export interface SendSmsResult {
  success: boolean;
  sent: number;
  failed: number;
  results: {
    phoneNumber: string;
    success: boolean;
    messageSid?: string;
    error?: string;
  }[];
}
