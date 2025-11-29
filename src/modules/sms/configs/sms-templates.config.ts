import {
  SmsTemplate,
  SmsTemplateType,
} from "../interfaces/sms-template.interface";

/**
 * SMS Templates Configuration
 * Central registry of all SMS templates with their Twilio Content SIDs
 * and fallback messages for validation
 */
export const SMS_TEMPLATES: Record<SmsTemplateType, SmsTemplate> = {
  [SmsTemplateType.MFA_CODE]: {
    type: SmsTemplateType.MFA_CODE,
    twilioTemplateId:
      process.env.TWILIO_TMPL_MFA_CODE || "HX956dc77b9b86127d324de9c81963271b",
    defaultMessage:
      "[OnlyUsedTesla] Your code is {{code}} (expires in {{expiresMinutes}}m). If you didn't request this, ignore.",
    requiredVariables: ["code", "expiresMinutes"],
  },

  [SmsTemplateType.OFFER_NEW]: {
    type: SmsTemplateType.OFFER_NEW,
    twilioTemplateId:
      process.env.TWILIO_TMPL_OFFER_NEW || "HXfaa570bd4eb0236e8982f647939dc84e",
    defaultMessage:
      "[OnlyUsedTesla] New {{buyerType}} offer {{amount}} on {{year}} {{make}} {{model}} ({{shortId}}). View: {{url}}",
    requiredVariables: [
      "buyerType",
      "amount",
      "year",
      "make",
      "model",
      "shortId",
      "url",
    ],
  },

  [SmsTemplateType.OFFER_COUNTER]: {
    type: SmsTemplateType.OFFER_COUNTER,
    twilioTemplateId:
      process.env.TWILIO_TMPL_OFFER_COUNTER ||
      "HX53d05e7c1ccc1b7632ec13205f3eda7a",
    defaultMessage:
      "[OnlyUsedTesla] Counter-offer {{amount}} on {{year}} {{make}} {{model}} ({{shortId}}). View: {{url}}",
    requiredVariables: ["amount", "year", "make", "model", "shortId", "url"],
  },

  [SmsTemplateType.OFFER_ACCEPTED]: {
    type: SmsTemplateType.OFFER_ACCEPTED,
    twilioTemplateId:
      process.env.TWILIO_TMPL_OFFER_ACCEPTED ||
      "HX2e2b4ab01e6492c58a06cbf562bfc583",
    defaultMessage:
      "[OnlyUsedTesla] Offer accepted for {{year}} {{make}} {{model}} ({{shortId}}). Next steps: {{url}}",
    requiredVariables: ["year", "make", "model", "shortId", "url"],
  },

  [SmsTemplateType.OFFER_REJECTED]: {
    type: SmsTemplateType.OFFER_REJECTED,
    twilioTemplateId:
      process.env.TWILIO_TMPL_OFFER_REJECTED ||
      "HXa674a8790ea555bd6820083c8d7d8738",
    defaultMessage:
      "[OnlyUsedTesla] Offer not accepted for {{year}} {{make}} {{model}} ({{shortId}}). See details: {{url}}",
    requiredVariables: ["year", "make", "model", "shortId", "url"],
  },

  [SmsTemplateType.CASHOFFER_NEW_LISTING]: {
    type: SmsTemplateType.CASHOFFER_NEW_LISTING,
    twilioTemplateId:
      process.env.TWILIO_TMPL_CASHOFFER_ALERT ||
      "HXdd6364a051c7f4f622cee15236feb706",
    defaultMessage:
      "[OnlyUsedTesla] New CashOffer: {{year}} {{make}} {{model}} in {{city}}, {{state}} for {{price}} ({{shortId}}). View: {{url}}",
    requiredVariables: [
      "year",
      "make",
      "model",
      "city",
      "state",
      "price",
      "shortId",
      "url",
    ],
  },

  [SmsTemplateType.KYC_APPROVED]: {
    type: SmsTemplateType.KYC_APPROVED,
    twilioTemplateId:
      process.env.TWILIO_TMPL_KYC_APPROVED ||
      "HX712fc61f10fe21bd9ae52489c17dfb81",
    defaultMessage:
      "[OnlyUsedTesla] KYC approved. You can now publish listings and receive offers. Dashboard: {{url}}",
    requiredVariables: ["url"],
  },

  [SmsTemplateType.KYC_REJECTED]: {
    type: SmsTemplateType.KYC_REJECTED,
    twilioTemplateId:
      process.env.TWILIO_TMPL_KYC_REJECTED ||
      "HXeccaf234baf87deeabf52407ccf91b3a",
    defaultMessage:
      "[OnlyUsedTesla] KYC not approved: {{reason}}. Resubmit here: {{url}}",
    requiredVariables: ["reason", "url"],
  },
};
