const { getSupabase, fromDatabase, unwrap } = require("../server/db");
const { escapeXml, getSiteUrl } = require("../server/seo");

module.exports = async function sitemap(req, res) {
  try {
    const siteUrl = getSiteUrl();
    if (!siteUrl) return res.status(503).type("text/plain").send("Configure SITE_URL to publish the XML sitemap.");
    const pages = ["", "/about", "/services", "/training", "/careers", "/projects", "/resources", "/contact", "/privacy", "/terms"];
    const articles = fromDatabase(unwrap(await getSupabase().from("blog_posts")
      .select("slug,updated_at").eq("published", true)));
    const staticUrls = pages.map((page) => `<url><loc>${escapeXml(`${siteUrl}${page}`)}</loc></url>`);
    const articleUrls = articles.map((article) => `<url><loc>${escapeXml(`${siteUrl}/resources/${encodeURIComponent(article.slug)}`)}</loc><lastmod>${new Date(article.updatedAt).toISOString()}</lastmod></url>`);
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...staticUrls, ...articleUrls].join("")}</urlset>`);
  } catch (error) {
    console.error("Sitemap generation failed:", error.message);
    res.status(500).type("text/plain").send("Sitemap generation failed.");
  }
};
