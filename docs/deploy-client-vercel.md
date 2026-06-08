# Deploy the client to Vercel

Manual only — pushes to `master` do not deploy.

## One-time setup

1. Create a Vercel project with `client/` as the root, Framework = "Other".
2. **Settings → Git → Ignored Build Step:** `exit 0`.
3. **Settings → Environment Variables:** add `GAE_SERVER_URL` (full URL with `https://`) and tick **both** Production and Preview — Makefile targets read from whichever environment you deploy to, and the GHA workflow deploys to Preview.
4. **Account Settings → Tokens:** create a team-scoped token. Save it as:
   - GitHub repo secret `VERCEL_TOKEN` (for the workflow).
   - Local shell `export VERCEL_TOKEN=...` (for the Makefile).
5. Link the local checkout to the existing Vercel project (from the repo root, since Vercel's Root Directory is `client`):

   ```sh
   VERCEL_PROJECT_ID=prj_xxx make vercel-bootstrap
   ```

   `VERCEL_PROJECT_ID` is the project's ID from **Settings → General → Project ID** in the Vercel dashboard. The target resolves the `orgId` from the Vercel API and writes `.vercel/project.json`.

Also add the Vercel deployment origin to the GAE server's `client_urls`, or every browser request fails CORS.

## Deploy

- **GitHub:** Actions → "Deploy Client (Vercel)" → "Run workflow". Optional `ref` input (default `master`).
- **Local — preview** (unique URL, no auto-promote), from repo root:
  ```sh
  VERCEL_TOKEN=<token> make deploy-client-to-vercel-preview
  ```
  Promote later with `vercel promote <url> --prod` or via the dashboard.
- **Local — production** (live immediately on the prod alias), from repo root:
  ```sh
  VERCEL_TOKEN=<token> make deploy-client-to-vercel-production
  ```

Each target has a matching `vercel-link-{production,preview}` that's run automatically as a prerequisite.

`GAE_SERVER_URL` must be configured in Vercel for whichever environment you're deploying to (Production for `-production`, Preview for `-preview`, or both).

## Known issue

[`client/src/settings/server/server.ts`](../client/src/settings/server/server.ts) hardcodes `https://api.solpg.io` when `NODE_ENV === "production"` and ignores `REACT_APP_SERVER_URL`. Until that's patched, deploys hit `api.solpg.io` regardless of `GAE_SERVER_URL`.
