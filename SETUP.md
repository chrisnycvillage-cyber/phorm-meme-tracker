# 1st Phorm Meme Seeding Tracker - Setup Guide

## Quick Start

### 1. Install & Deploy Convex

```bash
cd "/Users/wsnh/adley : phorm"
npm install
npx convex dev
```

This will:
- Prompt you to login/create a Convex account
- Create a new project
- Deploy your backend
- Give you a deployment URL like `https://xyz-123.convex.cloud`

### 2. Set Your Apify API Token

```bash
npx convex env set APIFY_API_TOKEN your_apify_api_token_here
```

Get your token from: https://console.apify.com/account/integrations

### 3. Update Frontend

In `index.html`, find this line near the top of the `<script>` section:

```javascript
const CONVEX_URL = null;
```

Change it to your deployment URL:

```javascript
const CONVEX_URL = 'https://your-deployment.convex.cloud';
```

### 4. Seed the Database

Open the tracker with `?admin=true`:
```
http://localhost:3000?admin=true
```

Click **"📥 Seed Posts to DB"** to load all Instagram URLs.

### 5. Run First Scrape

Click **"🔄 Run Instagram Scrape"** to fetch real stats from Instagram via Apify.

---

## How It Works

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Convex       │────▶│    Apify        │
│   (index.html)  │◀────│   (Backend)     │◀────│   (Scraper)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Real-time              Database              Instagram API
    Subscriptions          + Cron Jobs
```

### Data Flow

1. **Posts are seeded** from the hardcoded list in `convex/seed.ts`
2. **Apify scrapes Instagram** every 6 hours (or manually triggered)
3. **Convex stores results** and pushes updates to frontend in real-time
4. **Frontend auto-updates** - no refresh needed!

### Scheduled Jobs

| Job | Frequency | Description |
|-----|-----------|-------------|
| `scrape-instagram-stats` | Every 6 hours | Scrapes all posts via Apify |

---

## Admin Panel

Add `?admin=true` to URL to show admin controls:

| Button | Action |
|--------|--------|
| 📥 Seed Posts to DB | Load all IG URLs into database |
| 🔌 Test Apify Connection | Verify API token works |
| 🔄 Run Instagram Scrape | Manually trigger scrape |
| 📊 View Scrape History | See recent job results |
| 🔍 View Last Results | Debug Apify response data |

---

## Adding New Posts

Edit `convex/seed.ts` and add URLs to the `CAMPAIGN_POSTS` array:

```typescript
const CAMPAIGN_POSTS = [
  "https://www.instagram.com/reel/ABC123/",
  "https://www.instagram.com/reel/DEF456/",
  // Add new URLs here
];
```

Then run seed again from admin panel.

---

## Apify Details

**Actor:** `apify~instagram-post-scraper`

**Input format:**
```json
{
  "username": [
    "https://www.instagram.com/reel/ABC123/",
    "https://www.instagram.com/reel/DEF456/"
  ],
  "resultsLimit": 100
}
```

**Cost:** ~$0.25-0.50 per 100 posts scraped

---

## Troubleshooting

### "Convex not configured"
Update `CONVEX_URL` in index.html

### "APIFY_API_TOKEN not set"
Run: `npx convex env set APIFY_API_TOKEN your_token`

### Posts not updating after scrape
- Check Convex dashboard logs
- Click "View Last Results" to see raw Apify data
- Verify shortcodes match between DB and Apify response

### Scrape timing out
- Apify may take 5-15 minutes for large batches
- Check job status in "View Scrape History"

---

## Files

```
├── index.html           # Frontend with Convex real-time client
├── package.json         # Dependencies
├── convex/
│   ├── schema.ts        # Database schema
│   ├── posts.ts         # Post queries & mutations
│   ├── seed.ts          # Seed data + add post functions
│   ├── apify.ts         # Apify scraper integration
│   ├── scrapeJobs.ts    # Job tracking
│   └── crons.ts         # 6-hour scheduled scrape
└── SETUP.md             # This file
```
