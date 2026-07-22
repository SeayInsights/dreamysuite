-- Retire unused multi-type scaffolding: site_type_config + template.
--
-- 0040_multi_type_foundation created site_type_config (a site-type registry) and
-- template (per-type starter templates) as the basis for multi-site-type support.
-- The application never adopted them:
--   * multi-type support is implemented via site_setting / site_type_settings,
--     which is keyed by site (site_type_settings FKs site(id), NOT site_type_config);
--   * the templates feature uses the older site_template table
--     (src/app/api/sites/[id]/templates/*), not this `template` table;
--   * no application code queries site_type_config or template (only a DB test
--     references them), and nothing that IS used FKs either table.
-- In production `template` has 0 rows and `site_type_config` holds a single dormant
-- seed row. Drop both (child first: template FKs site_type_config).
--
-- Forward-only + recoverable: if per-type templates are built later, reintroduce
-- these tables in a new migration.
DROP TABLE IF EXISTS template;
DROP TABLE IF EXISTS site_type_config;
