# Changelog

All notable changes to DreamySuite are documented here.

## [Unreleased]

### Fixed

- Editor: clicking a selected block no longer deselects it — allows text cursor placement (#198, #200)
- Editor: background image stays within canvas bounds with proper overflow containment (#196, #201)
- Renderer: tablet/mobile block order now matches desktop visual positions via blockOffsetY sort (#197, #202)
- Editor: photo picker shows actual images instead of filenames by bypassing next/image proxy (#195, #203)

### Added

- Pre-commit hooks via husky + lint-staged (ESLint + Prettier on staged files)
- CHANGELOG.md

## [0.1.0] — 2026-04-30

### Added

- Project documentation: CONTEXT.md, SECURITY.md, CONTRIBUTING.md (#199)

### Fixed

- ESLint: resolved all 199 warnings to zero (#192)
- ESLint: replaced FlatCompat with native eslint-config-next flat config (#191)
- Dependencies: updated @aws-sdk to resolve fast-xml-parser vulnerability (#187)
- Config: separated KV preview namespace from production (#186)
- Store: themeTokens SSOT, error handling, timeline empty state (#182)
- A11y: alt text, labels, iframe title, replaced hardcoded colors (#181)
- API: safeJsonParse at API boundaries (#177)
- API: auth + rate limiting on maps embed and guestbook endpoints (#176)
- Inspector: wired text formatting controls to inspector panel (#174)
- Editor: north resize collapse and tablet block order mismatch (#167)

### Changed

- Removed 3 unused dependencies (#193)
- Organized lib/ into i18n/, animation/, editor/ subdirectories (#190)
- Consolidated redundant block components (#189)
- Structure remediation across 39 tasks (#188)
- Extracted shared canvas/guests helpers, use requireSiteOwnership (#183)
- Removed dead code, files, exports, and store subscriptions (#179, #180)
- Consolidated floating UIs and Content tab into Design panel (#173)
- Re-sort blocks by blockOffsetY on drag-end (#171)
