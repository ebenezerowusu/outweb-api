import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { loadConfig } from './config/app.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CountryGuard } from './common/guards/country.guard';
import { RbacGuard } from './common/guards/rbac.guard';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { SellerGroupsModule } from './modules/seller-groups/seller-groups.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
    }),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    SellersModule,
    SellerGroupsModule,
  ],
  providers: [
    // Global exception filter (RFC-7807 format)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global Country Guard
    {
      provide: APP_GUARD,
      useClass: CountryGuard,
    },
    // Global RBAC Guard
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class AppModule {}
