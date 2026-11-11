const { getSiteUrl } = require("../server/seo");

module.exports = function robots(req, res) {
  try {
    const siteUrl = getSiteUrl();
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml` : ""}\n`);
  } catch (error) {
    console.error("Robots file generation failed:", error.message);
    res.status(500).type("text/plain").send("Robots file generation failed.");
  }
};
