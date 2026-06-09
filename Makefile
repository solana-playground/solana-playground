# Root Makefile — aggregator for per-area submakes.
# Each included file's targets are surfaced through `make help` if they carry a `## description` annotation.

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@printf 'Usage: make <target>\n\nTargets:\n'
	@sed -nE 's/^([a-zA-Z_%-]+):.*## (.*)$$/  \1: \2/p' $(MAKEFILE_LIST)

include Makefile.vercel
