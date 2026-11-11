require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const apiRoutes = require("./routes/api");
const { BlogPost } = require("./models");

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((item) => item.trim());

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
  },
}));
app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST", "PATCH", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => { req.body = req.body || {}; next(); });
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 150, standardHeaders: "draft-7", legacyHeaders: false }));
app.use("/api", apiRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));
app.get("/robots.txt", (req, res) => {
  const siteUrl = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : "";
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml` : ""}\n`);
});
app.get("/sitemap.xml", async (req, res, next) => {
  if (!process.env.SITE_URL) return res.status(503).type("text/plain").send("Configure SITE_URL to publish the XML sitemap.");
  try {
    const siteUrl = new URL(process.env.SITE_URL).origin;
    const pages = ["", "/about", "/services", "/training", "/careers", "/projects", "/resources", "/contact", "/privacy", "/terms"];
    const articles = await BlogPost.find({ published: true }).select("slug updatedAt").lean();
    const staticUrls = pages.map((page) => `<url><loc>${siteUrl}${page}</loc></url>`);
    const articleUrls = articles.map((article) => `<url><loc>${siteUrl}/resources/${encodeURIComponent(article.slug)}</loc><lastmod>${article.updatedAt.toISOString()}</lastmod></url>`);
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...staticUrls, ...articleUrls].join("")}</urlset>`);
  } catch (error) { next(error); }
});
app.use(express.static(path.resolve(__dirname, "..", "dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ message: "API endpoint not found." });
  res.sendFile(path.resolve(__dirname, "..", "dist", "index.html"), (error) => { if (error) next(error); });
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.name === "MulterError") return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Each document must be 5 MB or smaller." : "The uploaded documents could not be accepted." });
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "The request body contains invalid JSON." });
  if (error.type === "entity.too.large") return res.status(413).json({ message: "The request body is too large." });
  if (error.message?.startsWith("Upload PDF")) return res.status(400).json({ message: error.message });
  console.error("API error:", error);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`FEDUWO API listening on port ${port}`));
}

if (require.main === module) start().catch((error) => { console.error("Server startup failed:", error.message); process.exitCode = 1; });

module.exports = app;
