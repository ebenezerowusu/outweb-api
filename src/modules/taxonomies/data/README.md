# Taxonomy Data

This directory contains the comprehensive taxonomy data for the OnlyUsedTesla marketplace.

## Files

### `taxonomy-seed.data.ts`

Contains all taxonomy categories and their options:

- **listingStatus** - Listing statuses (Published, Pending, Sold, etc.)
- **saleTypes** - Sale types (ForSale, Lease, CashOffer, etc.)
- **sellerType** - Seller types (Dealer, Private)
- **make** - Vehicle makes (Tesla)
- **model** - Vehicle models (Model S, Model X, Model 3, Model Y, Cybertruck, etc.)
- **color** - Vehicle colors (32 options)
- **condition** - Vehicle conditions (Excellent, Very Good, Good, Fair, Poor)
- **country** - Supported countries (USA, UK, Canada, Ghana)
- **trim** - Vehicle trims (46 options including 100D, P85D, Long Range, Plaid, etc.)
- **autopilotPackage** - Autopilot packages (Autopilot 1, 2, FSD, HW versions)
- **dealerBrand** - Dealer brands (33 dealer options)
- **wheelType** - Wheel types (19", 20", 22" options)
- **interiorColor** - Interior colors (Black Premium, Cream Premium, Tan Leather)
- **exteriorColor** - Exterior colors (4 primary options)
- **drivetrain** - Drivetrain types (AWD, RWD)
- **bodyStyle** - Body styles (Sedan, SUV, Truck)
- **insuranceCategory** - Insurance categories (Unspecified, Clean, Salvage, Rebuilt)
- **chargingConnector** - Charging connectors (Type 1, Type 2, CCS, CHAdeMO, Tesla Supercharger)
- **vehicleCondition** - Vehicle condition (New, Used, Certified Pre-Owned)
- **vehicleHistoryReport** - History report providers (Carfax, AutoCheck, None)
- **vehicleModel** - Extended vehicle model classifications (44 options)
- **batterySize** - Battery sizes (Standard, Long Range)
- **hardwareVersion** - Hardware versions (HW-1.0 through HW-3.0)
- **feature** - Vehicle features (Sunroof, Leather Seats, Navigation, Bluetooth, Backup Camera)
- **whoYouRepresenting** - Seller representation types (Single Dealer, Group Dealer, Fleet, etc.)
- **businessType** - Business types (Single Dealer, Dealer group, OEM, Fleet, etc.)
- **syndicationSystem** - Syndication systems (vAuto, Authenticom, CDK Global, etc.)
- **publishTypes** - Publish types (Retail, WholeSale, CashOffer)

## Usage

```typescript
import { TAXONOMY_SEED_DATA, TAXONOMY_CATEGORIES, TaxonomyCategory } from './data';

// Get all taxonomy data
const allTaxonomies = TAXONOMY_SEED_DATA;

// Get specific taxonomy
const makesTaxonomy = TAXONOMY_SEED_DATA.find(t => t.id === 'make');

// Get all category names
const categories = TAXONOMY_CATEGORIES;
```

## Seeding Database

This data can be used to seed the Cosmos DB taxonomies container:

```typescript
import { CosmosService } from '@/common/services/cosmos.service';
import { TAXONOMY_SEED_DATA } from './data';

async function seedTaxonomies(cosmosService: CosmosService) {
  for (const taxonomy of TAXONOMY_SEED_DATA) {
    await cosmosService.upsertItem('taxonomies', taxonomy);
  }
}
```

## Data Structure

Each taxonomy document follows this structure:

```typescript
{
  id: string;              // Taxonomy category ID (e.g., 'make')
  category: string;        // Category name (same as id)
  order: number;           // Display order
  options: Array<{
    id: number;            // Option ID (unique within taxonomy)
    label: string;         // Display label
    value: string;         // Option value
    slug: string;          // URL-friendly slug
    order: number;         // Display order
    isActive: boolean;     // Whether option is active
    make?: string;         // Optional: For model taxonomy
    // Additional custom fields...
  }>;
}
```

## Notes

- All taxonomies are partitioned by `category` in Cosmos DB
- Each taxonomy category has a unique `id` that matches its `category` field
- Options within each taxonomy are ordered by the `order` field
- The `isActive` flag allows for soft deletion of options
- Some taxonomies (like `model`) have additional fields (like `make`) for filtering
