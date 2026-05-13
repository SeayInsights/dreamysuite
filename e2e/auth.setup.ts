/**
 * DreamySuite auth state path.
 *
 * This file intentionally stays repo-local. The previous version imported a
 * missing sibling testing fixture, which prevented Playwright from loading or
 * listing tests. Test execution can create this storage state via a future
 * dedicated setup project; listing tests should not depend on that fixture.
 */

export const STORAGE_STATE = './e2e/.auth/user.json';
