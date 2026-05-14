.PHONY: fmt fmt-check lint lint-fix

fmt:
	cargo +nightly fmt

fmt-check:
	cargo +nightly fmt --check

lint:
	cargo clippy --locked --all-targets -- -D warnings

lint-fix:
	cargo clippy --fix --locked --all-targets --allow-dirty -- -D warnings
