# Opuszyra — Claude LLM Proxy & API Gateway

A high-performance Anthropic API Gateway engineered with **React (Vite)**, **Tailwind CSS**, **Node.js (Express)**, and **Supabase** (PostgreSQL).

Provides drop-in Anthropic compatibility with high-capacity 5-hour rolling reset windows, unbuffered Server-Sent Events (SSE) streaming, 100% free prompt caching reads, real-time key inspection, and crypto USDT (TRC-20) checkout automation.

---

## 🌟 Key Features

1. **Middle-Man Passthrough API Bypass (`https://api.opuszen.shop`)**:
   - Acts as a high-performance middle-man gateway forwarding `/v1/messages`, `/v1/models`, and `/v1/chat/completions` to `https://api.opuszen.shop` with zero-latency unbuffered SSE streaming and prompt caching.
   - Host under your own custom domain (`api.yourdomain.com` or `https://api.opuszyra.live`) and distribute keys to your users.
2. **Real-Time Token Status API (`/api/key-status`)**:
   - Queries `https://api.opuszen.shop/api/key-status` in real-time to retrieve exact remaining tokens, 5-hour rolling countdowns, allowed models, and node health.
3. **Anthropic-Compatible Drop-In Proxy (`/v1/messages`)**:
   - Supports official Anthropic Python and TypeScript SDKs, Claude Code CLI, Cursor, Windsurf, Cline, and Roo Code.
   - Simply change `base_url` to `https://api.opuszyra.live/v1` (or your middle-man domain).
4. **Interactive Middle-Man Documentation Page**:
   - Live interactive domain switcher that dynamically re-renders all SDK code snippets, cURL examples, IDE settings, and Nginx reverse proxy configs for your custom domain.
5. **Rolling 5-Hour Reset Windows**:
   - Token capacity resets 5 hours from the first request—no rigid 24-hour lockouts or calendar day cliffs.
6. **Opuszyra Key Inspector (`/check a key`)**:
   - Anonymous inspection tool displaying real-time 5-hour countdown timer, remaining token allowances, RPM/TPM limits, and model access.
7. **Interactive Claude Playground**:
   - Test prompts against Claude 3.7 Sonnet (Hybrid Reasoning), Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3.5 Haiku with live SSE streaming token output and metrics.
8. **100% Free Prompt Caching Reads**:
   - Cached tokens incur 0 quota burn against your rolling window.
9. **Instant Crypto USDT (TRC20) Checkout**:
   - Instant simulated or live blockchain key provisioning without KYC hurdles.
10. **Supabase PostgreSQL Schema**:
   - Complete schema in `supabase/schema.sql` with Row Level Security (RLS) policies, seeds, and rate tracking.

---

## 🚀 Quick Start

### 1. Install Dependencies
Run the following in the project root:

```bash
# Install root orchestration tools
npm install

# Install client and server dependencies
npm run install:all
```

Or install individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Run Locally in Development Mode

Run both the React frontend and Node.js backend concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Node.js API Gateway**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🗄️ Supabase Configuration

This codebase is designed with a **zero-friction dual mode**:
- **Out of the box**: Runs immediately with an in-memory database and seeded test keys (`opm-live-5x-9f8a3c2e1b4d7f0a` and `opm-live-20x-8d7e6f5c4b3a2109`).
- **Production Mode**: To connect to your Supabase project:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the entire script in [`supabase/schema.sql`](./supabase/schema.sql).
3. Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
4. Restart the server. It will immediately synchronize with your live Supabase database!

---

## 🛠️ Integration Examples

### Claude Code CLI
```bash
export ANTHROPIC_BASE_URL="http://localhost:5000/v1"
export ANTHROPIC_API_KEY="opm-live-5x-9f8a3c2e1b4d7f0a"
claude
```

### Cursor IDE
In **Cursor Settings > Models > Anthropic API Key**:
- Override Base URL: `http://localhost:5000/v1`
- API Key: `opm-live-20x-8d7e6f5c4b3a2109`

### Python SDK
```python
import anthropic

client = anthropic.Anthropic(
    api_key="opm-live-5x-9f8a3c2e1b4d7f0a",
    base_url="http://localhost:5000/v1"
)

res = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Analyze system architecture"}]
)
print(res.content[0].text)
```

---

## 📂 Project Architecture

```
Opuszyra/
├── client/                     # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/         # Navbar, Hero, KeyInspector, Playground, Dashboard, etc.
│   │   ├── lib/                # API client and Supabase client
│   │   ├── types/              # TypeScript types
│   │   ├── App.tsx             # Main view coordinator
│   │   └── index.css           # Glassmorphism & neon theme
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Node.js + Express backend
│   ├── routes/
│   │   ├── anthropicProxy.js   # /v1/messages endpoint with unbuffered SSE
│   │   ├── keys.js             # API key generation, inspector & rolling window
│   │   └── stats.js            # System metrics & crypto checkout orders
│   ├── lib/
│   │   └── supabase.js         # Supabase client with seamless mock fallback
│   ├── server.js
│   └── package.json
├── supabase/
│   └── schema.sql              # Supabase PostgreSQL schema with RLS & seed data
└── package.json                # Root orchestration
```
