# Taxonomy Reference

This document provides a comprehensive reference for all taxonomies available in the OnlyUsedTesla API.

## Overview

Taxonomies are standardized categories and options used throughout the API to ensure consistency. Each taxonomy has a unique ID and contains a list of options with labels, values, and slugs.

## Accessing Taxonomies

### Base Endpoints

- `GET /taxonomies` - List all available taxonomy categories
- `GET /taxonomies/:categoryId` - Get a specific taxonomy with all its options
- `GET /taxonomies/:categoryId/slug/:slug` - Get a specific option by its slug

## Available Taxonomies

### 1. Listing Status (`listingStatus`)
**Order:** 1
**Endpoint:** `/taxonomies/listingStatus`
**Options:**
- Published
- Pending
- Sold
- Expired
- Draft

**Used in:** Listings (query, state field)

---

### 2. Sale Types (`saleTypes`)
**Order:** 2
**Endpoint:** `/taxonomies/saleTypes`
**Options:**
- Cash
- Financing
- Lease
- Trade-in
- Other

**Used in:** Available for future use

---

### 3. Seller Type (`sellerType`)
**Order:** 3
**Endpoint:** `/taxonomies/sellerType`
**Options:**
- Dealer
- Private Seller

**Used in:** Sellers (create, update, query)

---

### 4. Make (`make`)
**Order:** 4
**Endpoint:** `/taxonomies/make`
**Options:**
- Tesla

**Used in:** Listings (create, query - makeId field)

---

### 5. Model (`model`)
**Order:** 5
**Endpoint:** `/taxonomies/model`
**Options:**
- Model S
- Model 3
- Model X
- Model Y
- Cybertruck
- Roadster

**Note:** Each model includes a `make` field (currently "Tesla")
**Used in:** Listings (create, query - modelId field)

---

### 6. Color (`color`)
**Order:** 6
**Endpoint:** `/taxonomies/color`
**Options:**
- Solid Black
- Midnight Silver Metallic
- Deep Blue Metallic
- Pearl White Multi-Coat
- Red Multi-Coat
- Other

**Used in:** General color reference

---

### 7. Condition (`condition`)
**Order:** 7
**Endpoint:** `/taxonomies/condition`
**Options:**
- Excellent
- Very Good
- Good
- Fair
- Poor

**Used in:** Listings (query - condition field)

---

### 8. Country (`country`)
**Order:** 8
**Endpoint:** `/taxonomies/country`
**Options:**
- United States
- Canada
- United Kingdom
- Germany
- France
- Other

**Used in:** Listings (location), SEO

---

### 9. Trim (`trim`)
**Order:** 9
**Endpoint:** `/taxonomies/trim`
**Options:**
- Standard Range
- Long Range
- Performance
- Plaid
- Plaid+
- Tri-Motor
- Dual Motor
- Single Motor
- Foundation Series
- Other

**Used in:** Listings (create - trimId field), SEO

---

### 10. Autopilot Package (`autopilotPackage`)
**Order:** 10
**Endpoint:** `/taxonomies/autopilotPackage`
**Options:**
- No Autopilot
- Standard Autopilot
- Enhanced Autopilot (EAP)
- Full Self-Driving (FSD)
- Full Self-Driving (FSD) Beta
- Autopilot 1.0 (AP1)
- Autopilot 2.0 (AP2)
- Autopilot 2.5 (AP2.5)
- Autopilot 3.0 (HW3)
- Autopilot 4.0 (HW4)
- Other

**Used in:** Listings (create - autopilotVersion field)

---

### 11. Dealer Brand (`dealerBrand`)
**Order:** 11
**Endpoint:** `/taxonomies/dealerBrand`
**Options:**
- Independent
- Franchise
- OEM-owned
- Group-affiliated
- Corporate-owned
- Private
- Other

**Used in:** Sellers (create, update - dealerType field)

---

### 12. Wheel Type (`wheelType`)
**Order:** 12
**Endpoint:** `/taxonomies/wheelType`
**Options:**
- 18" Aero Wheels
- 19" Sport Wheels
- 19" Tempest Wheels
- 20" Induction Wheels
- 20" Uberturbine Wheels
- 20" Cyberstream Wheels
- 21" Arachnid Wheels
- 21" Sonic Carbon Twin Turbine Wheels
- 22" Cyberstream Wheels
- Other

**Used in:** Listings (create - wheelTypeId field)

---

### 13. Interior Color (`interiorColor`)
**Order:** 13
**Endpoint:** `/taxonomies/interiorColor`
**Options:**
- Black
- White
- Cream
- Black and White
- Other

**Used in:** Listings (create, query - interiorColorId field)

---

### 14. Exterior Color (`exteriorColor`)
**Order:** 14
**Endpoint:** `/taxonomies/exteriorColor`
**Options:**
- Solid Black
- Midnight Silver Metallic
- Deep Blue Metallic
- Pearl White Multi-Coat
- Red Multi-Coat
- Quicksilver
- Ultra Red
- Stealth Grey
- Other

**Used in:** Listings (create, query - exteriorColorId field)

---

### 15. Drivetrain (`drivetrain`)
**Order:** 15
**Endpoint:** `/taxonomies/drivetrain`
**Options:**
- Rear-Wheel Drive (RWD)
- All-Wheel Drive (AWD)
- Dual Motor AWD
- Tri-Motor AWD
- Quad Motor AWD
- Other

**Used in:** Listings (create, query - drivetrainId field)

---

### 16. Body Style (`bodyStyle`)
**Order:** 16
**Endpoint:** `/taxonomies/bodyStyle`
**Options:**
- Sedan
- SUV
- Coupe
- Hatchback
- Pickup Truck
- Roadster
- Other

**Used in:** Listings (create, query - bodyTypeId field), SEO

---

### 17. Insurance Category (`insuranceCategory`)
**Order:** 17
**Endpoint:** `/taxonomies/insuranceCategory`
**Options:**
- Standard
- Premium
- Luxury
- High-Performance
- Electric Vehicle
- Commercial
- Other

**Used in:** Available for future use

---

### 18. Charging Connector (`chargingConnector`)
**Order:** 18
**Endpoint:** `/taxonomies/chargingConnector`
**Options:**
- Tesla Supercharger (North America)
- CCS Combo (Europe)
- CHAdeMO
- Type 2 (Mennekes)
- NACS (North American Charging Standard)
- Other

**Used in:** Available for future use

---

### 19. Vehicle Condition (`vehicleCondition`)
**Order:** 19
**Endpoint:** `/taxonomies/vehicleCondition`
**Options:**
- New
- Used
- Certified Pre-Owned
- Demo
- Salvage
- Rebuilt
- Other

**Used in:** SEO

---

### 20. Vehicle History Report (`vehicleHistoryReport`)
**Order:** 20
**Endpoint:** `/taxonomies/vehicleHistoryReport`
**Options:**
- Available
- Not Available
- Clean Title
- Salvage Title
- Rebuilt Title
- Flood Damage
- Accident Reported
- One Owner
- Personal Use Only
- Other

**Used in:** Available for future use

---

### 21. Vehicle Model (`vehicleModel`)
**Order:** 21
**Endpoint:** `/taxonomies/vehicleModel`
**Options:**
- Standard Range
- Long Range
- Performance
- Plaid
- Plaid+
- Tri-Motor
- Dual Motor
- Single Motor
- Foundation Series
- Other

**Note:** Similar to trim, used for specific model variants
**Used in:** Available for future use

---

### 22. Battery Size (`batterySize`)
**Order:** 22
**Endpoint:** `/taxonomies/batterySize`
**Options:**
- 50 kWh
- 60 kWh
- 70 kWh
- 75 kWh
- 85 kWh
- 90 kWh
- 100 kWh
- Other

**Used in:** Listings (create - batterySizeId field)

---

### 23. Hardware Version (`hardwareVersion`)
**Order:** 23
**Endpoint:** `/taxonomies/hardwareVersion`
**Options:**
- HW 1.0 (AP1)
- HW 2.0 (AP2)
- HW 2.5 (AP2.5)
- HW 3.0 (FSD Computer)
- HW 4.0 (AI4)
- MCU 1
- MCU 2
- MCU 3 (Ryzen)
- Other

**Used in:** Available for future use

---

### 24. Feature (`feature`)
**Order:** 24
**Endpoint:** `/taxonomies/feature`
**Options:**
- Premium Interior
- Glass Roof
- Heated Seats
- Ventilated Seats
- Premium Audio
- Autopilot
- Full Self-Driving
- Supercharger Access
- Air Suspension
- Ludicrous Mode
- Track Mode
- Bioweapon Defense Mode
- Sentry Mode
- Summon
- Navigate on Autopilot
- Auto Lane Change
- Autopark
- Smart Summon
- Dog Mode
- Camp Mode
- Dashcam
- Other

**Used in:** Listings (query - features field as array)

---

### 25. Who You Representing (`whoYouRepresenting`)
**Order:** 25
**Endpoint:** `/taxonomies/whoYouRepresenting`
**Options:**
- Single Dealer
- Group Dealer
- Fleet Operator
- Financial Company
- Rental Company
- Other

**Used in:** Auth (signup-dealer - whoAreYouRepresenting field)

---

### 26. Business Type (`businessType`)
**Order:** 26
**Endpoint:** `/taxonomies/businessType`
**Options:**
- Single Dealer
- Dealer group
- Group-affiliated dealership
- Franchise dealership
- OEM
- Fleet
- Vendor
- Other

**Used in:** Auth (signup-dealer), Sellers (create, update)

---

### 27. Syndication System (`syndicationSystem`)
**Order:** 27
**Endpoint:** `/taxonomies/syndicationSystem`
**Options:**
- vAuto
- Authenticom
- Dealertrack
- HomeNet
- CDK Global
- AutoManager
- Chrome Inventory
- ReyRey
- CDKDrive
- Dealer eProcess
- DealerSocket
- Dominion
- Elead
- Frazer
- VinSolutions
- Xtime
- Other

**Used in:** Auth (signup-dealer), Sellers (create, update)

---

### 28. Publish Types (`publishTypes`)
**Order:** 28
**Endpoint:** `/taxonomies/publishTypes`
**Options:**
- Public
- Private
- Draft
- Scheduled
- Archived
- Unlisted
- Other

**Used in:** Available for future use

---

## Usage Guidelines

### In API Requests

When creating or updating resources, use the taxonomy option values (not IDs) in your request bodies:

```json
{
  "makeId": "make",
  "modelId": "model",
  "exteriorColorId": "exteriorColor",
  "condition": "Excellent",
  "state": "Published"
}
```

### In Swagger Documentation

All DTOs include references to taxonomy endpoints in their descriptions:

```typescript
@ApiProperty({
  description: "Vehicle make taxonomy ID (use /taxonomies/make for options)",
  example: "make",
})
```

### For Filtering

Many query DTOs support filtering by taxonomy values:

```
GET /listings?condition=Excellent&state=Published&makeId=make
```

### SEO Integration

The SEO module uses taxonomy slugs to generate meta titles, descriptions, and breadcrumbs:

```
GET /seo/listings/context?makeSlug=tesla&modelSlug=model-s&trimSlug=plaid
```

## Best Practices

1. **Always validate against taxonomies**: Use the taxonomy endpoints to populate dropdowns and validate user input
2. **Use slugs for SEO**: When building URLs or SEO content, use the slug field from taxonomy options
3. **Reference the endpoint**: Include the taxonomy endpoint in your API documentation
4. **Handle "Other"**: Most taxonomies include an "Other" option for edge cases
5. **Cache taxonomies**: Taxonomy data rarely changes, so cache it on the client side
6. **Check isActive**: Only show options where `isActive: true`

## Adding New Taxonomy Options

New taxonomy options can be added via the Taxonomies API:

```
POST /taxonomies/:categoryId/options
```

This requires admin privileges and should follow the existing taxonomy structure.

## Seeding Taxonomies

To seed all taxonomies into the database:

```bash
npm run seed:taxonomies
```

This will populate the Cosmos DB with all taxonomy data from `src/modules/taxonomies/data/taxonomy-seed.data.ts`.

## Questions?

For more information about the taxonomy system, see:
- `/src/modules/taxonomies/data/README.md` - Implementation details
- `/src/modules/taxonomies/interfaces/taxonomy.interface.ts` - TypeScript interfaces
- API Documentation at `/api` - Interactive Swagger UI
