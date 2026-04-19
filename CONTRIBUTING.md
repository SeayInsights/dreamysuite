# Contributing to DreamySuite

## Branch Naming

| Prefix | When to use |
|--------|-------------|
| `feat/` | New capabilities |
| `fix/` | Bug fixes |
| `hotfix/` | Urgent production fixes |
| `chore/` | Tooling, deps, config |

## Commit Message Format

```
type: short description
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## Pull Request Checklist

- [ ] Tests pass (`npm test`)
- [ ] Lint clean (`npm run lint`)
- [ ] CHANGELOG updated under `[Unreleased]`
- [ ] PR uses squash merge

## Running Locally

```bash
npm install
npm run dev        # Next.js dev server
npm run preview    # Cloudflare Workers runtime preview
npm test           # Vitest unit tests
npm run test:e2e   # Playwright end-to-end
```

## Security Issues

See [SECURITY.md](SECURITY.md).
