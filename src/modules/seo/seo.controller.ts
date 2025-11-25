import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SeoService } from './seo.service';
import { SeoListingContextDto } from './dto/seo.dto';
import { SkipAuth } from '@/common/decorators/auth.decorators';

/**
 * SEO Controller
 * Handles SEO metadata generation using taxonomy slugs
 */
@ApiTags('SEO')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  /**
   * GET /seo/taxonomies/:categoryId
   * SEO-ready options for one taxonomy
   */
  @Get('taxonomies/:categoryId')
  @SkipAuth()
  @ApiOperation({
    summary: 'Get SEO-ready taxonomy options (Public)',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Taxonomy category ID',
    example: 'make',
  })
  @ApiResponse({
    status: 200,
    description: 'SEO taxonomy options retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Taxonomy not found',
  })
  async getTaxonomySeo(@Param('categoryId') categoryId: string) {
    return this.seoService.getTaxonomySeo(categoryId);
  }

  /**
   * GET /seo/taxonomies/:categoryId/:slug
   * Resolve a single slug
   */
  @Get('taxonomies/:categoryId/:slug')
  @SkipAuth()
  @ApiOperation({
    summary: 'Resolve taxonomy slug to label and value (Public)',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Taxonomy category ID',
    example: 'make',
  })
  @ApiParam({
    name: 'slug',
    description: 'Option slug',
    example: 'tesla',
  })
  @ApiResponse({
    status: 200,
    description: 'Slug resolved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Taxonomy or slug not found',
  })
  async resolveTaxonomySlug(
    @Param('categoryId') categoryId: string,
    @Param('slug') slug: string,
  ) {
    return this.seoService.resolveTaxonomySlug(categoryId, slug);
  }

  /**
   * POST /seo/listings/context
   * Build meta title/description/canonical from taxonomy slugs
   */
  @Post('listings/context')
  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate SEO metadata from taxonomy slugs (Public)',
  })
  @ApiResponse({
    status: 200,
    description: 'SEO metadata generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid slug(s) provided',
  })
  async buildListingContext(@Body() dto: SeoListingContextDto) {
    return this.seoService.buildListingContext(dto);
  }

  /**
   * GET /seo/listings/:makeSlug/:modelSlug
   * SEO metadata for make + model combination
   */
  @Get('listings/:makeSlug/:modelSlug')
  @SkipAuth()
  @ApiOperation({
    summary: 'Get SEO metadata for make + model (Public)',
  })
  @ApiParam({
    name: 'makeSlug',
    description: 'Make slug',
    example: 'tesla',
  })
  @ApiParam({
    name: 'modelSlug',
    description: 'Model slug',
    example: 'model-s',
  })
  @ApiResponse({
    status: 200,
    description: 'SEO metadata retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Make or model not found',
  })
  async getModelSeo(
    @Param('makeSlug') makeSlug: string,
    @Param('modelSlug') modelSlug: string,
  ) {
    return this.seoService.getModelSeo(makeSlug, modelSlug);
  }

  /**
   * GET /seo/listings/:makeSlug/:modelSlug/:trimSlug
   * SEO metadata for make + model + trim combination
   */
  @Get('listings/:makeSlug/:modelSlug/:trimSlug')
  @SkipAuth()
  @ApiOperation({
    summary: 'Get SEO metadata for make + model + trim (Public)',
  })
  @ApiParam({
    name: 'makeSlug',
    description: 'Make slug',
    example: 'tesla',
  })
  @ApiParam({
    name: 'modelSlug',
    description: 'Model slug',
    example: 'model-s',
  })
  @ApiParam({
    name: 'trimSlug',
    description: 'Trim slug',
    example: 'p100d',
  })
  @ApiResponse({
    status: 200,
    description: 'SEO metadata retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Make, model, or trim not found',
  })
  async getTrimSeo(
    @Param('makeSlug') makeSlug: string,
    @Param('modelSlug') modelSlug: string,
    @Param('trimSlug') trimSlug: string,
  ) {
    return this.seoService.getTrimSeo(makeSlug, modelSlug, trimSlug);
  }
}
