const test = require("node:test");
const assert = require("node:assert/strict");
const { fromDatabase, toDatabase } = require("./db");

test("database rows preserve API id and camelCase fields", () => {
  assert.deepEqual(fromDatabase({
    id: "7f35cda1-1040-49e1-9168-0ee7b49c870b",
    created_at: "2026-01-01T00:00:00.000Z",
    assigned_to: "staff-id",
  }), {
    id: "7f35cda1-1040-49e1-9168-0ee7b49c870b",
    _id: "7f35cda1-1040-49e1-9168-0ee7b49c870b",
    createdAt: "2026-01-01T00:00:00.000Z",
    assignedTo: "staff-id",
  });
});

test("database writes convert API field names to SQL column names", () => {
  assert.deepEqual(toDatabase({
    programmeId: "programme-id",
    internalNotes: "Follow up next week",
    publishedAt: "2026-01-01T00:00:00.000Z",
  }), {
    programme_id: "programme-id",
    internal_notes: "Follow up next week",
    published_at: "2026-01-01T00:00:00.000Z",
  });
});

test("JSON document metadata remains intact when rows are mapped", () => {
  const document = { filename: "private/cv.pdf", originalName: "cv.pdf", mimeType: "application/pdf", size: 128 };
  const row = fromDatabase({ id: "application-id", documents: [document] });
  assert.equal(row._id, "application-id");
  assert.deepEqual(row.documents, [document]);
});
