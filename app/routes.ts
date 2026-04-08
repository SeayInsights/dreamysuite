import {
  type RouteConfig,
  route,
  index,
  layout,
} from "@react-router/dev/routes";

export default [
  // Better Auth API handler
  route("api/auth/*", "routes/api.auth.$.ts"),

  // Auth pages (unauthenticated)
  layout("routes/_auth.tsx", [
    route("login", "routes/_auth.login.tsx"),
    route("signup", "routes/_auth.signup.tsx"),
  ]),

  // Protected dashboard
  layout("routes/_dashboard.tsx", [
    index("routes/_dashboard._index.tsx"),
  ]),
] satisfies RouteConfig;
