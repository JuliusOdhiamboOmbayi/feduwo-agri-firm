const nodemailer = require("nodemailer");

async function send(to, subject, text) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !to) return false;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  await transporter.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject, text });
  return true;
}

async function notify(subject, text) {
  return send(process.env.NOTIFICATION_EMAIL, subject, text);
}

async function confirm(recipient, subject, text) {
  return send(recipient, subject, text);
}

module.exports = { notify, confirm };
