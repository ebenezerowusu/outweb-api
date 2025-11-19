/**
 * Taxonomy Document Interface
 * Represents vehicle classifications and attributes
 */
export interface TaxonomyDocument {
  id: string;
  type: 'taxonomy';
  category: TaxonomyCategory;
  name: string;
  slug: string;
  description: string | null;
  parent: TaxonomyParent | null;
  hierarchy: TaxonomyHierarchy;
  attributes: TaxonomyAttributes;
  seo: TaxonomySeo;
  status: TaxonomyStatus;
  audit: TaxonomyAudit;
}

/**
 * Taxonomy Categories
 */
export type TaxonomyCategory =
  | 'make'
  | 'model'
  | 'trim'
  | 'year'
  | 'color'
  | 'interior_color'
  | 'body_type'
  | 'drivetrain'
  | 'battery_size'
  | 'feature'
  | 'condition';

/**
 * Taxonomy Parent Reference
 */
export interface TaxonomyParent {
  id: string;
  name: string;
  slug: string;
  category: TaxonomyCategory;
}

/**
 * Taxonomy Hierarchy
 */
export interface TaxonomyHierarchy {
  level: number;
  path: string[];
  hasChildren: boolean;
  childCount: number;
}

/**
 * Taxonomy Attributes
 */
export interface TaxonomyAttributes {
  displayOrder: number;
  isPopular: boolean;
  usageCount: number;
  metadata: Record<string, any>;
}

/**
 * Taxonomy SEO
 */
export interface TaxonomySeo {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[] | null;
}

/**
 * Taxonomy Status
 */
export interface TaxonomyStatus {
  isActive: boolean;
  isVisible: boolean;
}

/**
 * Taxonomy Audit Trail
 */
export interface TaxonomyAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Public Taxonomy (safe for API responses)
 */
export type PublicTaxonomy = TaxonomyDocument;
