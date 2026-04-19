.PHONY: dev build test lint fmt audit preview deploy

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
