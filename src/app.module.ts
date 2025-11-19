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
import { SellerReviewsModule } from './modules/seller-reviews/seller-reviews.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { TaxonomiesModule } from './modules/taxonomies/taxonomies.module';
import { ListingsModule } from './modules/listings/listings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ListingOffersModule } from './modules/listing-offers/listing-offers.module';

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
    SellerReviewsModule,
    RbacModule,
    TaxonomiesModule,
    ListingsModule,
    SubscriptionsModule,
    OrdersModule,
    NotificationsModule,
    ListingOffersModule,
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
