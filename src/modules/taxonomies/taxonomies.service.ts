import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CosmosService } from '@/common/services/cosmos.service';
import { PaginatedResponse } from '@/common/types/pagination.type';
import { TaxonomyDocument, PublicTaxonomy, TaxonomyCategory } from './interfaces/taxonomy.interface';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import {
  UpdateTaxonomyDto,
  UpdateTaxonomyStatusDto,
  BulkUpdateTaxonomiesDto,
} from './dto/update-taxonomy.dto';
import { QueryTaxonomiesDto, SuggestTaxonomiesDto } from './dto/query-taxonomy.dto';

/**
 * Taxonomies Service
 * Handles vehicle classifications and attributes
 */
@Injectable()
export class TaxonomiesService {
  private readonly TAXONOMIES_CONTAINER = 'taxonomies';

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * List taxonomies with filters and pagination
   */
  async findAll(query: QueryTaxonomiesDto): Promise<PaginatedResponse<PublicTaxonomy>> {
    let sqlQuery = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    // Filter by category
    if (query.category) {
      sqlQuery += ' AND c.category = @category';
      parameters.push({ name: '@category', value: query.category });
    }

    // Filter by parent ID
    if (query.parentId) {
      sqlQuery += ' AND c.parent.id = @parentId';
      parameters.push({ name: '@parentId', value: query.parentId });
    }

    // Search by name or slug
    if (query.search) {
      sqlQuery += ' AND (CONTAINS(LOWER(c.name), @search) OR CONTAINS(LOWER(c.slug), @search))';
      parameters.push({ name: '@search', value: query.search.toLowerCase() });
    }

    // Filter by active status
    if (query.isActive !== undefined) {
      sqlQuery += ' AND c.status.isActive = @isActive';
      parameters.push({ name: '@isActive', value: query.isActive });
    }

    // Filter by visibility status
    if (query.isVisible !== undefined) {
      sqlQuery += ' AND c.status.isVisible = @isVisible';
      parameters.push({ name: '@isVisible', value: query.isVisible });
    }

    // Filter by popular status
    if (query.isPopular !== undefined) {
      sqlQuery += ' AND c.attributes.isPopular = @isPopular';
      parameters.push({ name: '@isPopular', value: query.isPopular });
    }

    // Order by display order, then name
    sqlQuery += ' ORDER BY c.attributes.displayOrder ASC, c.name ASC';

    const { items, continuationToken } = await this.cosmosService.queryItems<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      sqlQuery,
      parameters,
      query.limit,
      query.cursor,
    );

    return {
      items: items.map((taxonomy) => this.toPublicTaxonomy(taxonomy)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Get single taxonomy by ID
   */
  async findOne(id: string): Promise<PublicTaxonomy> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      id,
      id,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Taxonomy not found',
      });
    }

    return this.toPublicTaxonomy(taxonomy);
  }

  /**
   * Get taxonomy by slug
   */
  async findBySlug(category: string, slug: string): Promise<PublicTaxonomy> {
    const query = 'SELECT * FROM c WHERE c.category = @category AND c.slug = @slug';
    const parameters = [
      { name: '@category', value: category },
      { name: '@slug', value: slug },
    ];

    const { items } = await this.cosmosService.queryItems<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      query,
      parameters,
      1,
    );

    if (items.length === 0) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Taxonomy not found',
      });
    }

    return this.toPublicTaxonomy(items[0]);
  }

  /**
   * Create new taxonomy
   */
  async create(dto: CreateTaxonomyDto, createdBy: string): Promise<PublicTaxonomy> {
    // Generate slug if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check for duplicate slug within the same category
    const duplicateQuery = 'SELECT * FROM c WHERE c.category = @category AND c.slug = @slug';
    const { items: duplicates } = await this.cosmosService.queryItems<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      duplicateQuery,
      [
        { name: '@category', value: dto.category },
        { name: '@slug', value: slug },
      ],
      1,
    );

    if (duplicates.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Taxonomy with slug '${slug}' already exists in category '${dto.category}'`,
      });
    }

    // Handle parent taxonomy if provided
    let parent: { id: string; name: string; slug: string; category: TaxonomyCategory } | null = null;
    let hierarchyLevel = 0;
    let hierarchyPath: string[] = [];

    if (dto.parentId) {
      const parentTaxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
        this.TAXONOMIES_CONTAINER,
        dto.parentId,
        dto.parentId,
      );

      if (!parentTaxonomy) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Parent taxonomy not found',
        });
      }

      parent = {
        id: parentTaxonomy.id,
        name: parentTaxonomy.name,
        slug: parentTaxonomy.slug,
        category: parentTaxonomy.category,
      };

      hierarchyLevel = parentTaxonomy.hierarchy.level + 1;
      hierarchyPath = [...parentTaxonomy.hierarchy.path, parentTaxonomy.id];
    }

    const now = new Date().toISOString();
    const taxonomyId = this.cosmosService.generateId();

    const taxonomy: TaxonomyDocument = {
      id: taxonomyId,
      type: 'taxonomy',
      category: dto.category,
      name: dto.name,
      slug: slug,
      description: dto.description || null,
      parent: parent,
      hierarchy: {
        level: hierarchyLevel,
        path: hierarchyPath,
        hasChildren: false,
        childCount: 0,
      },
      attributes: {
        displayOrder: dto.displayOrder ?? 0,
        isPopular: dto.isPopular ?? false,
        usageCount: 0,
        metadata: dto.metadata || {},
      },
      seo: {
        metaTitle: dto.metaTitle || null,
        metaDescription: dto.metaDescription || null,
        metaKeywords: dto.metaKeywords || null,
      },
      status: {
        isActive: true,
        isVisible: true,
      },
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy,
        updatedBy: createdBy,
      },
    };

    const createdTaxonomy = await this.cosmosService.createItem(
      this.TAXONOMIES_CONTAINER,
      taxonomy,
    );

    // Update parent's child count if applicable
    if (parent) {
      await this.updateParentChildCount(parent.id);
    }

    return this.toPublicTaxonomy(createdTaxonomy);
  }

  /**
   * Update taxonomy
   */
  async update(
    id: string,
    dto: UpdateTaxonomyDto,
    updatedBy: string,
  ): Promise<PublicTaxonomy> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      id,
      id,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Taxonomy not found',
      });
    }

    // Update fields
    if (dto.name !== undefined) {
      taxonomy.name = dto.name;
      // Regenerate slug if name changes and no custom slug provided
      if (!dto.slug) {
        taxonomy.slug = this.generateSlug(dto.name);
      }
    }

    if (dto.slug !== undefined) {
      // Check for duplicate slug
      const duplicateQuery = 'SELECT * FROM c WHERE c.category = @category AND c.slug = @slug AND c.id != @id';
      const { items: duplicates } = await this.cosmosService.queryItems<TaxonomyDocument>(
        this.TAXONOMIES_CONTAINER,
        duplicateQuery,
        [
          { name: '@category', value: taxonomy.category },
          { name: '@slug', value: dto.slug },
          { name: '@id', value: id },
        ],
        1,
      );

      if (duplicates.length > 0) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: `Taxonomy with slug '${dto.slug}' already exists in category '${taxonomy.category}'`,
        });
      }

      taxonomy.slug = dto.slug;
    }

    if (dto.description !== undefined) {
      taxonomy.description = dto.description;
    }

    if (dto.displayOrder !== undefined) {
      taxonomy.attributes.displayOrder = dto.displayOrder;
    }

    if (dto.isPopular !== undefined) {
      taxonomy.attributes.isPopular = dto.isPopular;
    }

    if (dto.metaTitle !== undefined) {
      taxonomy.seo.metaTitle = dto.metaTitle;
    }

    if (dto.metaDescription !== undefined) {
      taxonomy.seo.metaDescription = dto.metaDescription;
    }

    if (dto.metaKeywords !== undefined) {
      taxonomy.seo.metaKeywords = dto.metaKeywords;
    }

    if (dto.metadata !== undefined) {
      taxonomy.attributes.metadata = { ...taxonomy.attributes.metadata, ...dto.metadata };
    }

    taxonomy.audit.updatedAt = new Date().toISOString();
    taxonomy.audit.updatedBy = updatedBy;

    const updatedTaxonomy = await this.cosmosService.updateItem(
      this.TAXONOMIES_CONTAINER,
      taxonomy,
      taxonomy.id,
    );

    return this.toPublicTaxonomy(updatedTaxonomy);
  }

  /**
   * Update taxonomy status
   */
  async updateStatus(id: string, dto: UpdateTaxonomyStatusDto): Promise<PublicTaxonomy> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      id,
      id,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Taxonomy not found',
      });
    }

    if (dto.isActive !== undefined) {
      taxonomy.status.isActive = dto.isActive;
    }

    if (dto.isVisible !== undefined) {
      taxonomy.status.isVisible = dto.isVisible;
    }

    taxonomy.audit.updatedAt = new Date().toISOString();

    const updatedTaxonomy = await this.cosmosService.updateItem(
      this.TAXONOMIES_CONTAINER,
      taxonomy,
      taxonomy.id,
    );

    return this.toPublicTaxonomy(updatedTaxonomy);
  }

  /**
   * Bulk update taxonomies
   */
  async bulkUpdate(dto: BulkUpdateTaxonomiesDto): Promise<{ updated: number }> {
    let updateCount = 0;

    for (const id of dto.ids) {
      try {
        const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
          this.TAXONOMIES_CONTAINER,
          id,
          id,
        );

        if (taxonomy) {
          if (dto.isActive !== undefined) {
            taxonomy.status.isActive = dto.isActive;
          }
          if (dto.isVisible !== undefined) {
            taxonomy.status.isVisible = dto.isVisible;
          }
          if (dto.isPopular !== undefined) {
            taxonomy.attributes.isPopular = dto.isPopular;
          }

          taxonomy.audit.updatedAt = new Date().toISOString();

          await this.cosmosService.updateItem(
            this.TAXONOMIES_CONTAINER,
            taxonomy,
            taxonomy.id,
          );

          updateCount++;
        }
      } catch (error) {
        // Continue with next item on error
        continue;
      }
    }

    return { updated: updateCount };
  }

  /**
   * Delete taxonomy
   */
  async delete(id: string): Promise<void> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      id,
      id,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Taxonomy not found',
      });
    }

    // Check if taxonomy has children
    if (taxonomy.hierarchy.hasChildren && taxonomy.hierarchy.childCount > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Cannot delete taxonomy with children',
      });
    }

    // TODO: Implement delete in CosmosService
    // await this.cosmosService.deleteItem(this.TAXONOMIES_CONTAINER, id, id);

    // Update parent's child count if applicable
    if (taxonomy.parent) {
      await this.updateParentChildCount(taxonomy.parent.id);
    }
  }

  /**
   * Autocomplete/suggest taxonomies
   */
  async suggest(dto: SuggestTaxonomiesDto): Promise<PublicTaxonomy[]> {
    let sqlQuery = 'SELECT * FROM c WHERE c.category = @category AND c.status.isActive = true AND c.status.isVisible = true';
    const parameters: any[] = [{ name: '@category', value: dto.category }];

    // Add search filter
    sqlQuery += ' AND (STARTSWITH(LOWER(c.name), @query) OR CONTAINS(LOWER(c.name), @query))';
    parameters.push({ name: '@query', value: dto.query.toLowerCase() });

    // Filter by parent if provided
    if (dto.parentId) {
      sqlQuery += ' AND c.parent.id = @parentId';
      parameters.push({ name: '@parentId', value: dto.parentId });
    }

    // Order by popularity and usage
    sqlQuery += ' ORDER BY c.attributes.isPopular DESC, c.attributes.usageCount DESC, c.name ASC';

    const { items } = await this.cosmosService.queryItems<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      sqlQuery,
      parameters,
      dto.limit,
    );

    return items.map((taxonomy) => this.toPublicTaxonomy(taxonomy));
  }

  /**
   * Update parent taxonomy's child count
   */
  private async updateParentChildCount(parentId: string): Promise<void> {
    const parent = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      parentId,
      parentId,
    );

    if (parent) {
      // Count children
      const query = 'SELECT VALUE COUNT(1) FROM c WHERE c.parent.id = @parentId';
      const { items } = await this.cosmosService.queryItems<number>(
        this.TAXONOMIES_CONTAINER,
        query,
        [{ name: '@parentId', value: parentId }],
        1,
      );

      const childCount = items[0] || 0;
      parent.hierarchy.childCount = childCount;
      parent.hierarchy.hasChildren = childCount > 0;

      await this.cosmosService.updateItem(
        this.TAXONOMIES_CONTAINER,
        parent,
        parent.id,
      );
    }
  }

  /**
   * Helper: Convert TaxonomyDocument to PublicTaxonomy
   */
  private toPublicTaxonomy(taxonomy: TaxonomyDocument): PublicTaxonomy {
    return taxonomy;
  }
}
