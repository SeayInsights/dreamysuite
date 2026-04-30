# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in DreamySuite, please report it responsibly.

**Contact:** dannis.seay@twinrootsllc.com

**Process:**
1. Email the details to the address above
2. Include steps to reproduce the issue
3. Allow 48 hours for initial response
4. Do not publicly disclose until a fix is available

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main) | Yes |

## Security Measures

- All API routes validate input via Zod schemas
- Authentication via better-auth with session management
- D1 (SQLite) queries use parameterized statements
- R2 media uploads are scoped to authenticated users
- npm audit runs on every CI deploy
- No Server Actions (Workers runtime limitation — all mutations via API routes)
