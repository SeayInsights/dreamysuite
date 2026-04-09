import {
  type RouteConfig,
  route,
  index,
  layout,
} from "@react-router/dev/routes";

export default [
  // Better Auth API handler
  route("api/auth/*", "routes/api.auth.$.ts"),

  // Public site data (no auth)
  route("api/public/:siteSlug", "routes/api.public.$siteSlug.ts"),

  // Site pages API
  route("api/sites/:id/pages", "routes/api.sites.$id.pages.ts"),
  route("api/sites/:id/pages/:pageId", "routes/api.sites.$id.pages.$pageId.ts"),

  // Site blocks API
  route("api/sites/:id/blocks", "routes/api.sites.$id.blocks.ts"),
  route("api/sites/:id/blocks/:blockId", "routes/api.sites.$id.blocks.$blockId.ts"),

  // Site photos API
  route("api/sites/:id/photos", "routes/api.sites.$id.photos.ts"),
  route("api/sites/:id/photos/:photoId", "routes/api.sites.$id.photos.$photoId.ts"),

  // Site guests API
  route("api/sites/:id/guests", "routes/api.sites.$id.guests.ts"),
  route("api/sites/:id/guests/:guestId", "routes/api.sites.$id.guests.$guestId.ts"),

  // Site settings API
  route("api/sites/:id/settings", "routes/api.sites.$id.settings.ts"),

  // Site templates API
  route("api/sites/:id/templates", "routes/api.sites.$id.templates.ts"),
  route("api/sites/:id/templates/:templateId", "routes/api.sites.$id.templates.$templateId.ts"),

  // Site content API (i18n editor)
  route("api/sites/:id/content", "routes/api.sites.$id.content.ts"),

  // Site analytics API
  route("api/sites/:id/analytics", "routes/api.sites.$id.analytics.ts"),

  // Auth pages (unauthenticated)
  layout("routes/_auth.tsx", [
    route("login", "routes/_auth.login.tsx"),
    route("signup", "routes/_auth.signup.tsx"),
  ]),

  // Protected dashboard — includes site editor as nested route
  layout("routes/_dashboard.tsx", [
    index("routes/_dashboard._index.tsx"),
    route("sites/new", "routes/_dashboard.sites.new.tsx"),
    route("sites/:id", "routes/_dashboard.sites.$id.tsx"),
  ]),

  // Domain availability check + purchase
  route("api/domain/check", "routes/api.domain.check.ts"),
  route("api/domain/purchase", "routes/api.domain.purchase.ts"),

  // Public site renderer — catch-all slug, must be last
  route(":slug", "routes/$slug.tsx"),
] satisfies RouteConfig;
