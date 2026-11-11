require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User } = require("./models");

async function createAdmin() {
  const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error("Set MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.");
  }
  await mongoose.connect(MONGODB_URI);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.updateOne(
    { email: ADMIN_EMAIL.toLowerCase() },
    { $set: { name: ADMIN_NAME, passwordHash, role: "admin", active: true } },
    { upsert: true, runValidators: true },
  );
  await mongoose.disconnect();
  console.log(`Administrator account ready for ${ADMIN_EMAIL.toLowerCase()}.`);
}

createAdmin().catch(async (error) => {
  console.error("Administrator setup failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
