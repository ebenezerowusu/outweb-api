import { Module } from '@nestjs/common';
import { TaxonomiesController } from './taxonomies.controller';
import { TaxonomiesService } from './taxonomies.service';
import { CosmosService } from '@/common/services/cosmos.service';

@Module({
  controllers: [TaxonomiesController],
  providers: [TaxonomiesService, CosmosService],
  exports: [TaxonomiesService],
})
export class TaxonomiesModule {}
