require("dotenv").config();
const bcrypt = require("bcryptjs");
const { getSupabase, unwrap } = require("./db");

async function createAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY
    || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_NAME, ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.");
  }
  const supabase = getSupabase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  unwrap(await supabase.from("staff_users").upsert({
    name: ADMIN_NAME.trim(),
    email: ADMIN_EMAIL.trim().toLowerCase(),
    password_hash: passwordHash,
    role: "admin",
    active: true,
  }, { onConflict: "email" }));
  console.log(`Administrator account ready for ${ADMIN_EMAIL.toLowerCase()}.`);
}

createAdmin().catch((error) => {
  console.error("Administrator setup failed:", error.message);
  process.exitCode = 1;
});
