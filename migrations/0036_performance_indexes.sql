-- Analytics query: WHERE siteId = ? GROUP BY pageSlug
CREATE INDEX IF NOT EXISTS idx_page_view_site_slug ON page_view(siteId, pageSlug);

-- Collaborator lookup: WHERE siteId = ? AND email = ?
CREATE INDEX IF NOT EXISTS idx_site_invite_site_email ON site_invite(siteId, email);
