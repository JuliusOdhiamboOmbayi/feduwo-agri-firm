const mongoose = require("mongoose");

const { Schema } = mongoose;
const options = { timestamps: true, strict: "throw" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, match: emailPattern },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "consultant", "editor", "farmer"], default: "admin" },
  active: { type: Boolean, default: true },
}, options);

const consultationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, match: emailPattern },
  phone: { type: String, trim: true, maxlength: 30 },
  organization: { type: String, trim: true, maxlength: 150 },
  service: { type: String, trim: true, maxlength: 150 },
  location: { type: String, trim: true, maxlength: 200 },
  challenge: { type: String, required: true, trim: true, maxlength: 5000 },
  consultationMethod: { type: String, enum: ["Physical farm visit", "Online consultation", "Telephone consultation", "Office appointment"], required: true },
  status: { type: String, enum: ["Pending", "Under Review", "Approved", "In Progress", "Completed", "Rejected"], default: "Pending" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  internalNotes: { type: String, maxlength: 5000 },
}, options);
consultationSchema.index({ status: 1, createdAt: -1 });

const enquirySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, match: emailPattern },
  phone: { type: String, trim: true, maxlength: 30 },
  organization: { type: String, trim: true, maxlength: 150 },
  subject: { type: String, trim: true, maxlength: 180 },
  type: { type: String, trim: true, maxlength: 40, default: "enquiry" },
  service: { type: String, trim: true, maxlength: 150 },
  location: { type: String, trim: true, maxlength: 200 },
  consultationMethod: { type: String, trim: true, maxlength: 50 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["New", "In Progress", "Resolved"], default: "New" },
}, options);
enquirySchema.index({ createdAt: -1 });

const trainingProgrammeSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  objectives: [{ type: String, trim: true, maxlength: 300 }],
  targetParticipants: { type: String, trim: true, maxlength: 500 },
  category: { type: String, trim: true, maxlength: 100 },
  schedule: { type: String, trim: true, maxlength: 200 },
  location: { type: String, trim: true, maxlength: 200 },
  resources: [{ title: { type: String, required: true, trim: true, maxlength: 120 }, url: { type: String, required: true, match: /^https?:\/\/\S+$/i, maxlength: 1000 } }],
  published: { type: Boolean, default: false },
}, options);
trainingProgrammeSchema.index({ published: 1, createdAt: -1 });

const trainingRegistrationSchema = new Schema({
  programme: { type: Schema.Types.ObjectId, ref: "TrainingProgramme", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, match: emailPattern },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  location: { type: String, trim: true, maxlength: 200 },
  status: { type: String, enum: ["Received", "Contacted", "Confirmed", "Declined"], default: "Received" },
}, options);
trainingRegistrationSchema.index({ programme: 1, email: 1 }, { unique: true });

const jobVacancySchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, trim: true, maxlength: 8000 },
  category: { type: String, trim: true, maxlength: 100 },
  qualifications: { type: String, trim: true, maxlength: 3000 },
  experience: { type: String, trim: true, maxlength: 500 },
  location: { type: String, trim: true, maxlength: 200 },
  deadline: { type: Date },
  published: { type: Boolean, default: false },
  status: { type: String, enum: ["Open", "Closed"], default: "Open" },
}, options);
jobVacancySchema.index({ published: 1, status: 1, deadline: 1 });

const jobApplicationSchema = new Schema({
  vacancy: { type: Schema.Types.ObjectId, ref: "JobVacancy", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, match: emailPattern },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  coverLetter: { type: String, trim: true, maxlength: 5000 },
  documents: [{ filename: { type: String, required: true }, originalName: { type: String, required: true, maxlength: 255 }, mimeType: { type: String, required: true }, size: { type: Number, required: true } }],
  status: { type: String, enum: ["Received", "Under Review", "Shortlisted", "Rejected", "Hired"], default: "Received" },
}, options);
jobApplicationSchema.index({ vacancy: 1, createdAt: -1 });

const blogPostSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 220 },
  excerpt: { type: String, trim: true, maxlength: 500 },
  body: { type: String, required: true, maxlength: 30000 },
  category: { type: String, trim: true, maxlength: 100 },
  author: { type: String, trim: true, maxlength: 120 },
  image: { type: String, trim: true, maxlength: 1000 },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, options);
blogPostSchema.index({ published: 1, publishedAt: -1 });
blogPostSchema.index({ title: "text", excerpt: "text", body: "text", category: "text" });

const projectSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  location: { type: String, trim: true, maxlength: 200 },
  category: { type: String, trim: true, maxlength: 100 },
  objectives: [{ type: String, trim: true, maxlength: 300 }],
  outcomes: { type: String, trim: true, maxlength: 3000 },
  images: [{ type: String, maxlength: 1000 }],
  verified: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
}, options);
projectSchema.index({ published: 1, verified: 1, createdAt: -1 });

const newsletterSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, match: emailPattern },
  active: { type: Boolean, default: true },
}, options);

const activityLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true, maxlength: 160 },
  resource: { type: String, maxlength: 100 },
  resourceId: { type: Schema.Types.ObjectId },
  metadata: { type: Schema.Types.Mixed },
}, options);
activityLogSchema.index({ createdAt: -1 });

module.exports = {
  User: mongoose.model("User", userSchema),
  Consultation: mongoose.model("Consultation", consultationSchema),
  ContactEnquiry: mongoose.model("ContactEnquiry", enquirySchema),
  TrainingProgramme: mongoose.model("TrainingProgramme", trainingProgrammeSchema),
  TrainingRegistration: mongoose.model("TrainingRegistration", trainingRegistrationSchema),
  JobVacancy: mongoose.model("JobVacancy", jobVacancySchema),
  JobApplication: mongoose.model("JobApplication", jobApplicationSchema),
  BlogPost: mongoose.model("BlogPost", blogPostSchema),
  Project: mongoose.model("Project", projectSchema),
  NewsletterSubscriber: mongoose.model("NewsletterSubscriber", newsletterSchema),
  ActivityLog: mongoose.model("ActivityLog", activityLogSchema),
};
