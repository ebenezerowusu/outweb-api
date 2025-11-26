import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosService } from '@/common/services/cosmos.service';
import {
  ListingOfferDocument,
  PublicOffer,
  OfferState,
  OfferHistoryEntry,
  OfferStatistics,
  OfferTerms,
} from './interfaces/listing-offer.interface';
import { CreateListingOfferDto } from './dto/create-listing-offer.dto';
import {
  AcceptOfferDto,
  RejectOfferDto,
  CounterOfferDto,
  WithdrawOfferDto,
} from './dto/update-listing-offer.dto';
import { QueryListingOffersDto } from './dto/query-listing-offer.dto';
import { ListingDocument } from '../listings/interfaces/listing.interface';

const OFFERS_CONTAINER = 'ListingOffers';
const LISTINGS_CONTAINER = 'listings';

@Injectable()
export class ListingOffersService {
  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * List offers with filters
   */
  async findAll(query: QueryListingOffersDto): Promise<{ items: PublicOffer[]; continuationToken?: string }> {
    const {
      listingId,
      buyerId,
      sellerId,
      state,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      continuationToken,
    } = query;

    const conditions: string[] = ["c.type = 'listing_offer'"];
    const parameters: Array<{ name: string; value: any }> = [];

    if (listingId) {
      conditions.push('c.listingId = @listingId');
      parameters.push({ name: '@listingId', value: listingId });
    }

    if (buyerId) {
      conditions.push('c.buyerId = @buyerId');
      parameters.push({ name: '@buyerId', value: buyerId });
    }

    if (sellerId) {
      conditions.push('c.sellerId = @sellerId');
      parameters.push({ name: '@sellerId', value: sellerId });
    }

    if (state) {
      conditions.push('c.status.state = @state');
      parameters.push({ name: '@state', value: state });
    }

    if (minAmount !== undefined) {
      conditions.push('c.offer.amount >= @minAmount');
      parameters.push({ name: '@minAmount', value: minAmount });
    }

    if (maxAmount !== undefined) {
      conditions.push('c.offer.amount <= @maxAmount');
      parameters.push({ name: '@maxAmount', value: maxAmount });
    }

    const orderByField = sortBy === 'amount' ? 'c.offer.amount' : 'c.audit.createdAt';
    const orderByClause = `ORDER BY ${orderByField} ${sortOrder.toUpperCase()}`;
    const querySpec = `SELECT * FROM c WHERE ${conditions.join(' AND ')} ${orderByClause}`;

    const { items, continuationToken: nextToken } = await this.cosmosService.queryItems<ListingOfferDocument>(
      OFFERS_CONTAINER,
      querySpec,
      parameters,
      limit,
      continuationToken,
    );

    return {
      items,
      continuationToken: nextToken,
    };
  }

  /**
   * Get offer by ID
   */
  async findOne(id: string, userId: string, hasAdminPermission: boolean): Promise<PublicOffer> {
    const offer = await this.cosmosService.getItem<ListingOfferDocument>(OFFERS_CONTAINER, id, id);

    if (!offer) {
      throw new NotFoundException({ message: 'Offer not found' });
    }

    // Check ownership: only buyer, seller, or admin can view
    if (!hasAdminPermission && offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException({ message: 'You do not have permission to view this offer' });
    }

    // Mark as viewed by seller if applicable
    if (offer.sellerId === userId && !offer.audit.viewedBySeller) {
      offer.audit.viewedBySeller = true;
      offer.audit.viewedAt = new Date().toISOString();

      offer.history.push({
        id: this.cosmosService.generateId(),
        action: 'viewed',
        performedBy: userId,
        performedByRole: 'seller',
        amount: null,
        message: null,
        timestamp: offer.audit.viewedAt,
      });

      await this.cosmosService.upsertItem<ListingOfferDocument>(OFFERS_CONTAINER, offer);
    }

    return offer;
  }

  /**
   * Create new offer
   */
  async create(dto: CreateListingOfferDto, userId: string): Promise<PublicOffer> {
    const now = new Date().toISOString();

    // Fetch listing to validate and get seller info
    const listing = await this.cosmosService.getItem<ListingDocument>(LISTINGS_CONTAINER, dto.listingId, dto.listingId);
    if (!listing) {
      throw new NotFoundException({ message: 'Listing not found' });
    }

    // Validate listing is available
    if (listing.status.state !== 'published') {
      throw new BadRequestException({ message: 'Cannot make offer on inactive listing' });
    }

    // Prevent seller from making offer on their own listing
    if (listing.seller.id === userId) {
      throw new BadRequestException({ message: 'You cannot make an offer on your own listing' });
    }

    // Check for existing pending offer from this buyer
    const existingQuery = `
      SELECT * FROM c
      WHERE c.type = 'listing_offer'
        AND c.listingId = @listingId
        AND c.buyerId = @buyerId
        AND c.status.state IN ('pending', 'countered')
    `;
    const { items: existingOffers } = await this.cosmosService.queryItems<ListingOfferDocument>(
      OFFERS_CONTAINER,
      existingQuery,
      [
        { name: '@listingId', value: dto.listingId },
        { name: '@buyerId', value: userId },
      ],
      1,
    );

    if (existingOffers.length > 0) {
      throw new BadRequestException({
        message: 'You already have a pending offer on this listing. Please withdraw it first if you want to make a new offer.'
      });
    }

    const expiresAt = dto.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const offer: ListingOfferDocument = {
      id: this.cosmosService.generateId(),
      type: 'listing_offer',
      listingId: dto.listingId,
      buyerId: userId,
      sellerId: listing.seller.id,
      offer: {
        amount: dto.amount,
        currency: 'USD',
        message: dto.message || null,
        isCounterOffer: false,
        parentOfferId: null,
        expiresAt,
      },
      status: {
        state: 'pending',
        acceptedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        expiredAt: null,
        withdrawnAt: null,
        withdrawalReason: null,
      },
      history: [
        {
          id: this.cosmosService.generateId(),
          action: 'created',
          performedBy: userId,
          performedByRole: 'buyer',
          amount: dto.amount,
          message: dto.message || null,
          timestamp: now,
        },
      ],
      terms: dto.terms
        ? ({
            inspectionContingent: dto.terms.inspectionContingent ?? false,
            financingContingent: dto.terms.financingContingent ?? false,
            tradeInRequired: dto.terms.tradeInRequired ?? false,
            tradeInDetails: dto.terms.tradeInDetails ?? null,
            deliveryRequired: dto.terms.deliveryRequired ?? false,
            deliveryLocation: dto.terms.deliveryLocation ?? null,
            additionalTerms: dto.terms.additionalTerms ?? null,
          } as OfferTerms)
        : null,
      audit: {
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
        viewedBySeller: false,
        viewedAt: null,
      },
    };

    const created = await this.cosmosService.createItem<ListingOfferDocument>(OFFERS_CONTAINER, offer);

    // TODO: Send notification to seller
    // await this.notificationsService.create({
    //   userId: listing.seller.sellerId,
    //   notificationType: 'new_offer_received',
    //   title: 'New offer received',
    //   message: `You received a new offer of $${dto.amount} on your listing`,
    //   related: { listingId: dto.listingId, offerId: created.id },
    // });

    return created;
  }

  /**
   * Accept offer
   */
  async accept(id: string, dto: AcceptOfferDto, userId: string): Promise<PublicOffer> {
    const offer = await this.cosmosService.getItem<ListingOfferDocument>(OFFERS_CONTAINER, id, id);

    if (!offer) {
      throw new NotFoundException({ message: 'Offer not found' });
    }

    // Only seller can accept
    if (offer.sellerId !== userId) {
      throw new ForbiddenException({ message: 'Only the seller can accept this offer' });
    }

    // Validate offer is pending or countered
    if (offer.status.state !== 'pending' && offer.status.state !== 'countered') {
      throw new BadRequestException({ message: 'Only pending or countered offers can be accepted' });
    }

    // Check if offer is expired
    if (new Date(offer.offer.expiresAt) < new Date()) {
      offer.status.state = 'expired';
      offer.status.expiredAt = new Date().toISOString();
      await this.cosmosService.upsertItem<ListingOfferDocument>(OFFERS_CONTAINER, offer);
      throw new BadRequestException({ message: 'This offer has expired' });
    }

    const now = new Date().toISOString();

    offer.status.state = 'accepted';
    offer.status.acceptedAt = now;

    offer.history.push({
      id: this.cosmosService.generateId(),
      action: 'accepted',
      performedBy: userId,
      performedByRole: 'seller',
      amount: offer.offer.amount,
      message: dto.message || null,
      timestamp: now,
    });

    offer.audit.updatedAt = now;
    offer.audit.updatedBy = userId;

    const updated = await this.cosmosService.upsertItem<ListingOfferDocument>(OFFERS_CONTAINER, offer);

    // TODO: Send notification to buyer
    // TODO: Update listing status (mark as sold or under contract)

    return updated;
  }

  /**
   * Reject offer
   */
  async reject(id: string, dto: RejectOfferDto, userId: string): Promise<PublicOffer> {
    const offer = await this.cosmosService.getItem<ListingOfferDocument>(OFFERS_CONTAINER, id, id);

    if (!offer) {
      throw new NotFoundException({ message: 'Offer not found' });
    }

    // Only seller can reject
    if (offer.sellerId !== userId) {
      throw new ForbiddenException({ message: 'Only the seller can reject this offer' });
    }

    // Validate offer is pending
    if (offer.status.state !== 'pending' && offer.status.state !== 'countered') {
      throw new BadRequestException({ message: 'Only pending or countered offers can be rejected' });
    }

    const now = new Date().toISOString();

    offer.status.state = 'rejected';
    offer.status.rejectedAt = now;
    offer.status.rejectionReason = dto.reason;

    offer.history.push({
      id: this.cosmosService.generateId(),
      action: 'rejected',
      performedBy: userId,
      performedByRole: 'seller',
      amount: null,
      message: dto.reason,
      timestamp: now,
    });

    offer.audit.updatedAt = now;
    offer.audit.updatedBy = userId;

    const updated = await this.cosmosService.upsertItem<ListingOfferDocument>(OFFERS_CONTAINER, offer);

    // TODO: Send notification to buyer

    return updated;
  }

  /**
   * Counter offer
   */
  async counter(id: string, dto: CounterOfferDto, userId: string): Promise<PublicOffer> {
    const originalOffer = await this.cosmosService.getItem<ListingOfferDocument>(OFFERS_CONTAINER, id, id);

    if (!originalOffer) {
      throw new NotFoundException({ message: 'Offer not found' });
    }

    // Only seller can counter
    if (originalOffer.sellerId !== userId) {
      throw new ForbiddenException({ message: 'Only the seller can make a counter-offer' });
    }

    // Validate offer is pending
    if (originalOffer.status.state !== 'pending') {
      throw new BadRequestException({ message: 'Only pending offers can be countered' });
    }

    const now = new Date().toISOString();

    // Update original offer status
    originalOffer.status.state = 'countered';

    originalOffer.history.push({
      id: this.cosmosService.generateId(),
      action: 'countered',
      performedBy: userId,
      performedByRole: 'seller',
      amount: dto.amount,
      message: dto.message || null,
      timestamp: now,
    });

    originalOffer.audit.updatedAt = now;
    originalOffer.audit.updatedBy = userId;

    // Create new counter-offer
    const expiresAt = dto.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const counterOffer: ListingOfferDocument = {
      id: this.cosmosService.generateId(),
      type: 'listing_offer',
      listingId: originalOffer.listingId,
      buyerId: originalOffer.buyerId,
      sellerId: originalOffer.sellerId,
      offer: {
        amount: dto.amount,
        currency: 'USD',
        message: dto.message || null,
        isCounterOffer: true,
        parentOfferId: originalOffer.id,
        expiresAt,
      },
      status: {
        state: 'pending',
        acceptedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        expiredAt: null,
        withdrawnAt: null,
        withdrawalReason: null,
      },
      history: [
        {
          id: this.cosmosService.generateId(),
          action: 'countered',
          performedBy: userId,
          performedByRole: 'seller',
          amount: dto.amount,
          message: dto.message || null,
          timestamp: now,
        },
      ],
      terms: dto.terms
        ? ({
            ...originalOffer.terms,
            ...dto.terms,
          } as OfferTerms)
        : originalOffer.terms,
      audit: {
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
        viewedBySeller: true,
        viewedAt: now,
      },
    };

    // Save both offers
    await this.cosmosService.upsertItem<ListingOfferDocument>(OFFERS_CONTAINER, originalOffer);
    const created = await this.cosmosService.createItem<ListingOfferDocument>(OFFERS_CONTAINER, counterOffer);

    // TODO: Send notification to buyer

    return created;
  }

  /**
   * Withdraw offer
   */
  async withdraw(id: string, dto: WithdrawOfferDto, userId: string): Promise<PublicOffer> {
    const offer = await this.cosmosService.getItem<ListingOfferDocument>(OFFERS_CONTAINER, id, id);

    if (!offer) {
      throw new NotFoundException({ message: 'Offer not found' });
    }

    // Only buyer can withdraw
    if (offer.buyerId !== userId) {
      throw new ForbiddenException({ message: 'Only the buyer can withdraw this offer' });
    }

    // Validate offer is pending or countered
    if (offer.status.state !== 'pending' && offer.status.state !== 'countered') {
      throw new BadRequestException({ message: 'Only pending or countered offers can be withdrawn' });
    }

    const now = new Date().toISOString();

    offer.status.state = 'withdrawn';
    offer.status.withdrawnAt = now;
    offer.status.withdrawalReason = dto.reason;

    offer.history.push({
      id: this.cosmosService.generateId(),
      action: 'withdrawn',
      performedBy: userId,
      performedByRole: 'buyer',
      amount: null,
      message: dto.reason,
      timestamp: now,
    });

    offer.audit.updatedAt = now;
    offer.audit.updatedBy = userId;

    const updated = await this.cosmosService.upsertItem<ListingOfferDocument>(OFFERS_CONTAINER, offer);

    // TODO: Send notification to seller

    return updated;
  }

  /**
   * Get offer statistics for a listing
   */
  async getStatistics(listingId: string, sellerId: string): Promise<OfferStatistics> {
    // Verify seller owns the listing
    const listing = await this.cosmosService.getItem<ListingDocument>(LISTINGS_CONTAINER, listingId, listingId);
    if (!listing || listing.seller.id !== sellerId) {
      throw new ForbiddenException({ message: 'You do not have permission to view statistics for this listing' });
    }

    const querySpec = `
      SELECT * FROM c
      WHERE c.type = 'listing_offer'
        AND c.listingId = @listingId
        AND NOT c.offer.isCounterOffer
    `;
    const { items: offers } = await this.cosmosService.queryItems<ListingOfferDocument>(
      OFFERS_CONTAINER,
      querySpec,
      [{ name: '@listingId', value: listingId }],
      100,
    );

    if (offers.length === 0) {
      return {
        totalOffers: 0,
        pendingOffers: 0,
        acceptedOffers: 0,
        rejectedOffers: 0,
        averageOfferAmount: 0,
        highestOfferAmount: 0,
        lowestOfferAmount: 0,
      };
    }

    const amounts = offers.map((o) => o.offer.amount);

    return {
      totalOffers: offers.length,
      pendingOffers: offers.filter((o) => o.status.state === 'pending').length,
      acceptedOffers: offers.filter((o) => o.status.state === 'accepted').length,
      rejectedOffers: offers.filter((o) => o.status.state === 'rejected').length,
      averageOfferAmount: amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length,
      highestOfferAmount: Math.max(...amounts),
      lowestOfferAmount: Math.min(...amounts),
    };
  }
}
