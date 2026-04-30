/**
 * Database Queries — Barrel Export
 *
 * Re-exports all domain-specific query modules so existing imports continue to work:
 *   import { getBlockById, createBlock } from '@/lib/db/queries'
 *
 * ## Domain modules
 * - blocks.ts   — block CRUD
 * - pages.ts    — page CRUD
 * - sites.ts    — site CRUD
 * - guests.ts   — contact/guest CRUD
 * - media.ts    — media item CRUD
 */

export * from './blocks';
export * from './pages';
export * from './sites';
export * from './guests';
export * from './media';
