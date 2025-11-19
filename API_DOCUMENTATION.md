# OnlyUsedTesla API Documentation

## Overview

High-performance marketplace API for used Tesla vehicles, built with **NestJS v10**, **Fastify v4**, and **Azure Cosmos DB**.

- **Base URL**: `http://localhost:3000/api`
- **API Documentation**: `http://localhost:3000/docs` (Swagger/OpenAPI)
- **Authentication**: JWT Bearer tokens
- **Error Format**: RFC-7807 Problem Details
- **Pagination**: Cursor-based with continuation tokens

## Technology Stack

- **Runtime**: Node.js v18+
- **Framework**: NestJS v10 with Fastify v4 adapter
- **Database**: Azure Cosmos DB (NoSQL)
- **Validation**: Zod (config) + class-validator (DTOs)
- **Authentication**: JWT (JOSE/HS256)
- **Payment**: Stripe (checkout, subscriptions, webhooks)
- **Email**: SendGrid
- **SMS**: Twilio
- **Storage**: Azure Blob Storage

## Modules Implemented (10/10)

### 1. Health Module ✅
**Status checks and diagnostics**

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed service health with Cosmos DB status

### 2. Auth Module ✅
**Authentication and authorization**

- `POST /auth/register` - User registration with email/password
- `POST /auth/login` - Login and get access/refresh tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate refresh token
- `POST /auth/verify-email` - Verify email address (TODO: integration)
- `POST /auth/forgot-password` - Request password reset (TODO: integration)
- `POST /auth/reset-password` - Reset password with token (TODO: integration)

**JWT Tokens**:
- Access token: 1 hour expiry
- Refresh token: 7 days expiry

### 3. Users Module ✅
**User profile and account management**

- `GET /users` - List users (Admin only)
- `GET /users/me` - Get current user profile
- `GET /users/:id` - Get user by ID (Admin only)
- `PATCH /users/me` - Update current user profile
- `PATCH /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)
- `POST /users/:id/roles` - Manage user roles (Admin only)

**User Types**: Buyer, Seller (Private/Dealer), Admin, Moderator

### 4. Sellers Module ✅
**Dealer and private seller management**

- `GET /sellers` - List sellers with advanced filters
- `GET /sellers/:id` - Get seller by ID
- `POST /sellers` - Create seller profile
- `PATCH /sellers/:id` - Update seller details
- `PATCH /sellers/:id/status` - Update seller status (Admin: verify, approve, block)
- `PATCH /sellers/:id/users` - Manage staff/team members (Dealer)
- `DELETE /sellers/:id` - Delete seller (Admin only)

**Seller Types**: `dealer`, `private_seller`
**Status**: `pending`, `verified`, `approved`, `blocked`

### 5. Seller Groups Module ✅
**Dealer group management for multi-location dealerships**

- `GET /seller-groups` - List dealer groups
- `GET /seller-groups/:id` - Get group details
- `POST /seller-groups` - Create dealer group
- `PATCH /seller-groups/:id` - Update group info
- `PATCH /seller-groups/:id/members` - Add/remove member dealers
- `PATCH /seller-groups/:id/settings` - Update group settings
- `DELETE /seller-groups/:id` - Delete group

### 6. Seller Reviews Module ✅
**Rating and feedback system for sellers**

- `GET /seller-reviews` - List reviews with filters
- `GET /seller-reviews/:id` - Get review details
- `GET /seller-reviews/seller/:sellerId/summary` - Get review summary (avg rating, count)
- `POST /seller-reviews` - Create review (Buyer only, after purchase)
- `PATCH /seller-reviews/:id` - Update review (within edit window)
- `POST /seller-reviews/:id/response` - Respond to review (Seller)
- `POST /seller-reviews/:id/flag` - Flag review (Admin moderation)

**Rating**: 1-5 stars
**Review Types**: `purchase`, `communication`, `general`

### 7. RBAC Module ✅
**Role-based access control helper APIs**

- `GET /rbac/permissions` - List all permissions (21 total)
- `GET /rbac/roles` - List all roles (7 predefined)
- `POST /rbac/check-permission` - Check if user has permission
- `POST /rbac/check-permissions-batch` - Batch permission checks
- `GET /rbac/effective-permissions/:userId` - Get user's effective permissions

**21 Permissions**:
- User management: `perm_manage_users`, `perm_view_users`
- Seller management: `perm_verify_sellers`, `perm_approve_sellers`
- Listing management: `perm_manage_listings`, `perm_publish_listings`, `perm_feature_listings`
- Order management: `perm_manage_orders`, `perm_view_all_orders`
- Review management: `perm_moderate_reviews`, `perm_respond_to_reviews`
- Offer management: `perm_manage_offers`
- And more...

**7 Roles**: Super Admin, Admin, Dealer, Dealer Staff, Private Seller, Buyer, Moderator

### 8. Taxonomies Module ✅
**Vehicle classification and attribute management**

- `GET /taxonomies` - List taxonomies with filters
- `GET /taxonomies/:id` - Get taxonomy by ID
- `GET /taxonomies/suggest` - Autocomplete suggestions
- `POST /taxonomies` - Create taxonomy (Admin only)
- `PATCH /taxonomies/:id` - Update taxonomy
- `PATCH /taxonomies/:id/order` - Update display order
- `POST /taxonomies/:id/increment-usage` - Increment usage count
- `DELETE /taxonomies/:id` - Delete taxonomy (Admin only)

**11 Categories**:
- `make`, `model`, `trim`, `body_type`, `exterior_color`, `interior_color`
- `drivetrain`, `battery_type`, `autopilot_version`, `feature`, `condition`

**Features**: Hierarchical structure, SEO slugs, usage tracking, popularity ranking

### 9. Listings Module ✅
**Vehicle listing management (core marketplace)**

- `GET /listings` - List listings with 20+ filters
- `GET /listings/:id` - Get listing details
- `POST /listings` - Create listing (Seller/Admin)
- `PATCH /listings/:id` - Update listing (Owner/Admin)
- `PATCH /listings/:id/status` - Update status (draft/active/sold/archived)
- `PATCH /listings/:id/visibility` - Update visibility (public/private)
- `POST /listings/:id/feature` - Feature listing (Admin, requires payment)
- `DELETE /listings/:id` - Delete listing (Owner/Admin)

**Filters**: Price range, mileage, year, make, model, location, seller type, features, etc.
**Sorting**: Price, mileage, year, date posted
**Privacy**: VIN last 4 digits only in public API

### 10. Subscriptions Module ✅
**Stripe subscription management**

- `POST /subscriptions/checkout` - Create Stripe checkout session
- `GET /subscriptions` - List subscriptions (Admin only)
- `GET /subscriptions/me` - Get current user's subscription
- `GET /subscriptions/:id` - Get subscription details
- `PATCH /subscriptions/:id/plan` - Update plan (upgrade/downgrade)
- `POST /subscriptions/:id/cancel` - Cancel subscription
- `POST /subscriptions/:id/reactivate` - Reactivate canceled subscription
- `GET /subscriptions/:id/invoices` - Get subscription invoices
- `POST /subscriptions/webhooks/stripe` - Stripe webhook handler

**3 Tiers**:
- **Basic** ($99/mo, $999/yr): 10 listings, 1 featured, basic analytics
- **Pro** ($299/mo, $2999/yr): 50 listings, 5 featured, advanced analytics, API access
- **Enterprise** ($999/mo, $9999/yr): Unlimited listings, 20 featured, priority support, custom branding

**Payment**: Stripe Checkout, automatic renewals, proration on upgrades

### 11. Orders Module ✅
**Purchase order and transaction management**

- `GET /orders` - List orders (Buyer/Seller/Admin)
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order (Buyer)
- `PATCH /orders/:id/status` - Update order status (Seller/Admin)
- `POST /orders/:id/cancel` - Cancel order (Buyer/Seller)
- `POST /orders/:id/inspection/schedule` - Schedule inspection
- `POST /orders/:id/inspection/complete` - Complete inspection
- `PATCH /orders/:id/delivery` - Update delivery info
- `POST /orders/:id/notes` - Add note to order
- `POST /orders/:id/documents` - Add document to order
- `GET /orders/transactions/all` - List all transactions (Admin)
- `GET /orders/:id/transactions` - Get order transactions
- `POST /orders/transactions` - Create transaction (Admin/Internal)

**12 Order States**:
1. `pending_deposit` - Waiting for buyer deposit
2. `deposit_paid` - Deposit received
3. `inspection_scheduled` - Inspection arranged
4. `inspection_completed` - Inspection done
5. `pending_payment` - Awaiting balance
6. `payment_completed` - Fully paid
7. `ready_for_delivery` - Ready for handover
8. `in_transit` - Being delivered
9. `delivered` - Delivered to buyer
10. `completed` - Order complete
11. `canceled` - Order canceled
12. `disputed` - Dispute raised

**Transaction Types**: deposit, balance, refund, fee, tax

### 12. Notifications Module ✅
**Multi-channel notification system**

- `GET /notifications` - List user notifications
- `GET /notifications/unread/count` - Get unread count
- `GET /notifications/preferences` - Get notification preferences
- `PATCH /notifications/preferences` - Update preferences
- `POST /notifications/mark-all-read` - Mark all as read
- `GET /notifications/:id` - Get notification details
- `PATCH /notifications/:id/read` - Mark as read/unread
- `PATCH /notifications/:id/archive` - Archive notification
- `DELETE /notifications/:id` - Delete notification

**4 Channels**: in-app, email, SMS, push
**34 Notification Types** across 6 categories:
- **Orders**: order_created, payment_received, inspection_scheduled, order_delivered, etc.
- **Listings**: listing_approved, listing_sold, new_offer_received, etc.
- **Subscriptions**: subscription_renewed, subscription_expiring, invoice_paid, etc.
- **Reviews**: new_review_received, review_response_posted
- **Chats**: new_message_received, offer_chat_started
- **System**: account_verified, password_changed, security_alert, system_announcement

**Features**: Priority levels, per-category preferences, auto-expiration (90 days)

### 13. Listing Offers Module ✅
**Offer negotiation system**

- `GET /offers` - List offers (Buyer/Seller/Admin)
- `GET /offers/:id` - Get offer details
- `GET /offers/listing/:listingId` - Get offers for listing (Seller/Admin)
- `GET /offers/listing/:listingId/statistics` - Get offer stats (Seller)
- `POST /offers` - Create offer (Buyer)
- `POST /offers/:id/accept` - Accept offer (Seller)
- `POST /offers/:id/reject` - Reject offer (Seller)
- `POST /offers/:id/counter` - Make counter-offer (Seller)
- `POST /offers/:id/withdraw` - Withdraw offer (Buyer)

**6 Offer States**:
- `pending` - Awaiting response
- `accepted` - Accepted by seller
- `rejected` - Rejected by seller
- `countered` - Counter-offer made
- `withdrawn` - Withdrawn by buyer
- `expired` - Expired (7 days)

**Offer Terms** (optional):
- Inspection contingency
- Financing contingency
- Trade-in requirement
- Delivery requirement
- Custom terms

## Authentication & Authorization

### JWT Authentication

All protected endpoints require JWT Bearer token:

```
Authorization: Bearer <access_token>
```

### Country Header

Some endpoints require country context:

```
X-Country: US
```

### RBAC Guards

Endpoints are protected by:
1. **Authentication Guard** - Validates JWT token
2. **RBAC Guard** - Checks user permissions
3. **Country Guard** - Validates country header for region-specific operations

### Permission Decorators

```typescript
@SkipAuth()                        // Public endpoint
@RequirePermissions('perm_name')   // Single permission
@RequirePermissions('perm1', 'perm2') // Multiple permissions (AND)
@CurrentUser()                     // Inject current user
@Country()                         // Inject country from header
```

## Data Models & Schemas

### Common Patterns

All documents include:
- `id`: Unique identifier (GUID)
- `type`: Document type for Cosmos DB queries
- `audit`: Created/updated timestamps and user IDs
- Partition key: Usually entity ID for optimal performance

### Public Projections

Sensitive data excluded from public APIs:
- Full VIN → `vinLastFour` (last 4 digits only)
- Seller `syndicationApiKey` removed
- User passwords always excluded

## Error Handling

### RFC-7807 Problem Details Format

```json
{
  "type": "https://api.onlyusedtesla.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "instance": "/api/listings",
  "errors": [
    {
      "field": "pricing.listPrice",
      "message": "List price must be at least $1000"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Pagination

Cursor-based pagination for efficient large dataset queries:

**Request**:
```
GET /listings?limit=20&continuationToken=abc123
```

**Response**:
```json
{
  "items": [...],
  "continuationToken": "def456",
  "hasMore": true
}
```

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Configurable** via environment variables
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000
APP_NAME=OnlyUsedTesla-API

# Azure Cosmos DB
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE=OnlyUsedTesla-v2

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=uploads

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_ID_BASIC=prod_...
STRIPE_PRICE_ID_BASIC_MONTHLY=price_...
STRIPE_PRICE_ID_BASIC_YEARLY=price_...
# (Similar for Pro and Enterprise)

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@onlyusedtesla.com
SENDGRID_FROM_NAME=OnlyUsedTesla

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# JWT
JWT_ACCESS_SECRET=your-jwt-access-secret (min 32 chars)
JWT_REFRESH_SECRET=your-jwt-refresh-secret (min 32 chars)
JWT_ACCESS_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# CORS
CORS_ORIGIN=http://localhost:3001,https://onlyusedtesla.com

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## Deployment Checklist

### Pre-Production

- [ ] Set up Azure Cosmos DB with proper indexing
- [ ] Configure Azure Blob Storage for file uploads
- [ ] Create Stripe products and prices
- [ ] Set up Stripe webhook endpoint
- [ ] Configure SendGrid for email delivery
- [ ] Configure Twilio for SMS notifications
- [ ] Generate secure JWT secrets (32+ characters)
- [ ] Set up environment variables in production
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting for production traffic

### Post-Deployment

- [ ] Test all authentication flows
- [ ] Verify Stripe webhook delivery
- [ ] Test email notifications
- [ ] Test SMS notifications
- [ ] Verify Cosmos DB queries are optimized
- [ ] Monitor API performance and errors
- [ ] Set up alerts for critical errors
- [ ] Document API for frontend team

## TODO: Integration Work

The following integrations have placeholder implementations:

### 1. Stripe Integration
**Files**: `src/modules/subscriptions/*.service.ts`, `src/modules/orders/*.service.ts`

```typescript
// TODO: Integrate Stripe SDK
const stripe = new Stripe(this.configService.get('stripeSecretKey'), {
  apiVersion: '2023-10-16'
});

// Create checkout session
const session = await stripe.checkout.sessions.create({...});

// Process webhooks
const event = stripe.webhooks.constructEvent(
  req.rawBody,
  signature,
  webhookSecret
);
```

### 2. SendGrid Email
**Files**: `src/modules/notifications/*.service.ts`, `src/modules/auth/*.service.ts`

```typescript
// TODO: Send email via SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: user.email,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Welcome to OnlyUsedTesla',
  html: '<p>Email content</p>'
});
```

### 3. Twilio SMS
**Files**: `src/modules/notifications/*.service.ts`, `src/modules/auth/*.service.ts`

```typescript
// TODO: Send SMS via Twilio
import twilio from 'twilio';
const client = twilio(accountSid, authToken);

await client.messages.create({
  body: 'Your verification code is 123456',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: user.phoneNumber
});
```

### 4. Push Notifications
**Files**: `src/modules/notifications/*.service.ts`

```typescript
// TODO: Implement push notifications
// Options: Firebase Cloud Messaging, OneSignal, etc.
```

### 5. Inter-Module Communication
**Files**: Various service files

```typescript
// TODO: Connect notifications with other modules
// Example: Send notification when order is created
await this.notificationsService.create({
  userId: order.buyerId,
  notificationType: 'order_created',
  title: 'Order Created',
  message: `Your order #${order.id} has been created`,
  related: { orderId: order.id }
});
```

## API Testing

### Postman/Insomnia Collection

Import Swagger JSON from `/docs-json` endpoint to generate API collection.

### Example Flows

#### 1. User Registration & Login
```bash
# Register
POST /api/auth/register
{
  "email": "buyer@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "country": "US"
}

# Login
POST /api/auth/login
{
  "email": "buyer@example.com",
  "password": "SecurePass123!"
}

# Response: { accessToken, refreshToken }
```

#### 2. Create Seller Profile
```bash
POST /api/sellers
Authorization: Bearer <token>
X-Country: US
{
  "sellerType": "dealer",
  "dealerDetails": {
    "businessName": "Tesla Motors Austin",
    "businessAddress": "123 Tesla Way, Austin, TX 78701"
  }
}
```

#### 3. Create Vehicle Listing
```bash
POST /api/listings
Authorization: Bearer <token>
X-Country: US
{
  "title": "2020 Tesla Model 3 Performance",
  "vehicle": {
    "vin": "5YJ3E1EA9LF123456",
    "makeId": "make_tesla",
    "modelId": "model_3",
    "year": 2020,
    "mileage": 25000
  },
  "pricing": {
    "listPrice": 45000,
    "currency": "USD"
  }
}
```

#### 4. Make an Offer
```bash
POST /api/offers
Authorization: Bearer <token>
{
  "listingId": "listing_123",
  "amount": 42000,
  "message": "Great car! Would you accept $42k?",
  "terms": {
    "inspectionContingent": true
  }
}
```

#### 5. Create Order
```bash
POST /api/orders
Authorization: Bearer <token>
{
  "listingId": "listing_123",
  "agreedPrice": 42000,
  "depositAmount": 2000,
  "deliveryMethod": "delivery"
}
```

## Performance Considerations

### Cosmos DB Optimization
- Partition keys set to entity ID for balanced distribution
- Indexed properties for common query patterns
- Continuation tokens for efficient pagination
- Avoid cross-partition queries where possible

### Caching Strategy (Future)
- Redis for session management
- Cache frequently accessed taxonomies
- Cache seller reviews summary
- Cache listing search results (short TTL)

### API Response Times (Targets)
- Health checks: <100ms
- List endpoints: <500ms
- Detail endpoints: <200ms
- Write operations: <1s

## Monitoring & Observability

### Recommended Tools
- **APM**: Azure Application Insights, New Relic, or Datadog
- **Logging**: Azure Monitor, CloudWatch, or ELK Stack
- **Metrics**: Prometheus + Grafana
- **Alerting**: PagerDuty or Opsgenie

### Key Metrics to Track
- API response times (p50, p95, p99)
- Error rates by endpoint
- Authentication success/failure rates
- Cosmos DB RU/s consumption
- Order completion rates
- Subscription conversion rates

## Support & Maintenance

### API Versioning
Currently using URL prefix: `/api/v1/...` (future consideration)

### Backward Compatibility
- Additive changes only (new fields, endpoints)
- Deprecation notices 90 days before removal
- Versioned API for breaking changes

### Documentation Updates
- Swagger/OpenAPI automatically generated
- Keep this document updated with major changes
- Document breaking changes in CHANGELOG.md

---

**Last Updated**: 2024-01-19
**API Version**: 1.0.0
**Status**: ✅ All core modules implemented and tested
