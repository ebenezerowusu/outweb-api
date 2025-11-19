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
  const port = configService.get('port', { infer: true });
  const nodeEnv = configService.get('nodeEnv', { infer: true });
  const corsOrigins = configService.get('corsOrigin', { infer: true });

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

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('OnlyUsedTesla API')
      .setDescription(
        'NestJS + Fastify backend service for OnlyUsedTesla platform - A high-performance marketplace for used Tesla vehicles',
      )
      .setVersion('1.0.0')
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
    SwaggerModule.setup('docs', app, document);

    logger.log(`Swagger documentation available at http://localhost:${port}/docs`);
  }

  // Start server
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application running on: http://localhost:${port}/api`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap();
