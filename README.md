# SellAi

AI-powered multi-tenant ecommerce SaaS. Merchants get a store dashboard with AI tools and billing. Customers get a storefront to browse, cart, and checkout.

This repo is split into two apps:

- `client/` — React storefront and merchant dashboard
- `server/` — Express REST API, Prisma, PostgreSQL

## Features

- Merchant register, login, and one store per account
- Products, categories, orders, customers, analytics, and store settings
- Public storefront with search, cart, checkout, and an AI assistant
- Stripe billing and OpenAI generators, both server-side only
- Tenant isolation from the authenticated store or public slug

## Tech stack

- **Frontend:** React, Vite, JavaScript, React Router, Axios, Tailwind CSS
- **Backend:** Node.js, Express, JavaScript, REST
- **Database:** PostgreSQL, Prisma
- **Auth:** JWT, bcrypt
- **AI:** OpenAI (server-side only)
- **Payments:** Stripe (server-side only)

## Project structure

```text
SellAi/
├── client/          React + Vite app
├── server/          Express API + Prisma
├── .gitignore
├── README.md
└── package.json
```

## Installation

Requires Node.js 20+ and PostgreSQL.

```bash
npm run install:all
```

Or install each app separately:

```bash
cd server && npm install
cd ../client && npm install
```

## Environment variables

Copy the example file and fill in real values. Never commit `.env`.

```bash
cp server/.env.example server/.env
```

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs. Must be at least 32 characters. |
| `OPENAI_API_KEY` | OpenAI key, server only |
| `STRIPE_SECRET_KEY` | Stripe secret, server only |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO` | Stripe price id for the Pro plan |
| `STRIPE_PRICE_BUSINESS` | Stripe price id for the Business plan |
| `CLIENT_URL` | Frontend origin for CORS |

Secrets stay on the server. The React app never receives API keys.

## Database setup

PostgreSQL needs to be installed and running. This machine already has PostgreSQL 18.

1. Create a database named `sellai`.
2. Put your real connection string in `server/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/sellai?schema=public
```

3. From `server/`:

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

Useful Prisma commands:

```bash
npx prisma studio
npx prisma migrate dev
npx prisma generate
```

## Development commands

From the repo root:

```bash
npm run dev:server
npm run dev:client
```

From `client/`:

```bash
npm run dev
npm run build
```

From `server/`:

```bash
npm run dev
npm start
```

- API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Client: `http://localhost:5173` (proxies `/api` to the server)

## AI setup

AI runs only on the server. Add `OPENAI_API_KEY` to `server/.env`. The React app calls Express; Express calls OpenAI. The key never goes to the browser.

Before each generation the API:

1. Authenticates the merchant
2. Loads that merchant's store
3. Reads plan and status from the subscription row
4. Counts `AIUsage` for the current month
5. Allows or rejects the request
6. Calls OpenAI
7. Saves token usage

```text
GET  /api/ai/usage
POST /api/ai/generate
```

`POST /api/ai/generate` accepts `description`, `title`, `seo`, or `marketing`. Optional `productId` is loaded from the merchant's store only.

The storefront chatbot is public but still scoped to the store in the URL slug. It cannot see other stores. OpenAI only gets results from server tools: product search, one product, store policies, and an order lookup that requires both the order id and the checkout email.

```text
GET  /api/ai/public/:slug
POST /api/ai/public/:slug/chat
```

## Stripe setup

Stripe secret keys stay in `server/.env`. Never send them to React.

1. Create Pro and Business subscription prices in Stripe.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, and `STRIPE_PRICE_BUSINESS`.
3. Point a Stripe webhook at `POST /api/billing/webhook`.

The webhook signature is verified before any subscription row is updated. Checkout and the customer portal run on the server. The React app only sends a plan name (`PRO` or `BUSINESS`) and then displays whatever the database has.

New stores start on the seeded FREE plan. Feature limits (including AI request caps) are read from the store subscription in PostgreSQL.

```text
GET  /api/billing
GET  /api/billing/plans
POST /api/billing/checkout
POST /api/billing/portal
POST /api/billing/webhook
```

## Deployment

1. Set production environment variables on the host.
2. Run Prisma migrations against production PostgreSQL.
3. Build the client (`npm run build` in `client/`).
4. Start the API (`npm start` in `server/`).
5. Serve the client build and point `CLIENT_URL` at that origin.

## Authentication

Merchant accounts use email and password.

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Passwords are hashed with bcrypt. The API returns a JWT. The React app stores the token locally and sends it as `Authorization: Bearer`. `/account` is a protected route.

## Multi-tenancy

Each merchant owns one store. Tenant identity comes from the authenticated user, not from a `storeId` sent by the client.

```text
POST /api/stores
GET  /api/stores/me
PATCH /api/stores/me
GET  /api/stores/slug/:slug
```

Store-owned queries always include `ownerId` or `req.store.id` from the server.

## Ecommerce

Merchant APIs are authenticated and scoped to the merchant's store.

```text
/api/products
/api/categories
/api/customers
/api/orders
```

Public storefront APIs use the store slug, never a client-supplied `storeId`.

```text
GET  /api/products/public/:slug
GET  /api/cart?slug=
POST /api/orders/checkout?slug=
GET  /api/orders/public?slug=&email=
GET  /api/orders/public/:id?slug=&email=
```

Cart identity is a server-created cart id sent as `X-Cart-Id`. Checkout creates a `PENDING` order and decrements stock. Merchants can mark an order `PAID` from the dashboard. Customers look up orders on the storefront with the checkout email.

## Merchant dashboard

Authenticated merchants use `/store` with a responsive sidebar (drawer on small screens).

```text
GET /api/analytics
```

Analytics are scoped to `req.store.id`. The dashboard reuses the Phase 4 product, category, order, customer, and settings pages.

## Current status

The website is complete for the original SaaS MVP: merchant dashboard, public storefront, order lookup, policies, Stripe subscription billing, and server-side AI. New stores start on FREE. Add OpenAI and Stripe keys in `server/.env` to enable generators, chat, and paid plans.
