const test = require("node:test");
const assert = require("node:assert/strict");
const { Consultation, TrainingProgramme, JobApplication } = require("./index");

test("consultation requires a valid method and challenge", () => {
  const missing = new Consultation({ name: "Test Farmer", email: "farmer@example.com" }).validateSync();
  assert.ok(missing.errors.challenge);
  assert.ok(missing.errors.consultationMethod);

  const valid = new Consultation({
    name: "Test Farmer",
    email: "farmer@example.com",
    challenge: "Improve water planning",
    consultationMethod: "Online consultation",
  }).validateSync();
  assert.equal(valid, undefined);
});

test("consultation rejects unsupported statuses", () => {
  const error = new Consultation({
    name: "Test Farmer",
    email: "farmer@example.com",
    challenge: "Improve water planning",
    consultationMethod: "Online consultation",
    status: "Unverified",
  }).validateSync();
  assert.ok(error.errors.status);
});

test("user accounts reject malformed email addresses", () => {
  const error = new (require("./index").User)({
    name: "Site Admin",
    email: "not-an-email",
    passwordHash: "hashed-password",
  }).validateSync();
  assert.ok(error.errors.email);
});

test("training programmes remain unpublished by default", () => {
  const programme = new TrainingProgramme({ title: "Soil health", description: "Practical soil management." });
  assert.equal(programme.published, false);
  assert.equal(programme.validateSync(), undefined);
});

test("job applications require a vacancy reference and applicant documents remain schema-bound", () => {
  const error = new JobApplication({ name: "Applicant", email: "applicant@example.com", phone: "0114110603" }).validateSync();
  assert.ok(error.errors.vacancy);
  assert.equal(JobApplication.schema.options.strict, "throw");
});
