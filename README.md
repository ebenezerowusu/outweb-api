# OnlyUsedTesla-API

NestJS + Fastify backend service for the OnlyUsedTesla platform — a high-performance marketplace for used Tesla vehicles.

## Overview

The API manages users, sellers (private & dealers), listings, offers, chats, orders, subscriptions, and notifications with strong data consistency across Azure Cosmos DB and Stripe.

### Core Features

- **Clean Modular Architecture**: Domain-driven design with clear service boundaries
- **Strong Typing**: TypeScript + Zod validation throughout
- **Role-Based Access Control (RBAC)**: Fine-grained permissions and roles
- **Country-Based Data Segregation**: X-Country header enforcement
- **Cursor-Based Pagination**: Efficient pagination with continuation tokens
- **RFC-7807 Error Format**: Standardized problem+json error responses
- **OpenAPI/Swagger**: Auto-generated API documentation

## Technology Stack

- **Framework**: NestJS v10 with Fastify v4 platform adapter
- **Validation**: Zod for config + Class-validator for DTOs
- **Database**: Azure Cosmos DB SDK
- **Storage**: Azure Blob Storage SDK
- **Payments**: Stripe SDK
- **Email**: SendGrid SDK
- **SMS**: Twilio SDK
- **Auth**: JOSE (EdDSA) for JWT signing
- **Password**: bcryptjs for hashing

## Quick Start

### Prerequisites

- Node.js >= 18.x
- Azure Cosmos DB account
- Azure Storage account
- Stripe account
- SendGrid account
- Twilio account

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Variables

Required environment variables (see `.env.example`):

- `API_VERSION` - API version prefix (default: v2)
- `COSMOS_ENDPOINT` - Azure Cosmos DB endpoint URL
- `COSMOS_KEY` - Azure Cosmos DB primary key
- `COSMOS_DATABASE` - Database name (default: OnlyUsedTesla-v2)
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `SENDGRID_API_KEY` - SendGrid API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `JWT_ACCESS_SECRET` - JWT access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (min 32 chars)

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at:
- **API**: `http://localhost:3000/api/v2`
- **Swagger Docs**: `http://localhost:3000/docs`

### API Versioning

The API uses path-based versioning (e.g., `/api/v2/`). To change the API version:

1. Set the `API_VERSION` environment variable (default: `v2`)
2. All endpoints will automatically use the specified version prefix

## API Architecture

### Shared Conventions

#### Authentication
- **Bearer Auth**: Required on all routes except `/api/v2/auth/*`, `/api/v2/health/*`, and webhooks
- **Header**: `Authorization: Bearer <accessToken>`
- **Token Format**: JWT (EdDSA signed)

#### Country Isolation
- **Header**: `X-Country` (required)
- **Format**: 2-letter ISO 3166-1 alpha-2 country code (e.g., `US`, `CA`, `GH`, `GB`)
- **Purpose**: Data segregation by market

#### Pagination
All list endpoints use cursor-based pagination:

**Request**:
```
GET /api/v2/endpoint?limit=20&cursor=opaque-token
```

**Response**:
```json
{
  "items": [...],
  "count": 20,
  "nextCursor": "opaque-cursor-or-null"
}
```

#### Error Format (RFC-7807)
```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

## Module Overview

### Core Modules

All endpoints are prefixed with `/api/v2/` (configurable via `API_VERSION` env var).

1. **Health** - `/api/v2/health`
   - Service liveness check
   - Cosmos DB connection test
   - Azure Storage connection test

2. **Auth** - `/api/v2/auth`
   - Sign in, sign up (private/dealer)
   - Token refresh, logout
   - Email verification, password reset
   - 2FA setup/disable

3. **Users** - `/api/v2/users`
   - User management
   - Profile updates
   - Role and permission management
   - Effective permissions calculation

4. **Sellers** - `/api/v2/sellers`
   - Dealer and private seller management
   - Business details, verification
   - Staff/team management

5. **Seller Groups** - `/api/v2/sellerGroups`
   - Dealer group organization
   - Multi-location management

6. **Seller Reviews** - `/api/v2/sellerReviews`
   - Buyer reviews for sellers
   - Rating aggregation

7. **RBAC** - `/rbac`
   - Permission checking
   - Role suggestions
   - Permission autocomplete

8. **Taxonomies** - `/taxonomies`
   - Vehicle classifications (make, model, color, etc.)
   - SEO-friendly slugs
   - Faceted search support

9. **Listings & Vehicles** - `/listings`, `/vehicles`
   - Vehicle listing creation
   - Search and filtering
   - Media management

10. **Payments & Subscriptions** - `/subscriptionPlans`, `/userSubscriptions`, `/payments`
    - Stripe checkout integration
    - Subscription management
    - Invoice tracking

11. **Billings** - `/billings`
    - Listing payment tracking
    - Payment status updates

12. **Orders** - `/orders`, `/orderTransactions`
    - Order management
    - Transaction tracking
    - Delivery coordination

13. **Notifications** - `/notifications`
    - Multi-channel (in-app, email, SMS, push)
    - Read/unread tracking
    - Priority and archiving

14. **Listing Offers** - `/listingOffers`
    - Buyer offers on listings
    - Counter-offer negotiation

15. **Offer Chats** - `/listingOfferChats`, `/listingOfferChatMessages`
    - Real-time negotiation messaging
    - Message history

## Development

### Project Structure

```
outweb-api/
├── src/
│   ├── common/           # Shared utilities, guards, filters
│   │   ├── decorators/   # Custom decorators
│   │   ├── filters/      # Exception filters
│   │   ├── guards/       # Auth guards
│   │   ├── services/     # Shared services (Cosmos, etc.)
│   │   └── types/        # Shared TypeScript types
│   ├── config/           # Configuration (Zod schemas)
│   ├── modules/          # Feature modules
│   │   ├── health/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── sellers/
│   │   └── ...
│   ├── app.module.ts     # Root module
│   └── main.ts           # Application entry point
├── test/                 # E2E tests
├── .env.example          # Environment template
├── nest-cli.json         # NestJS CLI config
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Linting & Formatting

```bash
# Lint
npm run lint

# Format code
npm run format
```

## Deployment

### Environment-Specific Configuration

- **Development**: Debug logging, Swagger enabled
- **Production**: Minimal logging, Swagger disabled

### Recommended Deployment Platforms

- Azure App Service
- Azure Container Instances
- Azure Kubernetes Service (AKS)
- Docker containers

## License

Proprietary - OnlyUsedTesla Team

## Support

For issues and questions, please contact the development team.
