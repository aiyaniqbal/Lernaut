# Lernaut — Complete Vercel & Cloud Deployment Guide
*(Matching B2B Platform Production Architecture)*

This step-by-step guide details how to deploy **Lernaut** to **Vercel** with a serverless cloud PostgreSQL database (**Neon**), environment variables, monorepo settings, and custom domain verification.

---

## Architecture Overview

```mermaid
graph TD
    Client[User Browser] -->|HTTPS| CloudflareOrDNS[DNS / Custom Domain]
    CloudflareOrDNS -->|Global Edge CDN| Vercel[Vercel Serverless Platform]
    
    subgraph Vercel ["Vercel (Root Directory: apps/web)"]
        NextFrontend[Next.js 16 Web App]
        ServerActions[Server Actions: xp.ts & progression.ts]
        PrismaClient[Prisma Client: rhel-openssl-3.0.x Engine]
    end
    
    NextFrontend --> ServerActions
    ServerActions --> PrismaClient
    PrismaClient -->|Connection Pooling / SSL| NeonPostgres[(Neon Serverless PostgreSQL\nAWS Singapore: ap-southeast-1)]
```

---

## Phase 1: Set Up Cloud PostgreSQL Database (Neon)

Vercel functions run in a serverless environment and cannot connect to a local database (`localhost:5432`). Like your previous B2B platform, we use **Neon** for high-performance serverless PostgreSQL with connection pooling.

1. **Sign in to Neon**:
   - Go to **[https://neon.tech](https://neon.tech)** and sign in with GitHub (`aiyaniqbal`).
2. **Create New Project**:
   - **Project Name**: `lernaut-production`
   - **Region**: Choose **AWS Asia-Pacific (Singapore) - `ap-southeast-1`** (lowest latency for India & SEA).
   - **PostgreSQL Version**: `16` (default).
3. **Copy Connection String**:
   - On the Neon dashboard, locate the **Connection Details** card.
   - Select **Pooled connection** (with `-pooler` in the host).
   - The connection string will look like:
     ```text
     postgresql://neondb_owner:YOUR_PASSWORD@ep-weathered-frost-b3y20hmg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
4. **Push Prisma Schema to Neon**:
   - In your local terminal, navigate to `apps/web`:
     ```powershell
     cd c:\Users\AIYAN\Documents\Projects\ai-teacher\apps\web
     ```
   - Temporarily set the `DATABASE_URL` to your Neon string (or add it to your local `apps/web/.env`):
     ```text
     DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-...-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
     ```
   - Run the schema push to create all tables in the cloud:
     ```powershell
     npx prisma db push
     ```
   - All tables (`User`, `Profile`, `XpTransaction`, `DailyActivity`, `LessonProgress`, `Achievement`, `UserAchievement`) will be created in Neon within seconds.

---

## Phase 2: Deploy to Vercel

### Step 1: Import Repository
1. Navigate to **[https://vercel.com/new](https://vercel.com/new)**.
2. Select your GitHub account (`aiyaniqbal`).
3. Search for **`Lernaut`** and click **Import**.

### Step 2: Configure Project Settings (Monorepo Setup)

> [!IMPORTANT]
> Because Lernaut is a monorepo (`apps/web` and `apps/api`), you **MUST** set the **Root Directory** to `apps/web`.

| Setting | Value | Notes |
|---|---|---|
| **Project Name** | `lernaut-web` (or `lernaut`) | Appears on your Vercel dashboard |
| **Framework Preset** | `Next.js` | Automatically detected |
| **Root Directory** | **`apps/web`** | Click **Edit** and select `apps/web` |
| **Build Command** | `npm run build` | Runs `prisma generate && next build` |
| **Output Directory** | `.next` | Default Next.js build output |
| **Install Command** | `npm install` | Default |

---

## Phase 3: Configure Environment Variables in Vercel

In the Vercel setup screen (under **Environment Variables**), add the following:

| Variable Name | Example / Recommended Value | Description | Environments |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:PWD@ep-...-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Pooled connection string from Neon | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://lernaut.vercel.app` (or custom domain) | Public frontend URL | Production, Preview |
| `NODE_ENV` | `production` | Production mode | Production |

### How to Add Variables in Vercel:
1. Under **Key**, enter: `DATABASE_URL`
2. Under **Value**, paste your full Neon pooled connection string.
3. Check all checkboxes: **Production**, **Preview**, and **Development**.
4. Click **Add**.

---

## Phase 4: Trigger Initial Deployment

1. Click the blue **Deploy** button.
2. Vercel will execute:
   - `npm install` (resolves workspace dependencies)
   - `prisma generate` (compiles Linux `rhel-openssl-3.0.x` query engine)
   - `next build` (compiles Next.js 16 with static page generation)
3. Upon completion (~1-2 minutes), you will see the **"Congratulations! What's next?"** screen.
4. Your application will be live at: `https://lernaut-web.vercel.app` (or your chosen project slug).

---

## Phase 5: Custom Domain & DNS Verification

To connect your custom domain (same as done for the B2B platform):

1. Go to your Vercel Project Dashboard → **Settings** → **Domains**.
2. Enter your domain (e.g. `lernaut.com` or `app.lernaut.com`) and click **Add**.
3. Choose redirect recommendation:
   - Redirect `lernaut.com` to `www.lernaut.com` (or vice-versa).
4. Vercel will display the exact DNS records required:

### DNS Configuration Table:
| Type | Name / Host | Value / Target | TTL |
|---|---|---|---|
| **A** | `@` (root) | `76.76.21.21` | Auto / 3600 |
| **CNAME** | `www` (or subdomain) | `cname.vercel-dns.com` | Auto / 3600 |

5. **Validation**:
   - Open your domain registrar (GoDaddy, Namecheap, Cloudflare, Hostinger, etc.).
   - Update the DNS records as shown above.
   - Vercel checks DNS records automatically (usually takes 2–15 minutes).
   - Once verified, Vercel will automatically provision a free Let's Encrypt SSL/TLS certificate.

---

## Phase 6: Production Verification Checklist

After deployment, perform these quick sanity checks on your live URL:

- [ ] **Landing Page**: Verify hero, interactive learning showcase, colorful cards, and CTA render cleanly.
- [ ] **Authentication**:
  - Test **Sign Up** (`/signup`): Create an account.
  - Test **Login** (`/login`): Test Quick Demo or sign in with created account.
- [ ] **Database Connection**: Complete a study session or action and verify that XP updates and persists without errors.
- [ ] **Leaderboard & Streaks**: Confirm that the user's XP and streak are active on the dashboard.
- [ ] **HTTPS / SSL**: Ensure padlock icon is visible in the browser address bar.
