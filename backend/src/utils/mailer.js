/**
 * mailer.js — Email sending strategy (priority order):
 *
 *  1. SENDGRID_API_KEY → SendGrid Web API (HTTPS, no domain needed, just verify sender email)
 *  2. Fallback         → nodemailer SMTP (BLOCKED on Render free/starter — will timeout)
 *
 * Setup for Render:
 *  1. Sign up at https://sendgrid.com (free, 100 emails/day)
 *  2. Settings → Sender Authentication → Verify a Single Sender (shauryamspp@gmail.com)
 *  3. Settings → API Keys → Create API Key → copy it
 *  4. Add SENDGRID_API_KEY=SG.xxx and EMAIL_FROM to Render env vars
 */

const nodemailer = require('nodemailer');

// ─── Email templates ────────────────────────────────────────────────────────

const resetSubject = 'Your Pickleball Finder password reset code';

const resetText = (code) =>
  `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;

const resetHtml = (code) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color:#0F2C4C;">Reset your password</h2>
    <p>Use the code below to reset your Pickleball Finder password. It expires in 10 minutes.</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background:#F3F4F6; padding:16px 24px; border-radius:8px; text-align:center; margin: 24px 0;">${code}</div>
    <p style="color:#6B7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
`;

const verifySubject = 'Verify your Pickleball Finder email';

const verifyText = (code) =>
  `Your email verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;

const verifyHtml = (code) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color:#0F2C4C;">Verify your email</h2>
    <p>Use the code below to verify your Pickleball Finder account. It expires in 10 minutes.</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background:#F3F4F6; padding:16px 24px; border-radius:8px; text-align:center; margin: 24px 0;">${code}</div>
    <p style="color:#6B7280; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
  </div>
`;

// ─── 1. SendGrid (recommended — no domain needed, just verify sender email) ──

const sendViaSendGrid = async (to, subject, text, html) => {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  console.log(`[mailer/sendgrid] Sending to ${to} from ${from}`);

  try {
    const [response] = await sgMail.send({
      to,
      from,   // Must match the verified sender email in your SendGrid account
      subject,
      text,
      html,
    });

    console.log(`[mailer/sendgrid] Accepted — statusCode: ${response.statusCode}, messageId: ${response.headers['x-message-id']}`);
    return response;
  } catch (err) {
    // SendGrid buries the actual reason in response.body.errors, which Node's
    // default logging collapses to "[Array]" — surface it so failures are
    // diagnosable (403 almost always means `from` is not a verified sender).
    const errors = err.response?.body?.errors;
    if (errors) {
      console.error(
        `[mailer/sendgrid] REJECTED (${err.code}) sending from "${from}":`,
        JSON.stringify(errors, null, 2)
      );
      if (err.code === 403) {
        console.error(
          `[mailer/sendgrid] A 403 here means "${from}" is not a verified sender. ` +
          'Verify it at SendGrid → Settings → Sender Authentication → Single Sender ' +
          'Verification, and make sure EMAIL_FROM matches that exact address.'
        );
      }
    }
    throw err;
  }
};

// ─── 2. SMTP fallback (blocked on Render — use only locally) ─────────────────

let _smtpTransporter = null;

const getSmtpTransporter = () => {
  if (_smtpTransporter) return _smtpTransporter;

  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    family: 4,
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  };

  console.log('[mailer/smtp] Creating transporter:', {
    host: config.host, port: config.port, user: config.auth.user,
    pass: config.auth.pass ? '(set)' : '(MISSING)',
  });

  _smtpTransporter = nodemailer.createTransport(config);

  _smtpTransporter.verify((err) => {
    if (err) {
      console.error('[mailer/smtp] verify() FAILED — port likely blocked by host:', {
        code: err.code, syscall: err.syscall, address: err.address, message: err.message,
      });
    } else {
      console.log('[mailer/smtp] verify() OK — SMTP ready');
    }
  });

  return _smtpTransporter;
};

const sendViaSmtp = async (to, subject, text, html) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  console.log(`[mailer/smtp] Sending to ${to} from ${from}`);

  const info = await getSmtpTransporter().sendMail({
    from, to, subject, text, html,
  });

  console.log(`[mailer/smtp] Accepted — messageId: ${info.messageId}, response: ${info.response}`);
  return info;
};

// ─── Public API ──────────────────────────────────────────────────────────────

const sendEmail = async (to, subject, text, html) => {
  if (process.env.SENDGRID_API_KEY) {
    console.log('[mailer] Using SendGrid HTTP API');
    return sendViaSendGrid(to, subject, text, html);
  }

  console.warn(
    '[mailer] SENDGRID_API_KEY not set. ' +
    'Falling back to SMTP — this will TIMEOUT on Render free/starter tier. ' +
    'Set SENDGRID_API_KEY in your Render environment variables to fix this.'
  );
  return sendViaSmtp(to, subject, text, html);
};

const sendPasswordResetEmail = (to, code) => sendEmail(to, resetSubject, resetText(code), resetHtml(code));

const sendVerificationEmail = (to, code) => sendEmail(to, verifySubject, verifyText(code), verifyHtml(code));

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
