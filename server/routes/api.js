const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { getSupabase, fromDatabase, toDatabase, unwrap } = require("../db");
const { notify, confirm } = require("../services/email");

const router = express.Router();
const applicationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, callback) => {
    const extensions = new Set([".pdf", ".doc", ".docx"]);
    const mimeTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    if (!extensions.has(path.extname(file.originalname).toLowerCase()) || !mimeTypes.has(file.mimetype)) {
      return callback(new Error("Upload PDF, DOC or DOCX files only."));
    }
    callback(null, true);
  },
});

const resources = {
  consultations: { table: "consultations", fields: ["name", "email", "phone", "organization", "service", "location", "challenge", "consultationMethod", "status", "assignedTo", "internalNotes"] },
  enquiries: { table: "contact_enquiries", fields: ["name", "email", "phone", "organization", "subject", "type", "service", "location", "consultationMethod", "message", "status"] },
  training: { table: "training_programmes", fields: ["title", "description", "objectives", "targetParticipants", "category", "schedule", "location", "resources", "published"] },
  registrations: { table: "training_registrations", fields: ["programmeId", "name", "email", "phone", "location", "status"] },
  jobs: { table: "job_vacancies", fields: ["title", "description", "category", "qualifications", "experience", "location", "deadline", "published", "status"] },
  applications: { table: "job_applications", fields: ["vacancyId", "name", "email", "phone", "coverLetter", "documents", "status"] },
  articles: { table: "blog_posts", fields: ["title", "slug", "excerpt", "body", "category", "author", "image", "published", "publishedAt"] },
  projects: { table: "projects", fields: ["title", "description", "location", "category", "objectives", "outcomes", "images", "verified", "published"] },
  subscribers: { table: "newsletter_subscribers", fields: ["email", "active"] },
  activities: { table: "activity_logs", fields: ["actor", "action", "resource", "resourceId", "metadata"] },
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roles = new Set(["admin", "consultant", "editor", "farmer"]);

function pick(input, allowed) {
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(input, key)).map((key) => {
    const value = input[key];
    if (typeof value !== "string") return [key, value];
    return [key, key === "email" ? value.trim().toLowerCase() : value.trim()];
  }));
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validDocumentSignature(file) {
  const header = file.buffer.subarray(0, 8);
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === ".pdf") return header.subarray(0, 5).toString() === "%PDF-";
  if (extension === ".doc") return header.equals(Buffer.from("D0CF11E0A1B11AE1", "hex"));
  return extension === ".docx" && header[0] === 0x50 && header[1] === 0x4b;
}

function publicError(res, error, next) {
  if (error.code === "23505" || error.code === "11000") return res.status(409).json({ message: "This record already exists." });
  if (["23502", "23503", "23514", "22P02", "22001"].includes(error.code)) {
    return res.status(400).json({ message: "Please check the submitted information." });
  }
  return next(error);
}

function recordNotification(promise, label) {
  return promise.catch((error) => {
    console.error(`${label} notification failed:`, error.message);
    return false;
  });
}

function persistentRateLimit(scope, maxRequests) {
  return async (req, res, next) => {
    try {
      const address = req.ip || req.socket.remoteAddress || "unknown";
      const addressHash = crypto.createHash("sha256").update(address).digest("hex");
      const allowed = unwrap(await getSupabase().rpc("consume_api_rate_limit", {
        p_bucket: `${scope}:${addressHash}`,
        p_window_seconds: 900,
        p_max_requests: maxRequests,
      }));
      if (!allowed) return res.status(429).json({ message: "Too many requests. Please try again later." });
      next();
    } catch (error) { next(error); }
  };
}

async function one(table, id, fields = "*") {
  return fromDatabase(unwrap(await getSupabase().from(table).select(fields).eq("id", id).maybeSingle()));
}

async function insert(table, record, fields = "*") {
  return fromDatabase(unwrap(await getSupabase().from(table).insert(toDatabase(record)).select(fields).single()));
}

async function activity(actor, action, resource, resourceId) {
  try {
    await insert("activity_logs", { actor, action, resource, resourceId });
  } catch (error) {
    console.error("Could not record admin activity:", error.message);
  }
}

async function requireAdmin(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: "feduwo-agri", algorithms: ["HS256"] });
    const user = fromDatabase(unwrap(await getSupabase()
      .from("staff_users")
      .select("id,name,email,role,active")
      .eq("id", payload.sub)
      .maybeSingle()));
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

router.post("/auth/login", persistentRateLimit("login", 10), async (req, res, next) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!email || !password || email.length > 254 || password.length > 200) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const user = fromDatabase(unwrap(await getSupabase()
      .from("staff_users")
      .select("id,name,email,role,active,password_hash")
      .eq("email", email)
      .maybeSingle()));
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      issuer: "feduwo-agri",
    });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

router.post("/consultations", async (req, res, next) => {
  try {
    const data = {
      ...pick(req.body, ["name", "email", "phone", "organization", "service", "location", "consultationMethod"]),
      email: cleanEmail(req.body.email),
      challenge: req.body.message,
    };
    if (!data.name || !emailPattern.test(data.email) || !data.challenge || !data.consultationMethod) {
      return res.status(400).json({ message: "Please complete the required consultation details." });
    }
    const record = await insert("consultations", data);
    const notifications = await Promise.all([
      recordNotification(notify("New consultation request", `${record.name} (${record.email}) requested a consultation for ${record.service || "an agricultural enquiry"}.`), "Consultation"),
      recordNotification(confirm(record.email, "We received your consultation request", "Thank you for contacting FEDUWO AGRI CONSULTANT. Your consultation request has been received. Our team will be in touch."), "Consultation confirmation"),
    ]);
    res.status(201).json({ message: "Your consultation request has been received.", id: record.id, notificationSent: notifications.every(Boolean) });
  } catch (error) { publicError(res, error, next); }
});

router.post("/enquiries", async (req, res, next) => {
  try {
    const data = {
      ...pick(req.body, ["name", "phone", "organization", "subject", "type", "service", "location", "consultationMethod", "message"]),
      email: cleanEmail(req.body.email),
    };
    if (!data.name || !emailPattern.test(data.email) || !data.message) {
      return res.status(400).json({ message: "Please provide your name, a valid email address, and a message." });
    }
    const record = await insert("contact_enquiries", data);
    const notifications = await Promise.all([
      recordNotification(notify("New website enquiry", `${record.name} (${record.email}) sent a ${record.type} enquiry: ${record.message}`), "Enquiry"),
      recordNotification(confirm(record.email, "We received your enquiry", "Thank you for contacting FEDUWO AGRI CONSULTANT. Your message has been received. Our team will be in touch."), "Enquiry confirmation"),
    ]);
    res.status(201).json({ message: "Your enquiry has been received.", id: record.id, notificationSent: notifications.every(Boolean) });
  } catch (error) { publicError(res, error, next); }
});

router.get("/training", async (req, res, next) => {
  try {
    res.json(fromDatabase(unwrap(await getSupabase()
      .from("training_programmes").select("*").eq("published", true).order("created_at", { ascending: false }))));
  } catch (error) { next(error); }
});

router.post("/training/register", async (req, res, next) => {
  try {
    const programme = await one("training_programmes", req.body.programme, "id,title,published");
    if (!programme || !programme.published) return res.status(404).json({ message: "Training programme not found." });
    const data = {
      programmeId: programme.id,
      name: req.body.name,
      email: cleanEmail(req.body.email),
      phone: req.body.phone,
      location: req.body.location,
    };
    if (!data.name || !emailPattern.test(data.email) || !data.phone) {
      return res.status(400).json({ message: "Please complete the required registration details." });
    }
    const registration = await insert("training_registrations", data);
    const notifications = await Promise.all([
      recordNotification(notify("New training registration", `${registration.name} registered interest in ${programme.title}.`), "Training"),
      recordNotification(confirm(registration.email, "We received your training registration", `Thank you for registering interest in ${programme.title}. Our team will share next steps with you.`), "Training confirmation"),
    ]);
    res.status(201).json({ message: "Your training registration has been received.", id: registration.id, notificationSent: notifications.every(Boolean) });
  } catch (error) { publicError(res, error, next); }
});

router.get("/jobs", async (req, res, next) => {
  try {
    res.json(fromDatabase(unwrap(await getSupabase().from("job_vacancies")
      .select("id,title,category,location,deadline,description,qualifications,experience,created_at")
      .eq("published", true).eq("status", "Open")
      .or(`deadline.is.null,deadline.gte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false }))));
  } catch (error) { next(error); }
});

router.post("/jobs/:id/applications", persistentRateLimit("application", 8),
  applicationUpload.fields([{ name: "resume", maxCount: 1 }, { name: "qualifications", maxCount: 1 }]),
  async (req, res, next) => {
    const savedPaths = [];
    try {
      const vacancy = await one("job_vacancies", req.params.id, "id,title,published,status,deadline");
      if (!vacancy || !vacancy.published || vacancy.status !== "Open" || (vacancy.deadline && new Date(vacancy.deadline) < new Date())) {
        return res.status(404).json({ message: "This vacancy is not accepting applications." });
      }
      const uploads = Object.values(req.files || {}).flat();
      if (!req.files?.resume?.length) return res.status(400).json({ message: "A CV or resume is required." });
      if (uploads.reduce((sum, file) => sum + file.size, 0) > 4 * 1024 * 1024) {
        return res.status(413).json({ message: "Combined documents must be 4 MB or smaller." });
      }
      if (uploads.some((file) => !validDocumentSignature(file))) {
        return res.status(400).json({ message: "A document's file type could not be verified." });
      }
      const storage = getSupabase().storage.from("applications");
      const documents = [];
      for (const file of uploads) {
        const filename = `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
        const { error } = await storage.upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });
        if (error) throw error;
        savedPaths.push(filename);
        documents.push({
          filename,
          originalName: path.basename(file.originalname.replace(/\\/g, "/")),
          mimeType: file.mimetype,
          size: file.size,
        });
      }
      const application = await insert("job_applications", {
        vacancyId: vacancy.id,
        name: req.body.name,
        email: cleanEmail(req.body.email),
        phone: req.body.phone,
        coverLetter: req.body.coverLetter,
        documents,
      });
      const notifications = await Promise.all([
        recordNotification(notify("New job application", `${application.name} applied for ${vacancy.title}.`), "Application"),
        recordNotification(confirm(application.email, "We received your job application", `Thank you for applying for ${vacancy.title}. Your application has been received.`), "Application confirmation"),
      ]);
      res.status(201).json({ message: "Your application has been received.", id: application.id, notificationSent: notifications.every(Boolean) });
    } catch (error) {
      if (savedPaths.length) {
        const { error: cleanupError } = await getSupabase().storage.from("applications").remove(savedPaths);
        if (cleanupError) console.error("Could not remove incomplete application uploads:", cleanupError.message);
      }
      publicError(res, error, next);
    }
  });

router.get("/articles", async (req, res, next) => {
  try {
    let query = getSupabase().from("blog_posts")
      .select("id,title,slug,excerpt,category,author,image,published_at")
      .eq("published", true).order("published_at", { ascending: false }).limit(50);
    if (req.query.q) query = query.ilike("title", `%${String(req.query.q).slice(0, 100)}%`);
    res.json(fromDatabase(unwrap(await query)));
  } catch (error) { next(error); }
});

router.get("/articles/:slug", async (req, res, next) => {
  try {
    const article = fromDatabase(unwrap(await getSupabase().from("blog_posts")
      .select("id,title,slug,excerpt,body,category,author,image,published_at")
      .eq("slug", req.params.slug).eq("published", true).maybeSingle()));
    if (!article) return res.status(404).json({ message: "Article not found." });
    res.json(article);
  } catch (error) { next(error); }
});

router.get("/projects", async (req, res, next) => {
  try {
    res.json(fromDatabase(unwrap(await getSupabase().from("projects")
      .select("*").eq("published", true).eq("verified", true).order("created_at", { ascending: false }))));
  } catch (error) { next(error); }
});

router.post("/newsletter", async (req, res, next) => {
  try {
    const email = cleanEmail(req.body.email);
    if (!emailPattern.test(email) || email.length > 254) return res.status(400).json({ message: "Enter a valid email address." });
    unwrap(await getSupabase().from("newsletter_subscribers")
      .upsert({ email, active: true }, { onConflict: "email" }));
    res.status(201).json({ message: "Subscription saved." });
  } catch (error) { publicError(res, error, next); }
});

router.use("/admin", requireAdmin);

router.get("/admin/dashboard", async (req, res, next) => {
  try {
    const db = getSupabase();
    const counts = await Promise.all([
      db.from("consultations").select("id", { count: "exact", head: true }),
      db.from("staff_users").select("id", { count: "exact", head: true }).eq("active", true).eq("role", "farmer"),
      db.from("training_registrations").select("id", { count: "exact", head: true }),
      db.from("job_applications").select("id", { count: "exact", head: true }),
      db.from("blog_posts").select("id", { count: "exact", head: true }).eq("published", true),
      db.from("training_programmes").select("id", { count: "exact", head: true }).eq("published", true),
      db.from("contact_enquiries").select("id,name,email,subject,type,status,created_at").order("created_at", { ascending: false }).limit(8),
      db.from("activity_logs").select("id,action,resource,created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    for (const result of counts) if (result.error) throw result.error;
    const [consultations, farmers, registrations, applications, articles, training] = counts.slice(0, 6).map((result) => result.count || 0);
    res.json({
      counts: { consultations, farmers, trainingRegistrations: registrations, jobApplications: applications, publishedArticles: articles, activeTraining: training },
      recentEnquiries: fromDatabase(counts[6].data),
      recentActivities: fromDatabase(counts[7].data),
    });
  } catch (error) { next(error); }
});

router.get("/admin/users", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can manage user accounts." });
  try {
    res.json(fromDatabase(unwrap(await getSupabase().from("staff_users")
      .select("id,name,email,role,active,created_at").order("created_at", { ascending: false }))));
  } catch (error) { next(error); }
});

router.patch("/admin/users/:id", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can update user accounts." });
  try {
    const user = await one("staff_users", req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (req.body.role && !roles.has(req.body.role)) return res.status(400).json({ message: "Select a valid user role." });
    if (Object.hasOwn(req.body, "email") && !emailPattern.test(cleanEmail(req.body.email))) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (user.id === req.user.id && (req.body.active === false || (req.body.role && req.body.role !== "admin"))) {
      return res.status(400).json({ message: "You cannot deactivate or demote your own administrator account." });
    }
    if (user.role === "admin" && user.active && (req.body.active === false || (req.body.role && req.body.role !== "admin"))) {
      const { count, error: countError } = await getSupabase().from("staff_users")
        .select("id", { count: "exact", head: true }).eq("role", "admin").eq("active", true);
      if (countError) throw countError;
      if ((count || 0) <= 1) return res.status(409).json({ message: "The last active administrator cannot be deactivated or demoted." });
    }
    const update = { ...pick(req.body, ["name", "email", "role", "active"]), updatedAt: new Date().toISOString() };
    const updated = fromDatabase(unwrap(await getSupabase().from("staff_users").update(toDatabase(update)).eq("id", user.id)
      .select("id,name,email,role,active").single()));
    await activity(req.user.id, "Updated user account", "users", user.id);
    res.json(updated);
  } catch (error) { publicError(res, error, next); }
});

router.post("/admin/users", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can create user accounts." });
  try {
    const password = String(req.body.password || "");
    if (password.length < 12 || password.length > 200) return res.status(400).json({ message: "Password must be at least 12 characters." });
    if (!roles.has(req.body.role)) return res.status(400).json({ message: "Select a valid user role." });
    if (!emailPattern.test(cleanEmail(req.body.email))) return res.status(400).json({ message: "Enter a valid email address." });
    const user = await insert("staff_users", {
      name: req.body.name,
      email: cleanEmail(req.body.email),
      role: req.body.role,
      passwordHash: await bcrypt.hash(password, 12),
    }, "id,name,email,role");
    await activity(req.user.id, "Created user account", "users", user.id);
    res.status(201).json(user);
  } catch (error) { publicError(res, error, next); }
});

router.use("/admin/:resource", (req, res, next) => {
  const permissions = {
    consultant: ["consultations", "enquiries", "training", "registrations", "jobs", "applications"],
    editor: ["articles", "projects"],
  };
  if (!resources[req.params.resource]) return res.status(404).json({ message: "Admin resource not found." });
  if (req.user.role === "admin") return next();
  if (req.params.resource === "projects" && req.method !== "GET") return res.status(403).json({ message: "Only administrators can change project records." });
  if (permissions[req.user.role]?.includes(req.params.resource)) return next();
  return res.status(403).json({ message: "Your role cannot access this module." });
});

router.get("/admin/:resource", async (req, res, next) => {
  const resource = resources[req.params.resource];
  try {
    res.json(fromDatabase(unwrap(await getSupabase().from(resource.table)
      .select("*").order("created_at", { ascending: false }).limit(100))));
  } catch (error) { next(error); }
});

router.post("/admin/:resource", async (req, res, next) => {
  const resource = resources[req.params.resource];
  if (["activities", "applications", "registrations", "subscribers"].includes(req.params.resource)) {
    return res.status(404).json({ message: "Admin resource not found." });
  }
  if (req.params.resource === "projects" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Only administrators can publish projects." });
  }
  try {
    const record = await insert(resource.table, pick(req.body, resource.fields));
    await activity(req.user.id, `Created ${req.params.resource}`, req.params.resource, record.id);
    res.status(201).json(record);
  } catch (error) { publicError(res, error, next); }
});

router.patch("/admin/:resource/:id", async (req, res, next) => {
  const resource = resources[req.params.resource];
  if (req.params.resource === "activities") return res.status(404).json({ message: "Admin resource not found." });
  try {
    const update = pick(req.body, resource.fields);
    if (!Object.keys(update).length) return res.status(400).json({ message: "No editable fields were provided." });
    update.updatedAt = new Date().toISOString();
    const record = fromDatabase(unwrap(await getSupabase().from(resource.table)
      .update(toDatabase(update)).eq("id", req.params.id).select("*").maybeSingle()));
    if (!record) return res.status(404).json({ message: "Record not found." });
    await activity(req.user.id, `Updated ${req.params.resource}`, req.params.resource, record.id);
    res.json(record);
  } catch (error) { publicError(res, error, next); }
});

router.get("/admin/applications/:id/documents/:filename", async (req, res, next) => {
  try {
    const application = await one("job_applications", req.params.id, "id,documents");
    if (!application) return res.status(404).json({ message: "Application not found." });
    const document = application.documents?.find((item) => item.filename === req.params.filename);
    if (!document) return res.status(404).json({ message: "Document not found." });
    const { data, error } = await getSupabase().storage.from("applications").download(document.filename);
    if (error) throw error;
    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(document.originalName)}"`);
    res.send(buffer);
  } catch (error) { next(error); }
});

router.delete("/admin/:resource/:id", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can delete records." });
  const resource = resources[req.params.resource];
  if (!resource || ["activities", "applications", "registrations"].includes(req.params.resource)) {
    return res.status(404).json({ message: "Admin resource not found." });
  }
  try {
    const record = fromDatabase(unwrap(await getSupabase().from(resource.table)
      .delete().eq("id", req.params.id).select("id").maybeSingle()));
    if (!record) return res.status(404).json({ message: "Record not found." });
    await activity(req.user.id, `Deleted ${req.params.resource}`, req.params.resource, record.id);
    res.status(204).end();
  } catch (error) { publicError(res, error, next); }
});

module.exports = router;
