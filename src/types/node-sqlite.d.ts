/**
 * Minimal ambient types for `node:sqlite` (experimental Node API, Node 22+).
 *
 * Used only by the migration/DB test files. `@types/node@20` predates these
 * declarations, so `tsc --noEmit` (the CI + deploy gate) fails with TS2307
 * "Cannot find module 'node:sqlite'". This scoped shim unblocks that gate
 * without a major `@types/node` bump. It covers exactly the surface the tests
 * use; swap for the real @types/node@22 declarations when that bump happens.
 */
declare module "node:sqlite" {
  interface StatementSync {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  }
  export class DatabaseSync {
    constructor(path: string, options?: unknown);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
