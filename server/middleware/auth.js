const jwt = require("jsonwebtoken");
const { User } = require("../models");

async function requireAdmin(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: "feduwo-agri", algorithms: ["HS256"] });
    const user = await User.findById(payload.sub).select("name email role active");
    if (!user || !user.active || !["admin", "consultant", "editor"].includes(user.role)) {
      return res.status(403).json({ message: "Administrator access is required." });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your session is invalid or has expired." });
    }
    next(error);
  }
}

module.exports = { requireAdmin };
