import { z } from "zod";

/**
 * Application Configuration Schema using Zod
 * Validates all environment variables required by the application
 */
export const AppConfigSchema = z.object({
  // Application
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.coerce.number().min(1).max(65535).default(3000),
  appName: z.string().default("OnlyUsedTesla-API"),
  apiVersion: z.string().default("v2"),

  // Azure Cosmos DB
  cosmosEndpoint: z.string().url(),
  cosmosKey: z.string().min(1),
  cosmosDatabase: z.string().default("OnlyUsedTesla-v2"),

  // Azure Storage
  azureStorageConnectionString: z.string().min(1),
  azureStorageContainer: z.string().default("uploads"),

  // Stripe - Subscriptions
  stripeSecretKey: z.string().startsWith("sk_"),
  stripeWebhookSecret: z.string().startsWith("whsec_"),
  stripeProductIdBasic: z.string().startsWith("prod_").optional(),
  stripeProductIdPro: z.string().startsWith("prod_").optional(),
  stripeProductIdEnterprise: z.string().startsWith("prod_").optional(),
  stripePriceIdBasicMonthly: z.string().startsWith("price_").optional(),
  stripePriceIdBasicYearly: z.string().startsWith("price_").optional(),
  stripePriceIdProMonthly: z.string().startsWith("price_").optional(),
  stripePriceIdProYearly: z.string().startsWith("price_").optional(),
  stripePriceIdEnterpriseMonthly: z.string().startsWith("price_").optional(),
  stripePriceIdEnterpriseYearly: z.string().startsWith("price_").optional(),

  // Stripe - One-time Payments
  stripeProductIdFeaturedListing: z.string().startsWith("prod_").optional(),
  stripePriceIdFeaturedListing: z.string().startsWith("price_").optional(),
  stripeProductIdBumpListing: z.string().startsWith("prod_").optional(),
  stripePriceIdBumpListing: z.string().startsWith("price_").optional(),
  stripeProductIdHighlightListing: z.string().startsWith("prod_").optional(),
  stripePriceIdHighlightListing: z.string().startsWith("price_").optional(),

  // SendGrid
  sendgridApiKey: z.string().startsWith("SG."),
  sendgridFromEmail: z.string().email(),
  sendgridFromName: z.string().default("OnlyUsedTesla"),

  // SendGrid Email Templates
  sendgridTmplVerifyEmail: z.string().min(1),
  sendgridTmplWelcomePrivate: z.string().min(1),
  sendgridTmplWelcomeDealer: z.string().min(1),
  sendgridTmplResetPassword: z.string().min(1),
  sendgridTmplMfaCodeEmail: z.string().min(1),
  sendgridTmplChangeEmailVerify: z.string().min(1),
  sendgridTmplNewLoginAlert: z.string().min(1),
  sendgridTmplDealerAppReceived: z.string().min(1),
  sendgridTmplDealerAppApproved: z.string().min(1),
  sendgridTmplDealerAppRejected: z.string().min(1),
  sendgridTmplKycApproved: z.string().min(1),
  sendgridTmplKycRejected: z.string().min(1),
  sendgridTmplDealerStaffInvite: z.string().min(1),
  sendgridTmplRoleChanged: z.string().min(1),
  sendgridTmplCashOfferAlert: z.string().min(1),

  // Twilio
  twilioAccountSid: z.string().startsWith("AC"),
  twilioAuthToken: z.string().min(1),
  twilioPhoneNumber: z.string().regex(/^\+\d{10,15}$/),

  // JWT
  jwtAccessSecret: z.string().min(32),
  jwtRefreshSecret: z.string().min(32),
  jwtAccessExpiresIn: z.coerce.number().default(3600),
  jwtRefreshExpiresIn: z.coerce.number().default(604800),

  // CORS
  corsOrigin: z.string().transform((val) => val.split(",")),

  // Rate Limiting
  rateLimitTtl: z.coerce.number().default(60),
  rateLimitMax: z.coerce.number().default(100),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Validate and load environment configuration
 */
export function loadConfig(): AppConfig {
  const config = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    appName: process.env.APP_NAME,
    apiVersion: process.env.API_VERSION,

    cosmosEndpoint: process.env.COSMOS_ENDPOINT,
    cosmosKey: process.env.COSMOS_KEY,
    cosmosDatabase: process.env.COSMOS_DATABASE,

    azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    azureStorageContainer: process.env.AZURE_STORAGE_CONTAINER,

    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeProductIdBasic: process.env.STRIPE_PRODUCT_ID_BASIC,
    stripeProductIdPro: process.env.STRIPE_PRODUCT_ID_PRO,
    stripeProductIdEnterprise: process.env.STRIPE_PRODUCT_ID_ENTERPRISE,
    stripePriceIdBasicMonthly: process.env.STRIPE_PRICE_ID_BASIC_MONTHLY,
    stripePriceIdBasicYearly: process.env.STRIPE_PRICE_ID_BASIC_YEARLY,
    stripePriceIdProMonthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    stripePriceIdProYearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY,
    stripePriceIdEnterpriseMonthly:
      process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY,
    stripePriceIdEnterpriseYearly:
      process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY,

    stripeProductIdFeaturedListing:
      process.env.STRIPE_PRODUCT_ID_FEATURED_LISTING,
    stripePriceIdFeaturedListing: process.env.STRIPE_PRICE_ID_FEATURED_LISTING,
    stripeProductIdBumpListing: process.env.STRIPE_PRODUCT_ID_BUMP_LISTING,
    stripePriceIdBumpListing: process.env.STRIPE_PRICE_ID_BUMP_LISTING,
    stripeProductIdHighlightListing:
      process.env.STRIPE_PRODUCT_ID_HIGHLIGHT_LISTING,
    stripePriceIdHighlightListing:
      process.env.STRIPE_PRICE_ID_HIGHLIGHT_LISTING,

    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL,
    sendgridFromName: process.env.SENDGRID_FROM_NAME,

    sendgridTmplVerifyEmail: process.env.SENDGRID_TMPL_VERIFY_EMAIL,
    sendgridTmplWelcomePrivate: process.env.SENDGRID_TMPL_WELCOME_PRIVATE,
    sendgridTmplWelcomeDealer: process.env.SENDGRID_TMPL_WELCOME_DEALER,
    sendgridTmplResetPassword: process.env.SENDGRID_TMPL_RESET_PASSWORD,
    sendgridTmplMfaCodeEmail: process.env.SENDGRID_TMPL_MFA_CODE_EMAIL,
    sendgridTmplChangeEmailVerify:
      process.env.SENDGRID_TMPL_CHANGE_EMAIL_VERIFY,
    sendgridTmplNewLoginAlert: process.env.SENDGRID_TMPL_NEW_LOGIN_ALERT,
    sendgridTmplDealerAppReceived:
      process.env.SENDGRID_TMPL_DEALER_APP_RECEIVED,
    sendgridTmplDealerAppApproved:
      process.env.SENDGRID_TMPL_DEALER_APP_APPROVED,
    sendgridTmplDealerAppRejected:
      process.env.SENDGRID_TMPL_DEALER_APP_REJECTED,
    sendgridTmplKycApproved: process.env.SENDGRID_TMPL_KYC_APPROVED,
    sendgridTmplKycRejected: process.env.SENDGRID_TMPL_KYC_REJECTED,
    sendgridTmplDealerStaffInvite:
      process.env.SENDGRID_TMPL_DEALER_STAFF_INVITE,
    sendgridTmplRoleChanged: process.env.SENDGRID_TMPL_ROLE_CHANGED,
    sendgridTmplCashOfferAlert: process.env.SENDGRID_TMPL_CASHOFFER_ALERT,

    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,

    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,

    corsOrigin: process.env.CORS_ORIGIN,

    rateLimitTtl: process.env.RATE_LIMIT_TTL,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
  };

  try {
    return AppConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}
