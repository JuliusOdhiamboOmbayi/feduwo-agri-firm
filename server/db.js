const { createClient } = require("@supabase/supabase-js");

let client;

function getSupabase() {
  if (client) return client;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.");
  }
  client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

function fromDatabase(row) {
  if (Array.isArray(row)) return row.map(fromDatabase);
  if (!row || typeof row !== "object") return row;
  const value = Object.fromEntries(Object.entries(row).map(([key, item]) => [
    key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
    item && typeof item === "object" ? fromDatabase(item) : item,
  ]));
  if (value.id) value._id = value.id;
  return value;
}

function toDatabase(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [
    key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
    value,
  ]));
}

function unwrap(result) {
  if (result.error) {
    const error = new Error(result.error.message);
    error.code = result.error.code;
    error.details = result.error.details;
    throw error;
  }
  return result.data;
}

module.exports = { fromDatabase, getSupabase, toDatabase, unwrap };
