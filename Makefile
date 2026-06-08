# Targets mirroring select GitHub Actions workflows for local execution.
# `make deploy-client` performs the same client build + Vercel deploy as
# .github/workflows/_deploy_client_vercel.yml; see that file for the
# canonical pipeline.

.PHONY: deploy-client

# Required env: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, GAE_SERVER_URL
deploy-client:
	@: $${VERCEL_TOKEN:?VERCEL_TOKEN is unset}
	@: $${VERCEL_ORG_ID:?VERCEL_ORG_ID is unset}
	@: $${VERCEL_PROJECT_ID:?VERCEL_PROJECT_ID is unset}
	@: $${GAE_SERVER_URL:?GAE_SERVER_URL is unset}
	@echo "warning: REACT_APP_SERVER_URL is currently ignored by production builds — client/src/settings/server/server.ts hardcodes api.solpg.io when NODE_ENV=production."
	cd client && \
		export REACT_APP_SERVER_URL="https://$${GAE_SERVER_URL}" && \
		yarn setup && \
		yarn build && \
		npx vercel@latest pull --yes --environment=production --token="$${VERCEL_TOKEN}" && \
		npx vercel@latest build --prod --token="$${VERCEL_TOKEN}" && \
		npx vercel@latest deploy --prebuilt --token="$${VERCEL_TOKEN}"
