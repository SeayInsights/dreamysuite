/**
 * Path to the saved Playwright storage state (authenticated session cookies).
 * Kept in its own module so the config and specs can import it without loading
 * auth.setup.ts (which registers a setup test and must not run in config scope).
 */
export const STORAGE_STATE = "./e2e/.auth/user.json";
