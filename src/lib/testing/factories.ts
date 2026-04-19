/**
 * Shared test factory helpers.
 *
 * makeDbStub — mirrors the pattern in src/lib/schemas/settings.test.ts.
 * Use it in any Vitest spec that needs a lightweight D1 double without
 * spinning up a real database.
 */

// ---------------------------------------------------------------------------
// DB stub
// ---------------------------------------------------------------------------

export interface DbCall {
  sql: string;
  values: unknown[];
}

export interface DbStub {
  db: D1Database;
  calls: DbCall[];
}

/**
 * Minimal D1 stub: captures each prepared statement + its bindings.
 * Models the narrow surface area used by the repository helpers
 * (prepare → bind → first / run).
 *
 * @param firstResult  Value returned by `.first()` on the first prepared
 *                     statement. Pass `null` to simulate "row not found".
 */
export function makeDbStub(firstResult: Record<string, unknown> | null): DbStub {
  const calls: DbCall[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async first() {
              calls.push({ sql, values });
              return firstResult;
            },
            async run() {
              calls.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
  };
  return { db: db as unknown as D1Database, calls };
}

// ---------------------------------------------------------------------------
// Domain object factories
// ---------------------------------------------------------------------------

let _siteSeq = 0;
let _blockSeq = 0;
let _userSeq = 0;

/** Reset all sequences — call in beforeEach if isolation matters. */
export function resetFactorySequences() {
  _siteSeq = 0;
  _blockSeq = 0;
  _userSeq = 0;
}

export interface SiteOverrides {
  id?: string;
  slug?: string;
  name?: string;
  userId?: string;
  status?: "draft" | "published";
  createdAt?: number;
  updatedAt?: number;
}

/** Returns a minimal site-shaped object suitable for unit tests. */
export function makeSite(overrides: SiteOverrides = {}) {
  const n = ++_siteSeq;
  return {
    id: overrides.id ?? `site-${n}`,
    slug: overrides.slug ?? `test-site-${n}`,
    name: overrides.name ?? `Test Site ${n}`,
    userId: overrides.userId ?? `user-1`,
    status: overrides.status ?? ("draft" as const),
    createdAt: overrides.createdAt ?? 1_000_000,
    updatedAt: overrides.updatedAt ?? 1_000_000,
  };
}

export interface BlockOverrides {
  id?: string;
  siteId?: string;
  type?: string;
  position?: number;
  data?: Record<string, unknown>;
}

/** Returns a minimal block-shaped object suitable for unit tests. */
export function makeBlock(overrides: BlockOverrides = {}) {
  const n = ++_blockSeq;
  return {
    id: overrides.id ?? `block-${n}`,
    siteId: overrides.siteId ?? `site-1`,
    type: overrides.type ?? "hero",
    position: overrides.position ?? n,
    data: overrides.data ?? {},
  };
}

export interface UserOverrides {
  id?: string;
  email?: string;
  name?: string;
  createdAt?: number;
}

/** Returns a minimal user-shaped object suitable for unit tests. */
export function makeUser(overrides: UserOverrides = {}) {
  const n = ++_userSeq;
  return {
    id: overrides.id ?? `user-${n}`,
    email: overrides.email ?? `user${n}@example.com`,
    name: overrides.name ?? `Test User ${n}`,
    createdAt: overrides.createdAt ?? 1_000_000,
  };
}
