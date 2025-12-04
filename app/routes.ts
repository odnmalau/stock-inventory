import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.ts"),
  route("profile", "routes/profile.tsx"),
  route("products", "routes/products.tsx"),
  route("products/export", "routes/products.export.ts"),
  route("inbound", "routes/inbound.tsx"),
  route("outbound", "routes/outbound.tsx"),
  route("opname", "routes/opname.tsx"),
  route("reports", "routes/reports.tsx"),
  route("stock-card", "routes/stock-card.tsx"),
] satisfies RouteConfig;
