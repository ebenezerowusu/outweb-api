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
      process.env.SENDGRID_TMPL_VERIFY_EMAIL || "d-verify-email",
    subject: "Verify your email address",
    requiredVariables: ["firstName", "verifyUrl"],
  },

  [EmailTemplateType.WELCOME_PRIVATE]: {
    type: EmailTemplateType.WELCOME_PRIVATE,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_WELCOME_PRIVATE || "d-welcome-private",
    subject: "Welcome to OnlyUsedTesla",
    requiredVariables: ["firstName", "dashboardUrl"],
  },

  [EmailTemplateType.WELCOME_DEALER]: {
    type: EmailTemplateType.WELCOME_DEALER,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_WELCOME_DEALER || "d-welcome-dealer",
    subject: "Welcome to OnlyUsedTesla Dealer Portal",
    requiredVariables: ["firstName", "dealerName", "dealerDashboardUrl"],
  },

  [EmailTemplateType.RESET_PASSWORD]: {
    type: EmailTemplateType.RESET_PASSWORD,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_RESET_PASSWORD || "d-reset-password",
    subject: "Reset your password",
    requiredVariables: ["firstName", "resetUrl"],
  },

  [EmailTemplateType.MFA_CODE_EMAIL]: {
    type: EmailTemplateType.MFA_CODE_EMAIL,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_MFA_CODE_EMAIL || "d-mfa-code",
    subject: "Your verification code",
    requiredVariables: ["firstName", "code", "expiresMinutes"],
  },

  [EmailTemplateType.CHANGE_EMAIL_VERIFY]: {
    type: EmailTemplateType.CHANGE_EMAIL_VERIFY,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_CHANGE_EMAIL_VERIFY || "d-change-email-verify",
    subject: "Verify your new email address",
    requiredVariables: ["firstName", "verifyUrl"],
  },

  [EmailTemplateType.NEW_LOGIN_ALERT]: {
    type: EmailTemplateType.NEW_LOGIN_ALERT,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_NEW_LOGIN_ALERT || "d-new-login-alert",
    subject: "New login detected",
    requiredVariables: ["firstName", "time", "ip", "city", "userAgent"],
  },

  [EmailTemplateType.DEALER_APP_RECEIVED]: {
    type: EmailTemplateType.DEALER_APP_RECEIVED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_APP_RECEIVED || "d-dealer-app-received",
    subject: "Dealer application received",
    requiredVariables: ["dealerName", "submittedAt"],
  },

  [EmailTemplateType.DEALER_APP_APPROVED]: {
    type: EmailTemplateType.DEALER_APP_APPROVED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_APP_APPROVED || "d-dealer-app-approved",
    subject: "Dealer application approved",
    requiredVariables: ["dealerName", "dealerDashboardUrl"],
  },

  [EmailTemplateType.DEALER_APP_REJECTED]: {
    type: EmailTemplateType.DEALER_APP_REJECTED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_APP_REJECTED || "d-dealer-app-rejected",
    subject: "Dealer application status",
    requiredVariables: ["dealerName", "reason"],
  },

  [EmailTemplateType.KYC_APPROVED]: {
    type: EmailTemplateType.KYC_APPROVED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_KYC_APPROVED || "d-kyc-approved",
    subject: "KYC verification approved",
    requiredVariables: ["sellerName", "dashboardUrl"],
  },

  [EmailTemplateType.KYC_REJECTED]: {
    type: EmailTemplateType.KYC_REJECTED,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_KYC_REJECTED || "d-kyc-rejected",
    subject: "KYC verification requires attention",
    requiredVariables: ["sellerName", "reason", "resubmitUrl"],
  },

  [EmailTemplateType.DEALER_STAFF_INVITE]: {
    type: EmailTemplateType.DEALER_STAFF_INVITE,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_DEALER_STAFF_INVITE || "d-dealer-staff-invite",
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
      process.env.SENDGRID_TMPL_ROLE_CHANGED || "d-role-changed",
    subject: "Your role has been updated",
    requiredVariables: ["fullName", "oldRole", "newRole", "dashboardUrl"],
  },

  [EmailTemplateType.CASH_OFFER_ALERT]: {
    type: EmailTemplateType.CASH_OFFER_ALERT,
    sendGridTemplateId:
      process.env.SENDGRID_TMPL_CASHOFFER_ALERT || "d-cashoffer-alert",
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
