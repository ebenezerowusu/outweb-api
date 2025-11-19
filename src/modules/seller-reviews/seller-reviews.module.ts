import { Module } from '@nestjs/common';
import { SellerReviewsController } from './seller-reviews.controller';
import { SellerReviewsService } from './seller-reviews.service';
import { CosmosService } from '@/common/services/cosmos.service';

@Module({
  controllers: [SellerReviewsController],
  providers: [SellerReviewsService, CosmosService],
  exports: [SellerReviewsService],
})
export class SellerReviewsModule {}
