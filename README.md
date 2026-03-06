# wow-groups

WoW Mythic+ dungeon group organizer. Helps guild leaders distribute players into balanced groups of 5 (1 tank / 1 healer / 3 DPS) across multiple runs in a single evening session.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Setting Up Icons (required for class/spec images)

Icons are downloaded once from the official Blizzard Game Data API and stored locally. The app makes no external requests at runtime.

### 1. Get Battle.net API credentials

1. Go to [https://develop.battle.net](https://develop.battle.net) and sign in with your Battle.net account
2. Click **Create Client** and fill in the form:
   - **Client Name:** anything (e.g. `wow-groups`)
   - **Redirect URIs:** `http://localhost` (required but not used)
   - **Service URL:** optional
   - **Intended Use:** select *Game Data APIs*
3. After creating the client, copy the **Client ID** and **Client Secret** from the client detail page

### 2. Configure your credentials

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```
BNET_CLIENT_ID=your_client_id_here
BNET_CLIENT_SECRET=your_client_secret_here
BNET_REGION=eu   # or us, kr, tw
```

### 3. Run the download script

```bash
node scripts/download-assets.js
```

This fetches all class and spec icons and saves them to `public/icons/`. The script is safe to re-run — it skips files that already exist.

Icons are committed to the repo so this step only needs to be done once (or when new classes/specs are added to the game).

## Deployment

Deploy to Vercel with zero configuration:

```bash
npx vercel
```

No environment variables are needed at runtime — all icons are static files bundled with the app.
