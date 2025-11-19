import { Module } from '@nestjs/common';
import { ListingOffersController } from './listing-offers.controller';
import { ListingOffersService } from './listing-offers.service';

/**
 * Listing Offers Module
 * Manages offers and negotiations on vehicle listings
 */
@Module({
  controllers: [ListingOffersController],
  providers: [ListingOffersService],
  exports: [ListingOffersService],
})
export class ListingOffersModule {}
