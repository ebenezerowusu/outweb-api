import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ListingsService } from "./listings.service";
import { CreateListingUnifiedDto } from "./dto/create-listing-unified.dto";

@ApiTags("Listings")
@ApiBearerAuth()
@Controller("listings")
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  /**
   * Create or update listing (handles both vehicles and listings containers)
   */
  @Post()
  @ApiOperation({
    summary: "Create or update listing",
    description:
      "Single payload creates/updates BOTH vehicle and listing. Vehicle: upserts by VIN. Listing: creates new if ownership changed, otherwise updates existing.",
  })
  @ApiResponse({
    status: 201,
    description:
      "Listing created/updated successfully with populated vehicle data",
  })
  async createOrUpdate(@Body() dto: CreateListingUnifiedDto) {
    return this.listingsService.createOrUpdate(dto);
  }

  /**
   * Get listing by ID with populated vehicle data
   */
  @Get(":id")
  @ApiOperation({
    summary: "Get listing by ID",
    description:
      "Retrieve listing with full vehicle data populated from vehicles container",
  })
  @ApiResponse({
    status: 200,
    description: "Listing with vehicle data retrieved successfully",
    schema: {
      example: {
        id: "list_789",
        shortId: "a0ae1",
        slug: "2016-tesla-model-x-90d-red",
        vehicleId: "veh_123",
        seller: {
          id: "seller_456",
          type: "dealer",
          displayName: "Tesla Fremont Inc.",
        },
        status: "Published",
        saleTypes: "ForSale",
        publishTypes: "WholeSale",
        price: { currency: "USD", amount: 49950 },
        // ... listing data
        vehicle: {
          id: "veh_123",
          vin: "5YJXCBE29GF012345",
          make: "Tesla",
          model: "Model X",
          trim: "90D",
          year: 2016,
          // ... full vehicle data
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Listing not found",
  })
  async findById(@Param("id") id: string) {
    return this.listingsService.findById(id);
  }
}
