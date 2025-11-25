import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TaxonomiesService } from './taxonomies.service';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import {
  UpdateTaxonomyDto,
  UpdateTaxonomyStatusDto,
  BulkUpdateTaxonomiesDto,
} from './dto/update-taxonomy.dto';
import { QueryTaxonomiesDto, SuggestTaxonomiesDto } from './dto/query-taxonomy.dto';
import {
  CurrentUser,
  RequirePermissions,
  SkipAuth,
} from '@/common/decorators/auth.decorators';

/**
 * Taxonomies Controller
 * Handles vehicle classifications and attributes
 */
@ApiTags('Taxonomies')
@Controller('taxonomies')
@ApiBearerAuth('Authorization')
export class TaxonomiesController {
  constructor(private readonly taxonomiesService: TaxonomiesService) {}

  /**
   * List taxonomies with filters
   */
  @Get()
  @SkipAuth()
  @ApiOperation({ summary: 'List taxonomies with filters and pagination (Public)' })
  @ApiResponse({ status: 200, description: 'Taxonomies list retrieved successfully' })
  async findAll(@Query() query: QueryTaxonomiesDto) {
    return this.taxonomiesService.findAll(query);
  }

  /**
   * Autocomplete/suggest taxonomies
   */
  @Get('suggest')
  @SkipAuth()
  @ApiOperation({ summary: 'Get taxonomy suggestions for autocomplete (Public)' })
  @ApiResponse({ status: 200, description: 'Taxonomy suggestions retrieved successfully' })
  async suggest(@Query() suggestDto: SuggestTaxonomiesDto) {
    return this.taxonomiesService.suggest(suggestDto);
  }

  /**
   * Get taxonomy by ID
   */
  @Get(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Get taxonomy by ID (Public)' })
  @ApiParam({ name: 'id', description: 'Taxonomy ID' })
  @ApiResponse({ status: 200, description: 'Taxonomy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found' })
  async findOne(@Param('id') id: string) {
    return this.taxonomiesService.findOne(id);
  }

  /**
   * Get taxonomy by category and slug
   */
  @Get(':category/:slug')
  @SkipAuth()
  @ApiOperation({ summary: 'Get taxonomy by category and slug (Public)' })
  @ApiParam({ name: 'category', description: 'Taxonomy category' })
  @ApiParam({ name: 'slug', description: 'Taxonomy slug' })
  @ApiResponse({ status: 200, description: 'Taxonomy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found' })
  async findBySlug(
    @Param('category') category: string,
    @Param('slug') slug: string,
  ) {
    return this.taxonomiesService.findBySlug(category, slug);
  }

  /**
   * Create new taxonomy
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new taxonomy (Admin only)' })
  @ApiResponse({ status: 201, description: 'Taxonomy created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Taxonomy with slug already exists' })
  async create(
    @Body() createTaxonomyDto: CreateTaxonomyDto,
    @CurrentUser() user: any,
  ) {
    return this.taxonomiesService.create(createTaxonomyDto, user.sub);
  }

  /**
   * Update taxonomy
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update taxonomy (Admin only)' })
  @ApiParam({ name: 'id', description: 'Taxonomy ID' })
  @ApiResponse({ status: 200, description: 'Taxonomy updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found' })
  @ApiResponse({ status: 409, description: 'Taxonomy with slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateTaxonomyDto: UpdateTaxonomyDto,
    @CurrentUser() user: any,
  ) {
    return this.taxonomiesService.update(id, updateTaxonomyDto, user.sub);
  }

  /**
   * Update taxonomy status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update taxonomy status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Taxonomy ID' })
  @ApiResponse({ status: 200, description: 'Taxonomy status updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTaxonomyStatusDto,
  ) {
    return this.taxonomiesService.updateStatus(id, updateStatusDto);
  }

  /**
   * Bulk update taxonomies
   */
  @Patch('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update taxonomies (Admin only)' })
  @ApiResponse({ status: 200, description: 'Taxonomies updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateTaxonomiesDto) {
    return this.taxonomiesService.bulkUpdate(bulkUpdateDto);
  }

  /**
   * Delete taxonomy
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete taxonomy (Admin only)' })
  @ApiParam({ name: 'id', description: 'Taxonomy ID' })
  @ApiResponse({ status: 204, description: 'Taxonomy deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete taxonomy with children' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found' })
  async delete(@Param('id') id: string) {
    await this.taxonomiesService.delete(id);
  }
}
