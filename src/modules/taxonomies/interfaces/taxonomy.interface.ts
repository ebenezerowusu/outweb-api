/**
 * Taxonomy Document Interface
 * Represents a category of taxonomy options (make, model, color, etc.)
 * Container: taxonomies
 * Partition Key: /category
 * Unique Key: /id
 */
export interface TaxonomyDocument {
  id: string;
  category: string;
  order: number;
  options: TaxonomyOption[];
}

/**
 * Taxonomy Option
 * Represents a single option within a taxonomy category
 */
export interface TaxonomyOption {
  id: number;
  label: string;
  value: string;
  slug?: string;
  order: number;
  isActive: boolean;
  // Optional fields for specific taxonomies
  make?: string; // For model taxonomy
  [key: string]: any; // Allow additional fields
}

/**
 * Public Taxonomy (safe for API responses)
 */
export type PublicTaxonomy = TaxonomyDocument;

/**
 * Lightweight taxonomy summary (for list endpoint)
 */
export interface TaxonomySummary {
  id: string;
  category: string;
  order: number;
  optionCount: number;
}

/**
 * SEO-focused taxonomy option
 */
export interface SeoTaxonomyOption {
  slug: string;
  label: string;
  value: string;
  id: number;
}

/**
 * SEO Context for listings
 */
export interface SeoListingContext {
  title: string;
  description: string;
  canonicalPath: string;
  breadcrumbs: SeoBreadcrumb[];
  context: Record<string, { label: string; slug: string }>;
}

/**
 * SEO Breadcrumb
 */
export interface SeoBreadcrumb {
  label: string;
  path: string;
}
