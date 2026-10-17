# Opuszyra Codebase & Project Architecture Specification

> **Opuszyra** is an enterprise-grade Anthropic-compatible AI Proxy, API Gateway, and middle-man routing platform built with **React (Vite)**, **Tailwind CSS**, **Node.js (Express)**, and **Supabase (PostgreSQL)**.
> It delivers drop-in Anthropic and OpenAI compatibility, 5-hour rolling token capacity windows, zero-latency unbuffered Server-Sent Events (SSE) streaming, 100% free prompt caching reads, real-time key telemetry inspection, automated TRC-20 crypto checkout, and dual-mode database operation (in-memory mock fallback & live Supabase sync).

---

## Table of Contents

1. [Executive Summary & Project Overview](#1-executive-summary--project-overview)
2. [High-Level Architecture & Flow Diagram](#2-high-level-architecture--flow-diagram)
3. [Repository File & Directory Structure](#3-repository-file--directory-structure)
4. [Backend Server Architecture (`server/`)](#4-backend-server-architecture-server)
   - [4.1 Express Server Core (`server/server.js`)](#41-express-server-core-serverserverjs)
   - [4.2 Middle-Man Proxy Route (`server/routes/anthropicProxy.js`)](#42-middle-man-proxy-route-serverroutesanthropicproxyjs)
   - [4.3 Key Management & Inspector (`server/routes/keys.js`)](#43-key-management--inspector-serverrouteskeysjs)
   - [4.4 Metrics, Billing & Orders (`server/routes/stats.js`)](#44-metrics-billing--orders-serverroutesstatsjs)
   - [4.5 Dual-Mode Supabase Client (`server/lib/supabase.js`)](#45-dual-mode-supabase-client-serverlibsupabasejs)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Frontend Client Architecture (`client/`)](#6-frontend-client-architecture-client)
   - [6.1 Application Entry & Routing (`client/src/App.tsx`)](#61-application-entry--routing-clientsrcapptsx)
   - [6.2 Standalone Pages (`client/src/pages/`)](#62-standalone-pages-clientsrcpages)
   - [6.3 Reusable UI Components (`client/src/components/`)](#63-reusable-ui-components-clientsrccomponents)
   - [6.4 Client API Layer & State (`client/src/lib/api.ts`)](#64-client-api-layer--state-clientsrclibapits)
   - [6.5 Theme System & Styling (`client/src/index.css`)](#65-theme-system--styling-clientsrcindexcss)
   - [6.6 Type Definitions (`client/src/types/index.ts`)](#66-type-definitions-clientsrctypesindexts)
7. [Database Architecture & Supabase Schema (`supabase/`)](#7-database-architecture--supabase-schema-supabase)
8. [CLI Tooling & Developer Workflows (`bin/cli.js`)](#8-cli-tooling--developer-workflows-binclijs)
9. [Deployment & Serverless Configuration (`vercel.json`, `api/`)](#9-deployment--serverless-configuration-verceljson-api)
10. [Client & SDK Integration Guides](#10-client--sdk-integration-guides)
11. [Environment Variables Specification](#11-environment-variables-specification)
12. [Local Setup & Run Instructions](#12-local-setup--run-instructions)

---

## 1. Executive Summary & Project Overview

Opuszyra acts as a **smart middle-man proxy** between developers/clients and upstream Anthropic-compatible AI endpoints (such as `https://api.opuszen.shop`). It addresses common pain points with modern foundation models:

- **Drop-in Compatibility**: Exposes `/v1/messages` and `/v1/chat/completions` compliant with the official Anthropic Python/TypeScript SDKs, OpenAI SDKs, Claude Code CLI, Cursor, Windsurf, Cline, and Roo Code.
- **5-Hour Rolling Reset Windows**: Replaces rigid 24-hour daily quotas or monthly cliffs with a rolling 5-hour window mechanism that tracks capacity from the first request in a cycle.
- **Unbuffered SSE Streaming**: Bypasses reverse proxy response buffering with `X-Accel-Buffering: no` and low-overhead chunked transfer piping, ensuring token-by-token instant display.
- **100% Free Prompt Caching Reads**: Upstream cached token hits (`cache_read_input_tokens`) do not burn against user rate quotas.
- **Zero-Friction Dual Mode**: Runs immediately without any external database setup by utilizing an in-memory mock database seeded with working test keys. When Supabase environment variables are provided, it smoothly transitions to cloud PostgreSQL with Row Level Security.
- **Built-in Key Inspection**: Allows users and administrators to query remaining tokens, allowed models, RPM/TPM limits, and rolling countdowns in real time without exposing sensitive secrets.
- **Crypto & TRC-20 Billing Automation**: Native USDT (TRC-20) checkout flow with instant transaction verification and automatic key provisioning.

---

## 2. High-Level Architecture & Flow Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT CLIENTS                                    |
|   Claude Code CLI  |  Cursor IDE  |  Python/TS SDK  |  Opuszyra React UI (Vite)  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTP / SSE
                                         v
+-----------------------------------------------------------------------------------+
|                        OPUSZYRA MIDDLE-MAN GATEWAY (Express)                      |
|                                                                                   |
|  [Middleware]: CORS, 50MB JSON Parser, Morgan Logging                             |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | /v1/messages       |   | /api/key-status       |   | /api/stats & /orders   |  |
|  | /v1/models         |   | /api/keys/*           |   | /api/status & /health  |  |
|  | /v1/chat/complet...|   | 5h Window Anchors     |   | TRC-20 Crypto Checkout |  |
|  +--------------------+   +-----------------------+   +------------------------+  |
+-----------------------------------------------------------------------------------+
             |                                                  |
             | 1. Key Check & Log                               | 2. Upstream Passthrough
             v                                                  v
+-------------------------------+             +-------------------------------------+
|      STORAGE LAYER            |             |        UPSTREAM AI GATEWAY          |
|  Live Supabase (PostgreSQL)   |             |     (https://api.opuszen.shop)      |
|              OR               |             |                                     |
|  In-Memory Mock Database      |             | - Claude 3.7 Sonnet / Hybrid        |
|  (api_keys, usage_logs,       |             | - Claude 3.5 Sonnet v2 / Haiku      |
|   crypto_orders)              |             | - Claude Opus 4.7 / 4.8 / 5.5       |
+-------------------------------+             +-------------------------------------+
```

---

## 3. Repository File & Directory Structure

```
Opuszyra/
├── .agents/                        # Specialized agent and skill configurations
├── .env.example                    # Global environment template
├── .gitignore                      # Git exclusion rules
├── README.md                       # High-level overview and onboarding
├── codebase.md                     # Comprehensive codebase and architectural specification
├── package.json                    # Root workspace package orchestrator
├── package-lock.json               # Root lockfile
├── skills-lock.json                # Skill dependency manifest
├── vercel.json                     # Vercel serverless routing and rewrite rules
│
├── api/                            # Vercel Serverless Function Bridge
│   ├── [...path].js                # Dynamic path handler delegating to server
│   └── index.js                    # Serverless root entry point restoring matched paths
│
├── bin/                            # Interactive Command-Line Tools
│   └── cli.js                      # `npx opuszyra` configuration wizard
│
├── client/                         # Frontend Application (React 18 + Vite + Tailwind CSS)
│   ├── dist/                       # Production bundle build destination
│   ├── public/                     # Static public assets (icons, logos)
│   ├── src/
│   │   ├── components/             # Reusable UI component library
│   │   │   ├── AnimatedTitle.tsx   # Dynamic typography visual accent
│   │   │   ├── CheckoutModal.tsx   # USDT TRC-20 & QR payment dialog
│   │   │   ├── CodeSwitcher.tsx    # Multi-language code snippet switcher
│   │   │   ├── Dashboard.tsx       # Live key telemetry & analytics dashboard
│   │   │   ├── DocsModal.tsx       # Embedded quick-start docs dialog
│   │   │   ├── Features.tsx        # Gateway capability presentation cards
│   │   │   ├── Footer.tsx          # System links and footer branding
│   │   │   ├── GettingStarted.tsx  # Setup workflow walkthrough
│   │   │   ├── Hero.tsx            # Landing page hero banner & CTA buttons
│   │   │   ├── KeyInspector.tsx    # Live token gauge & 5h countdown inspector
│   │   │   ├── KeyInspectorModal.tsx# Modal wrapper for the Key Inspector
│   │   │   ├── LiquidGlassThemeSwitcher.css # Theme switcher styling
│   │   │   ├── LiquidGlassThemeSwitcher.tsx # Interactive theme selector
│   │   │   ├── Marquee.tsx         # Model logo and feature scroller
│   │   │   ├── Migration.tsx       # 1-line Anthropic migration instructions
│   │   │   ├── ModelLineup.tsx     # Supported Claude models showcase
│   │   │   ├── ModelsMatrix.tsx    # Token limits and pricing matrix
│   │   │   ├── Navbar.tsx          # Navigation header with view switches
│   │   │   ├── Playground.tsx      # In-browser prompt tester with SSE stream
│   │   │   ├── PlaygroundModal.tsx # Modal wrapper for the Playground
│   │   │   ├── Pricing.tsx         # Embedded pricing card tier selection
│   │   │   ├── PricingModal.tsx    # Pricing dialog with payment launch
│   │   │   └── ThemeToggle.tsx     # Quick dark/light mode toggle button
│   │   ├── lib/
│   │   │   ├── api.ts              # Strongly typed API client library
│   │   │   ├── supabase.ts         # Frontend Supabase browser client
│   │   │   └── theme.ts            # Theme provider and persistence state
│   │   ├── pages/
│   │   │   ├── CheckUsagePage.tsx  # Dedicated full-page Key Inspector
│   │   │   ├── DocsPage.tsx        # Comprehensive interactive documentation
│   │   │   ├── PricingPage.tsx     # Dedicated standalone pricing page
│   │   │   ├── StatusPage.tsx      # System health and latency monitor page
│   │   │   └── ThemeSwitcherShowcase.tsx # Theme preview showcase
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces and models
│   │   ├── App.tsx                 # Root application coordinator and hash router
│   │   ├── index.css               # Core styling, glassmorphism, animations
│   │   ├── main.tsx                # React DOM mounting entry point
│   │   └── vite-env.d.ts           # Vite client environment types
│   ├── .env.example                # Client environment template
│   ├── index.html                  # HTML5 application shell
│   ├── package.json                # Client dependencies and build scripts
│   ├── postcss.config.js           # PostCSS configuration
│   ├── tailwind.config.js          # Tailwind design tokens and animations
│   ├── tsconfig.json               # TypeScript compiler configuration
│   ├── vercel.json                 # Client SPA rewrite rules
│   └── vite.config.ts              # Vite dev server and proxy configuration
│
├── server/                         # Backend Gateway (Node.js + Express)
│   ├── lib/
│   │   └── supabase.js             # Dual-mode Supabase client with mock store
│   ├── routes/
│   │   ├── anthropicProxy.js       # /v1/messages and /v1/chat/completions proxy
│   │   ├── keys.js                 # Key inspection, generation, and window logic
│   │   └── stats.js                # System statistics, logs, and crypto checkout
│   ├── .env                        # Local backend environment configuration
│   ├── .env.example                # Server environment template
│   ├── package.json                # Server dependencies and launch scripts
│   └── server.js                   # Main Express application entry point
│
└── supabase/
    └── schema.sql                  # PostgreSQL schema, RLS, and seed keys
```

---

## 4. Backend Server Architecture (`server/`)

### 4.1 Express Server Core (`server/server.js`)

The server entry point initializes an Express application configured for high-throughput AI streaming and middle-man routing:

- **CORS Handling**: Permissive CORS enabled across all routes for direct browser integration.
- **Payload Limits**: 50MB body limit to accommodate massive multi-modal input payloads and prompt caches.
- **Route Mounting**:
  - `/v1` & `/api/v1` -> `anthropicProxy.js`
  - `/api/key-status` -> `handleKeyStatusInspection` (`keys.js`)
  - `/api/keys` -> `keysRouter` (`keys.js`)
  - `/api/stats` -> `statsRouter` (`stats.js`)
  - `/api/status` -> Live health and upstream gateway status
  - `/api/health` -> Lightweight health check endpoint
- **Static Asset Serving & SPA Fallback**: Automatically serves `client/dist` when pre-compiled, routing non-API paths to `index.html`.
- **JSON 404 Guard**: Unhandled routes under `/api` or `/v1` are guaranteed to return JSON errors rather than HTML fallback pages.
- **Conditional Direct Run**: Only invokes `app.listen()` when executed directly, enabling seamless import into Vercel Serverless Functions.

### 4.2 Middle-Man Proxy Route (`server/routes/anthropicProxy.js`)

Implements the drop-in Anthropic protocol and forwards requests to `UPSTREAM_API_BASE` (defaulting to `https://api.opuszen.shop`):

1. **Authentication Extraction**:
   Extracts client API keys transparently from `x-api-key`, `Authorization: Bearer <token>`, query string `?key=`, or JSON payload `{ "key": "..." }`.
2. **Quota & Status Validation**:
   Checks whether the key exists in local Supabase storage:
   - Validates key status (`active`, `paused`, `revoked`).
   - Evaluates the rolling 5-hour window. If elapsed, resets `window_tokens_used` to 0.
   - Enforces `window_token_limit`. Returns `HTTP 429 rate_limit_error` if limit is exceeded.
3. **Upstream Request Forwarding**:
   Applies `UPSTREAM_API_KEY` (if configured on the gateway) or forwards the client's key directly. Preserves critical headers such as `anthropic-version` and `anthropic-beta`.
4. **Unbuffered SSE Streaming (`stream: true`)**:
   - Sets headers: `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
   - Converts web streams via `Readable.fromWeb(upstreamRes.body)`.
   - Pipes raw event chunks directly to the response with zero buffering.
   - Non-blockingly parses `data: {...}` lines for token usage telemetry (`input_tokens`, `output_tokens`).
   - Hooks into `stream.on('end')` to record usage logs and increment key token counters.
5. **OpenAI Chat Completions Layer (`POST /v1/chat/completions`)**:
   Provides an OpenAI-compatible interface for tooling that targets OpenAI endpoint structures while leveraging Anthropic models upstream.

### 4.3 Key Management & Inspector (`server/routes/keys.js`)

Centralizes key validation, generation, and rolling quota calculations:

- **In-Memory Window Anchors (`windowAnchors`)**:
  Maintains established rolling reset deadlines across repeated inspections to ensure client countdown timers do not restart when refreshed.
- **Hybrid Real-Time Telemetry (`handleKeyStatusInspection`)**:
  - Interrogates `UPSTREAM_API_BASE/api/key-status` (via GET query or POST JSON).
  - Fetches local Supabase record if present.
  - Merges upstream metrics (remaining tokens, allowed models, upstream health) with local database quotas.
  - Calculates exact hours, minutes, and seconds remaining in the 5-hour window.
- **Key Administration**:
  - `GET /api/keys`: Returns all keys with dynamic rolling window calculations.
  - `POST /api/keys`: Generates cryptographically random keys prefixed with `opm-live-{tier}`.
  - `DELETE /api/keys/:id`: Revokes or deletes a key.
  - `POST /api/keys/:id/reset-window`: Developer utility to force reset a 5-hour window.

### 4.4 Metrics, Billing & Orders (`server/routes/stats.js`)

Provides system health analytics and automated cryptocurrency order processing:

- **System Overview (`GET /api/stats/overview`)**:
  Aggregates total active keys, cumulative requests, total tokens consumed, average latency, and uptime.
- **Recent Logs (`GET /api/stats/logs`)**:
  Retrieves the most recent 20 request executions with model, latency, tokens, and timestamps.
- **Crypto Order Creation (`POST /api/stats/orders/create`)**:
  Creates a simulated or live TRC-20 deposit session for USDT payments, returning deposit addresses, QR payloads, and INR conversions.
- **Order Verification & Provisioning (`POST /api/stats/orders/verify`)**:
  Validates incoming transaction hashes and provisions an activated API key matching the selected tier (`5x` or `20x`).

### 4.5 Dual-Mode Supabase Client (`server/lib/supabase.js`)

Enables frictionless developer onboarding while maintaining enterprise cloud persistence:

```javascript
// Mode Detection Logic
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const isConfigured = supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project');
```

- **Live Mode**: When valid credentials are provided, initializes the official `@supabase/supabase-js` client.
- **In-Memory Mock Database (`MockSupabaseDatabase`)**:
  When credentials are unset or placeholder strings, provides an in-memory database implementing Supabase's query builder interface (`from()`, `select()`, `insert()`, `update()`, `delete()`, `eq()`, `order()`, `limit()`, `maybeSingle()`).
  - Pre-seeded with developer keys:
    - `opm-live-5x-9f8a3c2e1b4d7f0a` (Standard Dev Key, 25M limit, 60 RPM)
    - `opm-live-20x-8d7e6f5c4b3a2109` (Heavy Agentic Key, 100M limit, 120 RPM)
  - Pre-seeded with historical request logs for dashboard visualization.

---

## 5. API Endpoints Reference

### AI Proxy & Completions

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/v1/messages` | Discovery and gateway status | No |
| `POST` | `/v1/messages` | Anthropic Messages API passthrough (SSE / non-streaming) | `x-api-key` or `Bearer` |
| `GET` | `/v1/models` | Available Claude model lineup | Optional |
| `POST` | `/v1/chat/completions` | OpenAI-compatible completions passthrough | `Authorization: Bearer` |

### Key Telemetry & Management

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `ALL` | `/api/key-status` | Real-time key status inspection | Key in body/query/header |
| `POST` | `/api/keys/check` | Alias for key inspection | Key in body |
| `GET` | `/api/keys` | List all local API keys | Public/Internal |
| `POST` | `/api/keys` | Generate new API key | Public/Internal |
| `DELETE` | `/api/keys/:id` | Revoke/Delete an API key | Public/Internal |
| `POST` | `/api/keys/:id/reset-window` | Force reset 5-hour quota window | Public/Internal |

### System Status & Billing

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/status` | Comprehensive status of middle-man & upstream | No |
| `GET` | `/api/health` | Lightweight service health check | No |
| `GET` | `/api/stats/overview` | Gateway aggregate usage statistics | No |
| `GET` | `/api/stats/logs` | Recent request logs | No |
| `POST` | `/api/stats/orders/create` | Initialize USDT (TRC-20) checkout | No |
| `POST` | `/api/stats/orders/verify` | Verify transaction and issue API key | No |

---

## 6. Frontend Client Architecture (`client/`)

### 6.1 Application Entry & Routing (`client/src/App.tsx`)

The React frontend operates as a single-page application utilizing **Hash-based Navigation** to ensure compatibility across static hosts and sub-path deployments:

- **Supported Views**:
  - `#home`: Main landing page with hero, model lineup, architecture cards, and quick-start.
  - `#pricing`: Standalone pricing tier explorer with crypto checkout triggers.
  - `#docs`: Interactive documentation with live domain switcher and code generators.
  - `#status`: Live gateway and upstream service health monitor.
  - `#usage`: Full-page Key Inspector with rolling countdowns and model badges.
  - `#dashboard`: Management interface for local keys and usage charts.
  - `#playground`: Interactive prompt test environment with SSE streaming output.
  - `#switcher`: Interactive Liquid Glass theme switcher preview.
- **Modal Overlays**: Centrally controls modals for checkout, pricing selection, key inspection, and documentation preview without breaking page scroll state.

### 6.2 Standalone Pages (`client/src/pages/`)

- **`DocsPage.tsx`**:
  Comprehensive, interactive middle-man documentation page. Features a live domain switcher (Middle-Man Public Domain, Custom Domain, or Localhost) that dynamically re-renders all SDK integration snippets, cURL commands, CLI configurations, and Nginx reverse proxy blocks.
- **`PricingPage.tsx`**:
  Detailed pricing breakdown comparing the 5x Standard Plan, 20x Heavy Agentic Plan, and 5x Trial Tier. Includes detailed quota breakdowns, feature checklists, USDT/INR pricing tables, and FAQ accordion.
- **`StatusPage.tsx`**:
  Queries `/api/status` every 30 seconds to render real-time health indicators for middle-man proxy routing, authentication bypass, and upstream nodes, alongside ping latency and uptime meters.
- **`CheckUsagePage.tsx`**:
  Full-screen wrapper around the Key Inspector component, optimized for bookmarking and quick team usage monitoring.
- **`ThemeSwitcherShowcase.tsx`**:
  Interactive demonstration of the Liquid Glass design aesthetic and theme switching controls.

### 6.3 Reusable UI Components (`client/src/components/`)

- **`Navbar.tsx`**:
  Responsive top bar with glowing branding, navigation links (`Pricing`, `Docs`, `Status`), action button (`Check a Key`), and theme mode toggle.
- **`Hero.tsx`**:
  High-impact header section featuring animated gradient text, value proposition badges, terminal preview, and primary conversion triggers.
- **`KeyInspector.tsx` & `KeyInspectorModal.tsx`**:
  The core telemetry viewer. Renders:
  - SVG Circular progress meters for remaining token quota.
  - Real-time 5-hour rolling reset countdown timer (HH:MM:SS).
  - Rate limits (RPM and TPM).
  - Accessible model badges (`claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-opus-4-8`, etc.).
  - Recent query history and raw payload inspection drawer.
- **`Playground.tsx` & `PlaygroundModal.tsx`**:
  Integrated Claude developer sandbox. Supports model selection, system prompt configuration, temperature/max token tuning, and live token-by-token streaming rendering.
- **`CheckoutModal.tsx`**:
  Cryptocurrency payment modal providing dynamic TRC-20 deposit wallet address generation, QR code rendering, payment timer, transaction hash submission, and automatic key revelation.
- **`LiquidGlassThemeSwitcher.tsx`**:
  Custom-styled segmented theme selector with backdrop blur, specular highlights, and fluid spring animations.
- **`CodeSwitcher.tsx`**:
  Multi-tab syntax-highlighted code viewer supporting cURL, Python SDK, TypeScript SDK, and Claude Code configurations.
- **`ModelLineup.tsx` & `ModelsMatrix.tsx`**:
  Visual card deck and comparison table detailing supported models, parameter scales, context window capacities (up to 1M tokens), and capabilities.

### 6.4 Client API Layer & State (`client/src/lib/api.ts`)

Encapsulates all server communication into strongly-typed asynchronous helpers:

- `fetchKeyStatus(key)`: Submits keys to `/api/key-status` and normalizes response schemas.
- `fetchKeys()`: Retrieves all active local keys.
- `generateKey(name, tier)`: Requests new key generation.
- `deleteKey(id)`: Revokes a specified key.
- `resetKeyWindow(id)`: Resets the rolling window for testing.
- `fetchStats()`: Obtains system overview metrics.
- `fetchLogs()`: Fetches recent request execution logs.
- `createOrder(tier)`: Initiates crypto checkout session.
- `verifyOrder(orderId, tier, txHash)`: Confirms transaction hash.
- `fetchModelsCatalog()`: Retrieves active model list.
- `sendChatMessageStream(apiKey, params, onChunk, onComplete, onError)`: Manages fetch streaming for the Playground.

### 6.5 Theme System & Styling (`client/src/index.css`)

Engineered with custom CSS tokens and Tailwind utility extensions:

- **Theme Modes**: Supports Dark Mode (`dark`, base `#07080c`), Light Mode (`light`), and Liquid Glass Mode (`theme-liquid-glass`).
- **Glassmorphism Utilities**:
  - `.glass-panel`: Frosted backdrop blur (`backdrop-blur-xl`) with semi-transparent dark borders.
  - `.glass-panel-glow`: Glass panel accented with subtle neon ambient box-shadows.
  - `.neon-border`: High-contrast gradient outlines for active interactive elements.
- **Liquid Glass Aesthetic**:
  - Utilizes CSS custom properties (`--liquid-blur`, `--liquid-bg`, `--liquid-border`) to simulate refraction, specular highlights, and iridescent sheen.

### 6.6 Type Definitions (`client/src/types/index.ts`)

Central TypeScript definitions ensuring end-to-end type safety:

- `PlanTier`: `'5x' | '20x' | '5x_trial' | 'custom'`
- `ApiKey`: Core key schema with tokens, rate limits, timestamps, and consumption.
- `CheckKeyData`: Normalized telemetry returned by the Key Inspector.
- `UsageLog`: Individual request execution records.
- `SystemStats`: Global health and performance metrics.
- `ModelInfo`: Model identifiers, display names, and context capacities.

---

## 7. Database Architecture & Supabase Schema (`supabase/`)

The PostgreSQL schema is defined in [`supabase/schema.sql`](file:///d:/Projects/Opuszyra/supabase/schema.sql) and is fully compatible with Supabase SQL Editor:

```sql
-- Core Schema Structure
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    key_prefix VARCHAR(32) NOT NULL,
    key_token VARCHAR(128) NOT NULL UNIQUE,
    tier VARCHAR(20) NOT NULL DEFAULT '5x' CHECK (tier IN ('5x', '20x', 'custom')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'revoked', 'expired')),
    rate_limit_rpm INT NOT NULL DEFAULT 60,
    rate_limit_tpm INT NOT NULL DEFAULT 400000,
    window_token_limit BIGINT NOT NULL DEFAULT 25000000,
    window_tokens_used BIGINT NOT NULL DEFAULT 0,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_resets_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 hours'),
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    total_requests INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- 2. Usage Logs
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cached_tokens INT NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    status_code INT NOT NULL DEFAULT 200,
    endpoint VARCHAR(100) NOT NULL DEFAULT '/v1/messages',
    client_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Crypto Orders
CREATE TABLE IF NOT EXISTS public.crypto_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier VARCHAR(20) NOT NULL,
    amount_usdt NUMERIC(10, 2) NOT NULL,
    wallet_network VARCHAR(20) NOT NULL DEFAULT 'TRC20',
    wallet_address VARCHAR(128) NOT NULL,
    tx_hash VARCHAR(128),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed')),
    assigned_key_id UUID REFERENCES public.api_keys(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Row Level Security (RLS) & Indices

- Indices created on `api_keys(key_token)`, `usage_logs(key_id)`, and `usage_logs(created_at)`.
- RLS enabled on all three tables with permissive public policies allowing the gateway proxy to execute lookups, insertions, and usage increments under both anonymous and authenticated roles.

---

## 8. CLI Tooling & Developer Workflows (`bin/cli.js`)

Opuszyra includes a zero-dependency interactive setup wizard runnable with `npx`:

```bash
npx opuszyra
```

### Features

1. **ASCII Brand Banner**: Displays the Opuszyra terminal banner with active gateway endpoints.
2. **Key Input Validation**: Prompts for `opm-live-...` key token.
3. **Automated Configuration Targets**:
   - **Claude Code CLI**: Automatically writes or updates `~/.claude/settings.json`:
     ```json
     {
       "env": {
         "ANTHROPIC_BASE_URL": "https://api.opuszyra.live/v1",
         "ANTHROPIC_API_KEY": "opm-live-your_key"
       }
     }
     ```
   - **Cursor IDE**: Displays step-by-step instructions and settings paths for overriding the Anthropic Base URL.
   - **Terminal Shell**: Outputs shell export commands (`export ANTHROPIC_BASE_URL=...` and PowerShell `$env:...`) for immediate execution.

---

## 9. Deployment & Serverless Configuration (`vercel.json`, `api/`)

The repository supports both unified monolith execution (Express server hosting the React client) and serverless deployment on Vercel:

### Serverless Routing (`vercel.json`)

```json
{
  "version": 2,
  "installCommand": "npm install && npm --prefix client install",
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    {
      "source": "/v1/:path*",
      "destination": "/api"
    },
    {
      "source": "/((?!api/|v1/|api$|v1$).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Serverless Function Bridge (`api/index.js`)

Restores original request paths if rewritten by Vercel edge routers (`x-matched-path` or `x-forwarded-uri`), ensuring downstream Express routes receive accurate `/v1/...` and `/api/...` URIs.

---

## 10. Client & SDK Integration Guides

### Anthropic Python SDK

```python
import anthropic

client = anthropic.Anthropic(
    api_key="opm-live-5x-9f8a3c2e1b4d7f0a",
    base_url="https://api.opuszyra.live/v1"  # Or http://localhost:5000/v1
)

message = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Analyze the advantages of a 5-hour rolling quota window."}
    ]
)

print(message.content[0].text)
```

### Anthropic TypeScript / Node.js SDK

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'opm-live-5x-9f8a3c2e1b4d7f0a',
  baseURL: 'https://api.opuszyra.live/v1',
});

async function run() {
  const stream = await anthropic.messages.stream({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Explain zero-latency SSE streaming.' }],
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      process.stdout.write(chunk.delta.text);
    }
  }
}

run();
```

### Claude Code CLI

```bash
# Export environment variables
export ANTHROPIC_BASE_URL="https://api.opuszyra.live/v1"
export ANTHROPIC_API_KEY="opm-live-5x-9f8a3c2e1b4d7f0a"

# Launch Claude Code
claude
```

### Cursor IDE Configuration

1. Open **Cursor Settings** (`Ctrl+,` or `Cmd+,`).
2. Navigate to **Features > Models**.
3. Under **Anthropic API Key**:
   - Check **Override Anthropic Base URL**.
   - Set URL: `https://api.opuszyra.live/v1`
   - Paste Key: `opm-live-20x-8d7e6f5c4b3a2109`

### Raw cURL Request

```bash
curl -X POST https://api.opuszyra.live/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: opm-live-5x-9f8a3c2e1b4d7f0a" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 512,
    "stream": true,
    "messages": [
      {"role": "user", "content": "Ping gateway health"}
    ]
  }'
```

---

## 11. Environment Variables Specification

| Variable | Scope | Default Value | Description |
|---|---|---|---|
| `PORT` | Server | `5000` | Port for Express backend listener |
| `UPSTREAM_API_BASE` | Server | `https://api.opuszen.shop` | Target upstream AI gateway |
| `API_DOMAIN` | Server | `https://api.opuszyra.live` | Public domain for middle-man documentation & CLI |
| `UPSTREAM_API_KEY` | Server | `""` (Optional) | Master key override sent to upstream if configured |
| `SUPABASE_URL` | Server / Client | `""` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Server / Client | `""` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | `""` | Supabase administrative service role key |
| `VITE_API_BASE` | Client | `""` (Relative `/api`) | Backend API base path for client requests |

---

## 12. Local Setup & Run Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Step 1: Install Dependencies
From the repository root, install workspace dependencies across root, server, and client:
```bash
npm install
npm run install:all
```

### Step 2: Start Development Server
Launch both the Vite frontend server and Express backend gateway concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API Gateway**: [http://localhost:5000](http://localhost:5000)
- **Gateway Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Key Status Endpoint**: [http://localhost:5000/api/key-status](http://localhost:5000/api/key-status)

### Step 3: Production Build & Launch
Compile the React client and run the unified Express server:
```bash
npm run build
npm start
```
The application will be served on port `5000`, routing both the API endpoints and the frontend client.
