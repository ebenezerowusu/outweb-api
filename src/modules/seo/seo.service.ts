import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CosmosService } from '@/common/services/cosmos.service';
import {
  TaxonomyDocument,
  TaxonomyOption,
  SeoTaxonomyOption,
  SeoListingContext,
  SeoBreadcrumb,
} from '../taxonomies/interfaces/taxonomy.interface';
import { SeoListingContextDto } from './dto/seo.dto';

/**
 * SEO Service
 * Handles SEO metadata generation using taxonomy slugs
 */
@Injectable()
export class SeoService {
  private readonly TAXONOMIES_CONTAINER = 'taxonomies';

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * GET /seo/taxonomies/:categoryId
   * SEO-ready options (slugs + labels) for one taxonomy
   */
  async getTaxonomySeo(categoryId: string): Promise<{
    categoryId: string;
    options: SeoTaxonomyOption[];
  }> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      categoryId,
      categoryId,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Taxonomy '${categoryId}' not found`,
      });
    }

    // Filter active options and map to SEO format
    const options: SeoTaxonomyOption[] = taxonomy.options
      .filter((opt) => opt.isActive)
      .map((opt) => ({
        slug: opt.slug || this.generateSlug(opt.value),
        label: opt.label,
        value: opt.value,
        id: opt.id,
      }));

    return {
      categoryId: taxonomy.id,
      options,
    };
  }

  /**
   * GET /seo/taxonomies/:categoryId/:slug
   * Resolve a single slug → label + internal value
   */
  async resolveTaxonomySlug(
    categoryId: string,
    slug: string,
  ): Promise<{
    categoryId: string;
    option: SeoTaxonomyOption | null;
  }> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      categoryId,
      categoryId,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Taxonomy '${categoryId}' not found`,
      });
    }

    // Find option by slug
    const option = taxonomy.options.find(
      (opt) =>
        opt.isActive &&
        (opt.slug === slug || this.generateSlug(opt.value) === slug),
    );

    if (!option) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Option with slug '${slug}' not found in taxonomy '${categoryId}'`,
      });
    }

    return {
      categoryId: taxonomy.id,
      option: {
        slug: option.slug || this.generateSlug(option.value),
        label: option.label,
        value: option.value,
        id: option.id,
      },
    };
  }

  /**
   * POST /seo/listings/context
   * Build meta title, description, canonical from taxonomy slugs
   */
  async buildListingContext(
    dto: SeoListingContextDto,
  ): Promise<SeoListingContext> {
    const context: Record<string, { label: string; slug: string }> = {};
    const errors: string[] = [];

    // Resolve all provided slugs
    if (dto.makeSlug) {
      try {
        const result = await this.resolveTaxonomySlug('make', dto.makeSlug);
        if (result.option) {
          context.make = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(`Invalid makeSlug: ${dto.makeSlug}`);
      }
    }

    if (dto.modelSlug) {
      try {
        const result = await this.resolveTaxonomySlug('model', dto.modelSlug);
        if (result.option) {
          context.model = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(`Invalid modelSlug: ${dto.modelSlug}`);
      }
    }

    if (dto.trimSlug) {
      try {
        const result = await this.resolveTaxonomySlug('trim', dto.trimSlug);
        if (result.option) {
          context.trim = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(`Invalid trimSlug: ${dto.trimSlug}`);
      }
    }

    if (dto.bodyStyleSlug) {
      try {
        const result = await this.resolveTaxonomySlug(
          'bodyStyle',
          dto.bodyStyleSlug,
        );
        if (result.option) {
          context.bodyStyle = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(`Invalid bodyStyleSlug: ${dto.bodyStyleSlug}`);
      }
    }

    if (dto.countrySlug) {
      try {
        const result = await this.resolveTaxonomySlug(
          'country',
          dto.countrySlug,
        );
        if (result.option) {
          context.country = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(`Invalid countrySlug: ${dto.countrySlug}`);
      }
    }

    if (dto.conditionSlug) {
      try {
        const result = await this.resolveTaxonomySlug(
          'condition',
          dto.conditionSlug,
        );
        if (result.option) {
          context.condition = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(`Invalid conditionSlug: ${dto.conditionSlug}`);
      }
    }

    if (dto.colorSlug) {
      try {
        const result = await this.resolveTaxonomySlug('color', dto.colorSlug);
        if (result.option) {
          context.color = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(`Invalid colorSlug: ${dto.colorSlug}`);
      }
    }

    if (dto.vehicleConditionSlug) {
      try {
        const result = await this.resolveTaxonomySlug(
          'vehicleCondition',
          dto.vehicleConditionSlug,
        );
        if (result.option) {
          context.vehicleCondition = {
            label: result.option.label,
            slug: result.option.slug,
          };
        }
      } catch (error) {
        errors.push(
          `Invalid vehicleConditionSlug: ${dto.vehicleConditionSlug}`,
        );
      }
    }

    // If any errors, throw bad request
    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid slug(s) provided',
        errors,
      });
    }

    // Build SEO metadata
    const title = this.buildTitle(context);
    const description = this.buildDescription(context);
    const canonicalPath = this.buildCanonicalPath(context);
    const breadcrumbs = this.buildBreadcrumbs(context);

    return {
      title,
      description,
      canonicalPath,
      breadcrumbs,
      context,
    };
  }

  /**
   * GET /seo/listings/:makeSlug/:modelSlug
   * SEO metadata for make + model combination
   */
  async getModelSeo(
    makeSlug: string,
    modelSlug: string,
  ): Promise<SeoListingContext> {
    return this.buildListingContext({
      makeSlug,
      modelSlug,
    });
  }

  /**
   * GET /seo/listings/:makeSlug/:modelSlug/:trimSlug
   * SEO metadata for make + model + trim combination
   */
  async getTrimSeo(
    makeSlug: string,
    modelSlug: string,
    trimSlug: string,
  ): Promise<SeoListingContext> {
    return this.buildListingContext({
      makeSlug,
      modelSlug,
      trimSlug,
    });
  }

  /**
   * Helper: Build SEO title
   */
  private buildTitle(context: Record<string, { label: string; slug: string }>): string {
    const parts: string[] = [];

    if (context.vehicleCondition) {
      parts.push(context.vehicleCondition.label);
    } else if (context.condition) {
      parts.push(context.condition.label);
    }

    if (context.make) parts.push(context.make.label);
    if (context.model) parts.push(context.model.label);
    if (context.trim) parts.push(context.trim.label);
    if (context.bodyStyle) parts.push(context.bodyStyle.label);

    parts.push('for Sale');

    if (context.country) parts.push(`in ${context.country.label}`);
    if (context.color) parts.push(`– ${context.color.label}`);

    const title = parts.join(' ') + ' | OnlyUsedTesla';

    return title;
  }

  /**
   * Helper: Build SEO description
   */
  private buildDescription(
    context: Record<string, { label: string; slug: string }>,
  ): string {
    const parts: string[] = ['Browse verified'];

    if (context.vehicleCondition) {
      parts.push(context.vehicleCondition.label.toLowerCase());
    } else if (context.condition) {
      parts.push(context.condition.label.toLowerCase());
    }

    if (context.make) parts.push(context.make.label);
    if (context.model) parts.push(context.model.label);
    if (context.bodyStyle) parts.push(context.bodyStyle.label);

    parts.push('listings');

    if (context.country) parts.push(`in ${context.country.label}`);
    if (context.color) parts.push(`with ${context.color.label} exterior`);

    parts.push(
      '. Compare prices, trims, features and dealer offers on OnlyUsedTesla.',
    );

    return parts.join(' ');
  }

  /**
   * Helper: Build canonical path
   */
  private buildCanonicalPath(
    context: Record<string, { label: string; slug: string }>,
  ): string {
    const parts: string[] = [];

    if (context.vehicleCondition) {
      parts.push(context.vehicleCondition.slug);
    } else if (context.condition) {
      parts.push(context.condition.slug);
    }

    if (context.make) parts.push(context.make.slug);
    if (context.model) parts.push(context.model.slug);
    if (context.trim) parts.push(context.trim.slug);
    if (context.bodyStyle) parts.push(context.bodyStyle.slug);
    if (context.country) parts.push(context.country.slug);
    if (context.color) parts.push(context.color.slug);

    return '/' + parts.filter(Boolean).join('/');
  }

  /**
   * Helper: Build breadcrumbs
   */
  private buildBreadcrumbs(
    context: Record<string, { label: string; slug: string }>,
  ): SeoBreadcrumb[] {
    const breadcrumbs: SeoBreadcrumb[] = [
      { label: 'Home', path: '/' },
    ];

    let path = '';

    if (context.vehicleCondition) {
      path += `/${context.vehicleCondition.slug}`;
      breadcrumbs.push({
        label: context.vehicleCondition.label,
        path,
      });
    } else if (context.condition) {
      path += `/${context.condition.slug}`;
      breadcrumbs.push({
        label: context.condition.label,
        path,
      });
    }

    if (context.make) {
      path += `/${context.make.slug}`;
      breadcrumbs.push({
        label: context.make.label,
        path,
      });
    }

    if (context.model) {
      path += `/${context.model.slug}`;
      breadcrumbs.push({
        label: context.model.label,
        path,
      });
    }

    if (context.trim) {
      path += `/${context.trim.slug}`;
      breadcrumbs.push({
        label: context.trim.label,
        path,
      });
    }

    if (context.bodyStyle) {
      path += `/${context.bodyStyle.slug}`;
      breadcrumbs.push({
        label: context.bodyStyle.label,
        path,
      });
    }

    if (context.country) {
      path += `/${context.country.slug}`;
      breadcrumbs.push({
        label: context.country.label,
        path,
      });
    }

    return breadcrumbs;
  }

  /**
   * Helper: Generate slug from string
   */
  private generateSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
