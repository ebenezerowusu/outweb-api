import { Module } from '@nestjs/common';
import { ListingOffersController } from './listing-offers.controller';
import { ListingOffersService } from './listing-offers.service';
import { CosmosService } from '@/common/services/cosmos.service';

/**
 * Listing Offers Module
 * Manages offers and negotiations on vehicle listings
 */
@Module({
  controllers: [ListingOffersController],
  providers: [ListingOffersService, CosmosService],
  exports: [ListingOffersService],
})
export class ListingOffersModule {}
