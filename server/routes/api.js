const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs/promises");
const rateLimit = require("express-rate-limit");
const {
  User, Consultation, ContactEnquiry, TrainingProgramme, TrainingRegistration,
  JobVacancy, JobApplication, BlogPost, Project, NewsletterSubscriber, ActivityLog,
} = require("../models");
const { requireAdmin } = require("../middleware/auth");
const { notify, confirm } = require("../services/email");

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const applicationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false });
const applicationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, callback) => {
    const allowed = new Set([".pdf", ".doc", ".docx"]);
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
    if (!allowed.has(extension) || !mimeTypes.has(file.mimetype)) return callback(new Error("Upload PDF, DOC or DOCX files only."));
    callback(null, true);
  },
});

function validDocumentSignature(file) {
  const header = file.buffer.subarray(0, 8);
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === ".pdf") return header.subarray(0, 5).toString() === "%PDF-";
  if (extension === ".doc") return header.equals(Buffer.from("D0CF11E0A1B11AE1", "hex"));
  return extension === ".docx" && header[0] === 0x50 && header[1] === 0x4b;
}

function publicError(res, error, next) {
  if (error.name === "ValidationError" || error.name === "StrictModeError" || error.name === "CastError") {
    return res.status(400).json({ message: "Please check the submitted information." });
  }
  if (error.code === 11000) return res.status(409).json({ message: "This record already exists." });
  return next(error);
}

function recordNotification(promise, label) {
  return promise.catch((error) => {
    console.error(`${label} notification failed:`, error.message);
    return false;
  });
}

router.post("/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password || email.length > 254 || password.length > 200) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h", issuer: "feduwo-agri" });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

router.post("/consultations", async (req, res, next) => {
  try {
    const record = await Consultation.create({
      name: req.body.name, email: req.body.email, phone: req.body.phone,
      organization: req.body.organization, service: req.body.service, location: req.body.location,
      challenge: req.body.message, consultationMethod: req.body.consultationMethod,
    });
    const notifications = await Promise.all([
      recordNotification(notify("New consultation request", `${record.name} (${record.email}) requested a consultation for ${record.service || "an agricultural enquiry"}.`), "Consultation"),
      recordNotification(confirm(record.email, "We received your consultation request", "Thank you for contacting FEDUWO AGRI CONSULTANT. Your consultation request has been received. Our team will be in touch."), "Consultation confirmation"),
    ]);
    res.status(201).json({ message: "Your consultation request has been received.", id: record.id, notificationSent: notifications.every(Boolean) });
  } catch (error) { publicError(res, error, next); }
});

router.post("/enquiries", async (req, res, next) => {
  try {
    const record = await ContactEnquiry.create({
      name: req.body.name, email: req.body.email, phone: req.body.phone,
      organization: req.body.organization, subject: req.body.subject || req.body.service,
      type: req.body.type, service: req.body.service, location: req.body.location,
      consultationMethod: req.body.consultationMethod, message: req.body.message,
    });
    const notifications = await Promise.all([
      recordNotification(notify("New website enquiry", `${record.name} (${record.email}) sent a ${record.type} enquiry: ${record.message}`), "Enquiry"),
      recordNotification(confirm(record.email, "We received your enquiry", "Thank you for contacting FEDUWO AGRI CONSULTANT. Your message has been received. Our team will be in touch."), "Enquiry confirmation"),
    ]);
    res.status(201).json({ message: "Your enquiry has been received.", id: record.id, notificationSent: notifications.every(Boolean) });
  } catch (error) { publicError(res, error, next); }
});

router.get("/training", async (req, res, next) => {
  try { res.json(await TrainingProgramme.find({ published: true }).sort({ createdAt: -1 }).lean()); }
  catch (error) { next(error); }
});

router.post("/training/register", async (req, res, next) => {
  try {
    const programme = await TrainingProgramme.findOne({ _id: req.body.programme, published: true });
    if (!programme) return res.status(404).json({ message: "Training programme not found." });
    const registration = await TrainingRegistration.create({
      programme: programme.id, name: req.body.name, email: req.body.email,
      phone: req.body.phone, location: req.body.location,
    });
    const notifications = await Promise.all([
      recordNotification(notify("New training registration", `${registration.name} registered interest in ${programme.title}.`), "Training"),
      recordNotification(confirm(registration.email, "We received your training registration", `Thank you for registering interest in ${programme.title}. Our team will share next steps with you.`), "Training confirmation"),
    ]);
    res.status(201).json({ message: "Your training registration has been received.", id: registration.id, notificationSent: notifications.every(Boolean) });
  } catch (error) { publicError(res, error, next); }
});

router.get("/jobs", async (req, res, next) => {
  try { res.json(await JobVacancy.find({ published: true, status: "Open", $or: [{ deadline: null }, { deadline: { $gte: new Date() } }] }).sort({ createdAt: -1 }).select("title category location deadline description qualifications experience").lean()); }
  catch (error) { next(error); }
});

router.post("/jobs/:id/applications", applicationLimiter, applicationUpload.fields([{ name: "resume", maxCount: 1 }, { name: "qualifications", maxCount: 1 }]), async (req, res, next) => {
  let savedPaths = [];
  try {
    const vacancy = await JobVacancy.findOne({ _id: req.params.id, published: true, status: "Open" });
    if (!vacancy || (vacancy.deadline && vacancy.deadline < new Date())) return res.status(404).json({ message: "This vacancy is not accepting applications." });
    const uploads = Object.values(req.files || {}).flat();
    if (!req.files?.resume?.length) return res.status(400).json({ message: "A CV or resume is required." });
    if (uploads.some((file) => !validDocumentSignature(file))) return res.status(400).json({ message: "A document's file type could not be verified." });
    const documents = uploads.map((file) => ({
      filename: `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      originalName: path.basename(file.originalname.replace(/\\/g, "/")),
      mimeType: file.mimetype,
      size: file.size,
    }));
    const uploadDirectory = path.resolve(__dirname, "..", "uploads");
    await fs.mkdir(uploadDirectory, { recursive: true });
    savedPaths = documents.map((document) => path.join(uploadDirectory, document.filename));
    await Promise.all(uploads.map((file, index) => fs.writeFile(savedPaths[index], file.buffer, { flag: "wx" })));
    const application = await JobApplication.create({ vacancy: vacancy.id, name: req.body.name, email: req.body.email, phone: req.body.phone, coverLetter: req.body.coverLetter, documents });
    const notifications = await Promise.all([
      recordNotification(notify("New job application", `${application.name} applied for ${vacancy.title}.`), "Application"),
      recordNotification(confirm(application.email, "We received your job application", `Thank you for applying for ${vacancy.title}. Your application has been received.`), "Application confirmation"),
    ]);
    res.status(201).json({ message: "Your application has been received.", id: application.id, notificationSent: notifications.every(Boolean) });
  } catch (error) {
    await Promise.all(savedPaths.map(async (filepath) => {
      try { await fs.unlink(filepath); }
      catch (cleanupError) { if (cleanupError.code !== "ENOENT") console.error("Could not remove an incomplete application upload:", cleanupError.message); }
    }));
    publicError(res, error, next);
  }
});

router.get("/articles", async (req, res, next) => {
  try {
    const filter = { published: true };
    if (req.query.q) filter.$text = { $search: String(req.query.q).slice(0, 100) };
    res.json(await BlogPost.find(filter).sort({ publishedAt: -1 }).select("title slug excerpt category author image publishedAt").limit(50).lean());
  } catch (error) { next(error); }
});

router.get("/articles/:slug", async (req, res, next) => {
  try {
    const article = await BlogPost.findOne({ slug: req.params.slug, published: true }).select("title slug excerpt body category author image publishedAt").lean();
    if (!article) return res.status(404).json({ message: "Article not found." });
    res.json(article);
  } catch (error) { next(error); }
});

router.get("/projects", async (req, res, next) => {
  try { res.json(await Project.find({ published: true, verified: true }).sort({ createdAt: -1 }).lean()); }
  catch (error) { next(error); }
});

router.post("/newsletter", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: "Enter a valid email address." });
    await NewsletterSubscriber.updateOne({ email }, { $set: { active: true } }, { upsert: true, runValidators: true });
    res.status(201).json({ message: "Subscription saved." });
  } catch (error) { publicError(res, error, next); }
});

const adminResources = {
  consultations: Consultation,
  enquiries: ContactEnquiry,
  training: TrainingProgramme,
  registrations: TrainingRegistration,
  jobs: JobVacancy,
  applications: JobApplication,
  articles: BlogPost,
  projects: Project,
  subscribers: NewsletterSubscriber,
  activities: ActivityLog,
};

router.use("/admin", requireAdmin);

router.get("/admin/dashboard", async (req, res, next) => {
  try {
    const [consultations, farmers, trainingRegistrations, jobApplications, articles, activeTraining, recentEnquiries, recentActivities] = await Promise.all([
      Consultation.countDocuments(), User.countDocuments({ active: true, role: "farmer" }),
      TrainingRegistration.countDocuments(), JobApplication.countDocuments(),
      BlogPost.countDocuments({ published: true }), TrainingProgramme.countDocuments({ published: true }),
      ContactEnquiry.find().sort({ createdAt: -1 }).limit(8).select("name email subject type status createdAt").lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).select("action resource createdAt").lean(),
    ]);
    res.json({ counts: { consultations, farmers, trainingRegistrations, jobApplications, publishedArticles: articles, activeTraining }, recentEnquiries, recentActivities });
  } catch (error) { next(error); }
});

router.get("/admin/users", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can manage user accounts." });
  try { res.json(await User.find().select("name email role active createdAt").sort({ createdAt: -1 }).lean()); }
  catch (error) { next(error); }
});

router.patch("/admin/users/:id", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can update user accounts." });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.id === req.user.id && (req.body.active === false || (req.body.role && req.body.role !== "admin"))) {
      return res.status(400).json({ message: "You cannot deactivate or demote your own administrator account." });
    }
    if (user.role === "admin" && user.active && (req.body.active === false || (req.body.role && req.body.role !== "admin"))) {
      const activeAdmins = await User.countDocuments({ role: "admin", active: true });
      if (activeAdmins <= 1) return res.status(409).json({ message: "The last active administrator cannot be deactivated or demoted." });
    }
    for (const field of ["name", "email", "role", "active"]) {
      if (Object.hasOwn(req.body, field)) user.set(field, req.body[field]);
    }
    await user.save();
    await ActivityLog.create({ actor: req.user.id, action: "Updated user account", resource: "users", resourceId: user.id });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active });
  } catch (error) { publicError(res, error, next); }
});

router.post("/admin/users", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can create user accounts." });
  try {
    const password = String(req.body.password || "");
    if (password.length < 12 || password.length > 200) return res.status(400).json({ message: "Password must be at least 12 characters." });
    const user = await User.create({ name: req.body.name, email: req.body.email, role: req.body.role, passwordHash: await bcrypt.hash(password, 12) });
    await ActivityLog.create({ actor: req.user.id, action: "Created user account", resource: "users", resourceId: user.id });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) { publicError(res, error, next); }
});

router.use("/admin/:resource", (req, res, next) => {
  const resource = req.params.resource;
  const permissions = {
    consultant: ["consultations", "enquiries", "training", "registrations", "jobs", "applications"],
    editor: ["articles", "projects"],
  };
  if (req.user.role === "admin") return next();
  if (resource === "projects" && req.method !== "GET") return res.status(403).json({ message: "Only administrators can change project records." });
  if (permissions[req.user.role]?.includes(resource)) return next();
  return res.status(403).json({ message: "Your role cannot access this module." });
});

router.get("/admin/:resource", async (req, res, next) => {
  const Model = adminResources[req.params.resource];
  if (!Model) return res.status(404).json({ message: "Admin resource not found." });
  try {
    const records = await Model.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json(records);
  } catch (error) { next(error); }
});

router.post("/admin/:resource", async (req, res, next) => {
  const Model = adminResources[req.params.resource];
  if (!Model || ["activities", "applications", "registrations", "subscribers"].includes(req.params.resource)) return res.status(404).json({ message: "Admin resource not found." });
  if (req.params.resource === "projects" && req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can publish projects." });
  try {
    const record = await Model.create(req.body);
    await ActivityLog.create({ actor: req.user.id, action: `Created ${req.params.resource}`, resource: req.params.resource, resourceId: record.id });
    res.status(201).json(record);
  } catch (error) { publicError(res, error, next); }
});

router.patch("/admin/:resource/:id", async (req, res, next) => {
  const Model = adminResources[req.params.resource];
  if (!Model || ["activities"].includes(req.params.resource)) return res.status(404).json({ message: "Admin resource not found." });
  try {
    const record = await Model.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found." });
    record.set(req.body);
    await record.save();
    await ActivityLog.create({ actor: req.user.id, action: `Updated ${req.params.resource}`, resource: req.params.resource, resourceId: record.id });
    res.json(record);
  } catch (error) { publicError(res, error, next); }
});

router.get("/admin/applications/:id/documents/:filename", async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id).select("documents").lean();
    if (!application) return res.status(404).json({ message: "Application not found." });
    const document = application.documents.find((item) => item.filename === req.params.filename);
    if (!document) return res.status(404).json({ message: "Document not found." });
    const filepath = path.resolve(__dirname, "..", "uploads", document.filename);
    res.download(filepath, document.originalName, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) { next(error); }
});

router.delete("/admin/:resource/:id", async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Only administrators can delete records." });
  const Model = adminResources[req.params.resource];
  if (!Model || ["activities", "applications", "registrations"].includes(req.params.resource)) return res.status(404).json({ message: "Admin resource not found." });
  try {
    const result = await Model.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Record not found." });
    await ActivityLog.create({ actor: req.user.id, action: `Deleted ${req.params.resource}`, resource: req.params.resource, resourceId: result.id });
    res.status(204).end();
  } catch (error) { publicError(res, error, next); }
});

module.exports = router;
