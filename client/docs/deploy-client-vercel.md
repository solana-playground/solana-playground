# Deploy the client to Vercel

Vercel's native Git integration auto-deploys: `master` → production; any other branch → preview. Makefile targets exist as a local escape hatch.

`installCommand` = `bash scripts/vercel-install.sh` (rustup + `wasm/build.sh` + `yarn install`); `buildCommand` = `yarn build`. Wasm must precede `yarn install` because `client/package.json` has `file://../wasm/*/pkg` deps that don't exist until `wasm-pack` runs.

## Verified Vercel project settings

| Setting | Value |
| --- | --- |
| Plan / Build Machine | Enterprise + **Enhanced** (~18 min cold) |
| Framework Preset | Other |
| Root Directory | `client` |
| Production Branch | `master` |
| Ignored Build Step | Automatic |
| Node | `22.x` (project); `^22.20.0` (`package.json` engines) |

## One-time setup

1. Create the project. Framework: Other. Root Directory: `client`.
2. Build Machine: Enhanced on Enterprise; default on Pro.
3. Production Branch: `master`. Ignored Build Step: Automatic.
4. Node.js Version: `22.x`.
5. Environment Variables: `REACT_APP_SOLANA_FOUNDATION_SERVER_URL` (full URL, `https://`, no trailing slash) for Production and Preview.
6. Account Settings → Tokens: team-scoped token, `export VERCEL_TOKEN=...` locally for the Makefile targets.
7. Link the local checkout (from repo root):

   ```sh
   VERCEL_PROJECT_ID=prj_xxx make vercel-bootstrap
   ```

Add the Vercel deployment origin to the GAE server's `client_urls` or CORS will reject every request.

## Deploy

- **Automatic:** push the branch.
- **Local preview:** `VERCEL_TOKEN=<token> make deploy-client-to-vercel-preview`. Promote later with `vercel promote <url> --prod`.
- **Local production:** `VERCEL_TOKEN=<token> make deploy-client-to-vercel-production`.

`vercel-link-{production,preview}` runs automatically as a prerequisite for each Makefile target.

## Endpoint routing

- All non-share routes → `REACT_APP_SOLANA_FOUNDATION_SERVER_URL` (also user-overridable via the `server.endpoint` setting), so forks can point at their own backend.
- Share routes (`/share/*`, `/new`) → hardcoded `https://api.solpg.io` so shared snippets stay discoverable across hosts.
