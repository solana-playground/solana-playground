# Local Vercel deploy targets.
# One-time setup at repo root: create the Vercel project in the dashboard, then `make vercel-bootstrap` to link this checkout to it.
# See docs/deploy-client-vercel.md for the full setup.
#
# Layout: Vercel project's Root Directory is `client`, so vercel CLI must run from repo root (cwd + RootDirectory = client/).
# yarn needs cwd = client/, so it's wrapped in `(cd client && ...)` to scope the cd back to repo root for the following vercel calls.

.PHONY: vercel-bootstrap vercel-link-production vercel-link-preview deploy-client-to-vercel-production deploy-client-to-vercel-preview

# Resolve orgId from Vercel API + write .vercel/project.json. Run once after the dashboard project exists. Requires jq.
vercel-bootstrap:
	@: $${VERCEL_TOKEN:?VERCEL_TOKEN is unset}
	@: $${VERCEL_PROJECT_ID:?VERCEL_PROJECT_ID is unset}
	@command -v jq >/dev/null 2>&1 || { echo "jq required — see https://jqlang.org/download/" >&2; exit 1; }
	@response=$$(curl -sH "Authorization: Bearer $${VERCEL_TOKEN}" "https://api.vercel.com/v9/projects/$${VERCEL_PROJECT_ID}"); \
		org_id=$$(echo "$$response" | jq -r '.accountId // empty'); \
		if [ -z "$$org_id" ]; then echo "Bootstrap failed. Vercel API response: $$response" >&2; exit 1; fi; \
		mkdir -p .vercel; \
		jq -n --arg org "$$org_id" --arg proj "$${VERCEL_PROJECT_ID}" '{orgId: $$org, projectId: $$proj}' > .vercel/project.json; \
		echo "Wrote .vercel/project.json"

# Pull production env vars from Vercel into .vercel/.env.production.local.
vercel-link-production:
	@: $${VERCEL_TOKEN:?VERCEL_TOKEN is unset}
	npx vercel@latest pull --yes --environment=production --token="$${VERCEL_TOKEN}"

# Pull preview env vars from Vercel into .vercel/.env.preview.local.
vercel-link-preview:
	@: $${VERCEL_TOKEN:?VERCEL_TOKEN is unset}
	npx vercel@latest pull --yes --environment=preview --token="$${VERCEL_TOKEN}"

# Build + deploy straight to the production alias. Live immediately.
deploy-client-to-vercel-production: vercel-link-production
	set -a && . ./.vercel/.env.production.local && set +a && \
		export REACT_APP_SERVER_URL="$${GAE_SERVER_URL:?GAE_SERVER_URL missing from Vercel production env}" && \
		(cd client && yarn setup && yarn build) && \
		npx vercel@latest build --prod --token="$${VERCEL_TOKEN}" && \
		npx vercel@latest deploy --prebuilt --prod --token="$${VERCEL_TOKEN}"

# Build + deploy as a unique preview URL. Promote with `vercel promote <url> --prod`.
deploy-client-to-vercel-preview: vercel-link-preview
	set -a && . ./.vercel/.env.preview.local && set +a && \
		export REACT_APP_SERVER_URL="$${GAE_SERVER_URL:?GAE_SERVER_URL missing from Vercel preview env}" && \
		(cd client && yarn setup && yarn build) && \
		npx vercel@latest build --token="$${VERCEL_TOKEN}" && \
		npx vercel@latest deploy --prebuilt --token="$${VERCEL_TOKEN}"
