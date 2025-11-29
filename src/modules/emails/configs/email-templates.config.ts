import {
  EmailTemplate,
  EmailTemplateType,
} from "../interfaces/email-template.interface";

/**
 * Email Templates Configuration
 * Central registry of all email templates with their SendGrid template IDs
 * and required variables for validation
 */
export const EMAIL_TEMPLATES: Record<EmailTemplateType, EmailTemplate> = {
  [EmailTemplateType.VERIFY_EMAIL]: {
    type: EmailTemplateType.VERIFY_EMAIL,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_VERIFY_EMAIL || "d-3f917ab40390404baf29bb133a918f73",
    subject: "Verify your email address",
    requiredVariables: ["firstName", "verifyUrl"],
  },

  [EmailTemplateType.WELCOME_PRIVATE]: {
    type: EmailTemplateType.WELCOME_PRIVATE,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_WELCOME_PRIVATE || "d-220e3c51447f438584a50767c17ec543",
    subject: "Welcome to OnlyUsedTesla",
    requiredVariables: ["firstName", "dashboardUrl"],
  },

  [EmailTemplateType.WELCOME_DEALER]: {
    type: EmailTemplateType.WELCOME_DEALER,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_WELCOME_DEALER || "d-0cdbaf9879334aa28ec58e5f4b4d751c",
    subject: "Welcome to OnlyUsedTesla Dealer Portal",
    requiredVariables: ["firstName", "dealerName", "dealerDashboardUrl"],
  },

  [EmailTemplateType.RESET_PASSWORD]: {
    type: EmailTemplateType.RESET_PASSWORD,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_RESET_PASSWORD || "d-d6769256d55f4f6e861f4e803cdb7545",
    subject: "Reset your password",
    requiredVariables: ["firstName", "resetUrl"],
  },

  [EmailTemplateType.MFA_CODE_EMAIL]: {
    type: EmailTemplateType.MFA_CODE_EMAIL,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_MFA_CODE_EMAIL || "d-0a2aa2f057644114bc6dda3769b572b6",
    subject: "Your verification code",
    requiredVariables: ["firstName", "code", "expiresMinutes"],
  },

  [EmailTemplateType.CHANGE_EMAIL_VERIFY]: {
    type: EmailTemplateType.CHANGE_EMAIL_VERIFY,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_CHANGE_EMAIL_VERIFY || "d-61e11971dcde4d60a1404d6f5ee38d2c",
    subject: "Verify your new email address",
    requiredVariables: ["firstName", "verifyUrl"],
  },

  [EmailTemplateType.NEW_LOGIN_ALERT]: {
    type: EmailTemplateType.NEW_LOGIN_ALERT,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_NEW_LOGIN_ALERT || "d-73916143f13c4bc7a4a17eaf98d65c73",
    subject: "New login detected",
    requiredVariables: ["firstName", "time", "ip", "city", "userAgent"],
  },

  [EmailTemplateType.DEALER_APP_RECEIVED]: {
    type: EmailTemplateType.DEALER_APP_RECEIVED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_APP_RECEIVED || "d-4163772c9ca9439dbfc6ee3ef6bca18c",
    subject: "Dealer application received",
    requiredVariables: ["dealerName", "submittedAt"],
  },

  [EmailTemplateType.DEALER_APP_APPROVED]: {
    type: EmailTemplateType.DEALER_APP_APPROVED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_APP_APPROVED || "d-6bb987a3175a4bada3ac2e5f27b6abc0",
    subject: "Dealer application approved",
    requiredVariables: ["dealerName", "dealerDashboardUrl"],
  },

  [EmailTemplateType.DEALER_APP_REJECTED]: {
    type: EmailTemplateType.DEALER_APP_REJECTED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_APP_REJECTED || "d-448061f75c92401a933f573695534c08",
    subject: "Dealer application status",
    requiredVariables: ["dealerName", "reason"],
  },

  [EmailTemplateType.KYC_APPROVED]: {
    type: EmailTemplateType.KYC_APPROVED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_KYC_APPROVED || "d-12ec02c5349242d1bb8d31a94007c827",
    subject: "KYC verification approved",
    requiredVariables: ["sellerName", "dashboardUrl"],
  },

  [EmailTemplateType.KYC_REJECTED]: {
    type: EmailTemplateType.KYC_REJECTED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_KYC_REJECTED || "d-012c9814c9de4916831cd9320718d3ab",
    subject: "KYC verification requires attention",
    requiredVariables: ["sellerName", "reason", "resubmitUrl"],
  },

  [EmailTemplateType.DEALER_STAFF_INVITE]: {
    type: EmailTemplateType.DEALER_STAFF_INVITE,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_STAFF_INVITE || "d-b566cc054c874bc983ab290967596dfb",
    subject: "You've been invited to join a dealer team",
    requiredVariables: [
      "inviterName",
      "dealerName",
      "inviteEmail",
      "setPasswordUrl",
    ],
  },

  [EmailTemplateType.ROLE_CHANGED]: {
    type: EmailTemplateType.ROLE_CHANGED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_ROLE_CHANGED || "d-c94fd44d2ca340cfb1f05bf8ec517ab3",
    subject: "Your role has been updated",
    requiredVariables: ["fullName", "oldRole", "newRole", "dashboardUrl"],
  },

  [EmailTemplateType.CASH_OFFER_ALERT]: {
    type: EmailTemplateType.CASH_OFFER_ALERT,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_CASHOFFER_ALERT || "d-9bbd858f556945de85dd1240b5e7c7cd",
    subject: "New Cash Offer opportunity",
    requiredVariables: [
      "listingShortId",
      "countryCode",
      "make",
      "model",
      "year",
      "trim",
      "priceFormatted",
      "sellerType",
      "color",
      "mileageFormatted",
      "city",
      "state",
      "country",
      "listingUrl",
      "listingImage",
    ],
  },
};
