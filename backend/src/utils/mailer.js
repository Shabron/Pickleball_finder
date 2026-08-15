/**
 * mailer.js
 *
 * Strategy:
 *  1. If RESEND_API_KEY is set → use Resend (HTTP API, works on Render free tier, no SMTP needed).
 *  2. Otherwise → fall back to nodemailer SMTP with explicit timeouts and diagnostic logging.
 *
 * WHY Resend?
 *  Render (free/starter) blocks outbound SMTP on ports 25, 465 and 587. Any SMTP-based
 *  approach (Gmail, SendGrid SMTP, etc.) will always time out. Resend uses HTTPS so it
 *  is never blocked.
 *
 * Setup:
 *  1. Sign up at https://resend.com (free — 3,000 emails/month, 100/day)
 *  2. Add a sending domain OR use the sandbox address (only sends to your verified email).
 *  3. Create an API key and add RESEND_API_KEY=re_xxxx to your Render env vars.
 *  4. Set EMAIL_FROM to a verified sender address, e.g. "Pickleball Finder <noreply@yourdomain.com>"
 *     (or your verified email if using the sandbox).
 */

const nodemailer = require('nodemailer');

// ─── Helpers ────────────────────────────────────────────────────────────────

const emailHtml = (code) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color:#0F2C4C;">Reset your password</h2>
    <p>Use the code below to reset your Pickleball Finder password. It expires in 10 minutes.</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background:#F3F4F6; padding:16px 24px; border-radius:8px; text-align:center; margin: 24px 0;">${code}</div>
    <p style="color:#6B7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
`;

const emailText = (code) =>
  `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;

// ─── Resend (HTTP) ───────────────────────────────────────────────────────────

const sendViaResend = async (to, code) => {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  console.log(`[mailer/resend] Sending to ${to} from ${from}`);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'Your Pickleball Finder password reset code',
    text: emailText(code),
    html: emailHtml(code),
  });

  if (error) {
    console.error('[mailer/resend] API returned error:', JSON.stringify(error));
    throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  }

  console.log(`[mailer/resend] Email sent — id: ${data?.id}`);
  return data;
};

// ─── nodemailer SMTP (fallback) ──────────────────────────────────────────────

let _smtpTransporter = null;

const getSmtpTransporter = () => {
  if (_smtpTransporter) return _smtpTransporter;

  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,            // STARTTLS on 587
    family: 4,                // Force IPv4 (avoid IPv6 ENETUNREACH on Render)
    connectionTimeout: 10000, // 10 s — fail fast instead of hanging
    socketTimeout: 10000,     // 10 s socket idle timeout
    greetingTimeout: 10000,   // 10 s SMTP greeting timeout
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  };

  console.log('[mailer/smtp] Creating transporter:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    family: config.family,
    user: config.auth.user,
    pass: config.auth.pass ? '(set)' : '(MISSING — check EMAIL_PASS env var)',
  });

  _smtpTransporter = nodemailer.createTransport(config);

  // Non-blocking connection check — result appears in logs before any send attempt
  _smtpTransporter.verify((err) => {
    if (err) {
      console.error('[mailer/smtp] verify() FAILED — SMTP is likely blocked by host:', {
        code: err.code,
        syscall: err.syscall,
        address: err.address,
        port: err.port,
        message: err.message,
      });
    } else {
      console.log('[mailer/smtp] verify() OK — SMTP connection is open and ready');
    }
  });

  return _smtpTransporter;
};

const sendViaSmtp = async (to, code) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  console.log(`[mailer/smtp] Sending to ${to} from ${from}`);
  console.log('[mailer/smtp] Calling sendMail — will log result or error below...');

  const info = await getSmtpTransporter().sendMail({
    from,
    to,
    subject: 'Your Pickleball Finder password reset code',
    text: emailText(code),
    html: emailHtml(code),
  });

  console.log(`[mailer/smtp] Accepted by server — messageId: ${info.messageId}, response: ${info.response}`);
  return info;
};

// ─── Public API ──────────────────────────────────────────────────────────────

const sendPasswordResetEmail = async (to, code) => {
  if (process.env.RESEND_API_KEY) {
    console.log('[mailer] RESEND_API_KEY found → using Resend HTTP API (recommended for Render)');
    return sendViaResend(to, code);
  }

  console.warn(
    '[mailer] RESEND_API_KEY not set → falling back to SMTP. ' +
    'WARNING: Render free/starter tier blocks outbound SMTP — this will likely time out. ' +
    'Set RESEND_API_KEY in your Render env vars to fix this.'
  );
  return sendViaSmtp(to, code);
};

module.exports = { sendPasswordResetEmail };
