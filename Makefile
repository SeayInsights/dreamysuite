.PHONY: dev build test lint fmt audit preview deploy migrate migrate-local

dev:
	npm run dev

build:
	npm run build

test:
	npm test

lint:
	npm run lint

fmt:
	npm run format

audit:
	npm audit --audit-level=high

preview:
	npm run preview

deploy:
	npm run deploy

migrate:
	wrangler d1 migrations apply dreamysuite-db --remote

migrate-local:
	wrangler d1 migrations apply dreamysuite-db --local
