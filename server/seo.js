function getSiteUrl() {
  const configured = process.env.SITE_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || process.env.VERCEL_URL;
  if (!configured) return "";
  const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return new URL(withProtocol).origin;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character]);
}

module.exports = { escapeXml, getSiteUrl };
