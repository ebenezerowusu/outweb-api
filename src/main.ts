import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application with Fastify adapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService<AppConfig>);
  const port = configService.get('port', { infer: true }) || 3000;
  const nodeEnv = configService.get('nodeEnv', { infer: true }) || 'development';
  const corsOrigins = configService.get('corsOrigin', { infer: true }) || '*';
  const apiVersion = configService.get('apiVersion', { infer: true }) || 'v2';

  // Enable CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Country'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix with versioning
  app.setGlobalPrefix(`api/${apiVersion}`);

  // Swagger/OpenAPI documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('OnlyUsedTesla API')
      .setDescription(
        'API backend service for OnlyUsedTesla platform - A high-performance marketplace for used Tesla vehicles',
      )
      .setVersion(apiVersion)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'Authorization',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Country',
          in: 'header',
          description: '2-letter ISO 3166-1 alpha-2 country code (e.g., US, CA, GH, GB)',
        },
        'X-Country',
      )
      .addTag('Health', 'Service health and diagnostics endpoints')
      .addTag('Auth', 'Authentication and authorization endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Sellers', 'Seller management endpoints')
      .addTag('Seller Groups', 'Dealer group management endpoints')
      .addTag('Seller Reviews', 'Seller review endpoints')
      .addTag('RBAC', 'Role-based access control helper endpoints')
      .addTag('Taxonomies', 'Taxonomy and classification endpoints')
      .addTag('Listings', 'Vehicle listing endpoints')
      .addTag('Vehicles', 'Vehicle data endpoints')
      .addTag('Payments', 'Payment and subscription endpoints')
      .addTag('Orders', 'Order management endpoints')
      .addTag('Notifications', 'Notification endpoints')
      .addTag('Offers', 'Listing offer endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Apply security globally to all endpoints except health endpoints
    for (const path in document.paths) {
      // Skip security for health endpoints (they use @SkipAuth and @SkipCountryGuard)
      if (path.startsWith(`/api/${apiVersion}/health`)) {
        continue;
      }

      for (const method in document.paths[path]) {
        const operation = document.paths[path][method];
        if (operation && typeof operation === 'object') {
          // Apply both security schemes to all endpoints
          operation.security = [
            { Authorization: [] },
            { 'X-Country': [] },
          ];
        }
      }
    }

    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'OnlyUsedTesla API Documentation',
      customfavIcon: 'https://onlyusedtesla.com/assets/icon_64x64.24a82d.png',
      customCss: `
        .topbar-wrapper img { content: url('https://onlyusedtesla.com/assets/icon_512x512.24a82d.png'); width: 40px; height: auto; }
        .topbar { background-color: #1a1a2e; }
      `,
      swaggerOptions: {
        persistAuthorization: true, // Persist auth tokens across browser sessions
      },
    });

    logger.log(`Swagger documentation available at http://localhost:${port}/docs`);
  }

  // Start server
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application running on: http://localhost:${port}/api/${apiVersion}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap();
