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
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { TaxonomiesService } from "./taxonomies.service";
import {
  QueryTaxonomiesDto,
  GetTaxonomyOptionsDto,
  BulkGetTaxonomiesDto,
} from "./dto/query-taxonomy.dto";
import {
  CreateTaxonomyDto,
  AddTaxonomyOptionsDto,
} from "./dto/create-taxonomy.dto";
import {
  UpdateTaxonomyDto,
  UpdateTaxonomyOptionDto,
} from "./dto/update-taxonomy.dto";
import { SkipAuth } from "@/common/decorators/auth.decorators";

/**
 * Taxonomies Controller
 * Handles taxonomy categories and options for vehicle classifications
 */
@ApiTags("Taxonomies")
@Controller("taxonomies")
@ApiBearerAuth("Authorization")
export class TaxonomiesController {
  constructor(private readonly taxonomiesService: TaxonomiesService) {}

  /**
   * GET /taxonomies
   * List all taxonomy categories (lightweight)
   */
  @Get()
  @SkipAuth()
  @ApiOperation({ summary: "List all taxonomy categories (Public)" })
  @ApiResponse({
    status: 200,
    description: "Taxonomy categories retrieved successfully",
  })
  async findAll(@Query() query: QueryTaxonomiesDto) {
    return this.taxonomiesService.findAll(query);
  }

  /**
   * GET /taxonomies/bulk
   * Fetch multiple categories in one call
   */
  @Get("bulk")
  @SkipAuth()
  @ApiOperation({ summary: "Fetch multiple taxonomy categories (Public)" })
  @ApiQuery({
    name: "categories",
    description: "Comma-separated list of category IDs",
    example: "make,model,color",
  })
  @ApiResponse({
    status: 200,
    description: "Taxonomies retrieved successfully",
  })
  async findBulk(@Query() query: BulkGetTaxonomiesDto) {
    return this.taxonomiesService.findBulk(query);
  }

  /**
   * GET /taxonomies/:categoryId
   * Get a single taxonomy (full object + options)
   */
  @Get(":categoryId")
  @SkipAuth()
  @ApiOperation({ summary: "Get taxonomy by category ID (Public)" })
  @ApiParam({
    name: "categoryId",
    description: "Taxonomy category ID",
    example: "make",
  })
  @ApiResponse({ status: 200, description: "Taxonomy retrieved successfully" })
  @ApiResponse({ status: 404, description: "Taxonomy not found" })
  async findOne(
    @Param("categoryId") categoryId: string,
    @Query() query: GetTaxonomyOptionsDto,
  ) {
    return this.taxonomiesService.findOne(categoryId, query);
  }

  /**
   * GET /taxonomies/:categoryId/options
   * Get options for a taxonomy (for select dropdowns)
   */
  @Get(":categoryId/options")
  @SkipAuth()
  @ApiOperation({
    summary: "Get taxonomy options for dropdowns (Public)",
  })
  @ApiParam({
    name: "categoryId",
    description: "Taxonomy category ID",
    example: "make",
  })
  @ApiResponse({
    status: 200,
    description: "Taxonomy options retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Taxonomy not found" })
  async findOptions(
    @Param("categoryId") categoryId: string,
    @Query() query: GetTaxonomyOptionsDto,
  ) {
    return this.taxonomiesService.findOptions(categoryId, query);
  }

  /**
   * POST /taxonomies
   * Create new taxonomy category (admin)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create new taxonomy category (Admin only)" })
  @ApiResponse({ status: 201, description: "Taxonomy created successfully" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 409, description: "Taxonomy already exists" })
  async create(@Body() createTaxonomyDto: CreateTaxonomyDto) {
    return this.taxonomiesService.create(createTaxonomyDto);
  }

  /**
   * PATCH /taxonomies/:categoryId
   * Update taxonomy metadata or replace full options
   */
  @Patch(":categoryId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update taxonomy (Admin only)" })
  @ApiParam({
    name: "categoryId",
    description: "Taxonomy category ID",
    example: "make",
  })
  @ApiResponse({ status: 200, description: "Taxonomy updated successfully" })
  @ApiResponse({ status: 404, description: "Taxonomy not found" })
  async update(
    @Param("categoryId") categoryId: string,
    @Body() updateTaxonomyDto: UpdateTaxonomyDto,
  ) {
    return this.taxonomiesService.update(categoryId, updateTaxonomyDto);
  }

  /**
   * POST /taxonomies/:categoryId/options
   * Add one or more options to a taxonomy
   */
  @Post(":categoryId/options")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add options to taxonomy (Admin only)" })
  @ApiParam({
    name: "categoryId",
    description: "Taxonomy category ID",
    example: "make",
  })
  @ApiResponse({ status: 201, description: "Options added successfully" })
  @ApiResponse({ status: 404, description: "Taxonomy not found" })
  @ApiResponse({ status: 409, description: "Option ID or value conflicts" })
  async addOptions(
    @Param("categoryId") categoryId: string,
    @Body() addOptionsDto: AddTaxonomyOptionsDto,
  ) {
    return this.taxonomiesService.addOptions(categoryId, addOptionsDto);
  }

  /**
   * PATCH /taxonomies/:categoryId/options/:optionId
   * Update a single option (label, slug, isActive, etc.)
   */
  @Patch(":categoryId/options/:optionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update taxonomy option (Admin only)" })
  @ApiParam({
    name: "categoryId",
    description: "Taxonomy category ID",
    example: "make",
  })
  @ApiParam({
    name: "optionId",
    description: "Option ID",
    example: 1,
  })
  @ApiResponse({ status: 200, description: "Option updated successfully" })
  @ApiResponse({ status: 404, description: "Taxonomy or option not found" })
  async updateOption(
    @Param("categoryId") categoryId: string,
    @Param("optionId", ParseIntPipe) optionId: number,
    @Body() updateOptionDto: UpdateTaxonomyOptionDto,
  ) {
    return this.taxonomiesService.updateOption(
      categoryId,
      optionId,
      updateOptionDto,
    );
  }

  /**
   * DELETE /taxonomies/:categoryId/options/:optionId
   * Soft-delete / disable an option (set isActive = false)
   */
  @Delete(":categoryId/options/:optionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete taxonomy option (Admin only)" })
  @ApiParam({
    name: "categoryId",
    description: "Taxonomy category ID",
    example: "make",
  })
  @ApiParam({
    name: "optionId",
    description: "Option ID",
    example: 1,
  })
  @ApiResponse({ status: 204, description: "Option disabled successfully" })
  @ApiResponse({ status: 404, description: "Taxonomy or option not found" })
  async deleteOption(
    @Param("categoryId") categoryId: string,
    @Param("optionId", ParseIntPipe) optionId: number,
  ) {
    await this.taxonomiesService.deleteOption(categoryId, optionId);
  }
}
