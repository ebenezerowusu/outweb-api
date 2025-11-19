import { z } from 'zod';

/**
 * Application Configuration Schema using Zod
 * Validates all environment variables required by the application
 */
export const AppConfigSchema = z.object({
  // Application
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().min(1).max(65535).default(3000),
  appName: z.string().default('OnlyUsedTesla-API'),

  // Azure Cosmos DB
  cosmosEndpoint: z.string().url(),
  cosmosKey: z.string().min(1),
  cosmosDatabase: z.string().default('OnlyUsedTesla-v2'),

  // Azure Storage
  azureStorageConnectionString: z.string().min(1),
  azureStorageContainer: z.string().default('uploads'),

  // Stripe
  stripeSecretKey: z.string().startsWith('sk_'),
  stripeWebhookSecret: z.string().startsWith('whsec_'),
  stripeProductIdBasic: z.string().startsWith('prod_').optional(),
  stripeProductIdPro: z.string().startsWith('prod_').optional(),
  stripeProductIdEnterprise: z.string().startsWith('prod_').optional(),
  stripePriceIdBasicMonthly: z.string().startsWith('price_').optional(),
  stripePriceIdBasicYearly: z.string().startsWith('price_').optional(),
  stripePriceIdProMonthly: z.string().startsWith('price_').optional(),
  stripePriceIdProYearly: z.string().startsWith('price_').optional(),
  stripePriceIdEnterpriseMonthly: z.string().startsWith('price_').optional(),
  stripePriceIdEnterpriseYearly: z.string().startsWith('price_').optional(),

  // SendGrid
  sendgridApiKey: z.string().startsWith('SG.'),
  sendgridFromEmail: z.string().email(),
  sendgridFromName: z.string().default('OnlyUsedTesla'),

  // Twilio
  twilioAccountSid: z.string().startsWith('AC'),
  twilioAuthToken: z.string().min(1),
  twilioPhoneNumber: z.string().regex(/^\+\d{10,15}$/),

  // JWT
  jwtAccessSecret: z.string().min(32),
  jwtRefreshSecret: z.string().min(32),
  jwtAccessExpiresIn: z.coerce.number().default(3600),
  jwtRefreshExpiresIn: z.coerce.number().default(604800),

  // CORS
  corsOrigin: z.string().transform((val) => val.split(',')),

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
    stripePriceIdEnterpriseMonthly: process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY,
    stripePriceIdEnterpriseYearly: process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY,

    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL,
    sendgridFromName: process.env.SENDGRID_FROM_NAME,

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
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}
