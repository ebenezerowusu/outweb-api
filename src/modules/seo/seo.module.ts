import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { CosmosService } from '@/common/services/cosmos.service';

/**
 * SEO Module
 * Provides SEO metadata generation using taxonomy slugs
 */
@Module({
  controllers: [SeoController],
  providers: [SeoService, CosmosService],
  exports: [SeoService],
})
export class SeoModule {}
