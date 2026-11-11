const { getSiteUrl } = require("../server/seo");

module.exports = function robots(req, res) {
  try {
    const siteUrl = getSiteUrl();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(`User-agent: *\nAllow: /\nDisallow: /admin${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml` : ""}\n`);
  } catch (error) {
    console.error("Robots file generation failed:", error.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Robots file generation failed.");
  }
};
