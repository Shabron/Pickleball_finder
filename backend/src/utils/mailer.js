/**
 * mailer.js — Email sending strategy (priority order):
 *
 *  1. SENDGRID_API_KEY → SendGrid Web API (HTTPS, no domain needed, just verify sender email)
 *  2. RESEND_API_KEY   → Resend HTTP API (HTTPS, but requires verified domain for external recipients)
 *  3. Fallback         → nodemailer SMTP (BLOCKED on Render free/starter — will timeout)
 *
 * Recommended for Render without a domain:
 *   → Use SendGrid. Sign up at https://sendgrid.com (free, 100 emails/day).
 *     Verify your sender email (shauryamspp@gmail.com) under Settings → Sender Authentication.
 *     Create an API key and add SENDGRID_API_KEY=SG.xxx to Render env vars.
 */

const nodemailer = require('nodemailer');

// ─── Email templates ────────────────────────────────────────────────────────

const emailSubject = 'Your Pickleball Finder password reset code';

const emailText = (code) =>
  `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;

const emailHtml = (code) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color:#0F2C4C;">Reset your password</h2>
    <p>Use the code below to reset your Pickleball Finder password. It expires in 10 minutes.</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background:#F3F4F6; padding:16px 24px; border-radius:8px; text-align:center; margin: 24px 0;">${code}</div>
    <p style="color:#6B7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
`;

// ─── 1. SendGrid (recommended — no domain needed, just verify sender email) ──

const sendViaSendGrid = async (to, code) => {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  console.log(`[mailer/sendgrid] Sending to ${to} from ${from}`);

  const msg = {
    to,
    from,   // Must match the verified sender email in your SendGrid account
    subject: emailSubject,
    text: emailText(code),
    html: emailHtml(code),
  };

  const [response] = await sgMail.send(msg);
  console.log(`[mailer/sendgrid] Accepted — statusCode: ${response.statusCode}, messageId: ${response.headers['x-message-id']}`);
  return response;
};

// ─── 2. Resend (requires verified domain for external recipients) ─────────────

const sendViaResend = async (to, code) => {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  console.log(`[mailer/resend] Sending to ${to} from ${from}`);
  console.log('[mailer/resend] NOTE: Resend sandbox only allows sending TO your verified email. Verify a domain at resend.com/domains to send to all users.');

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: emailSubject,
    text: emailText(code),
    html: emailHtml(code),
  });

  if (error) {
    console.error('[mailer/resend] API error:', JSON.stringify(error));
    throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  }

  console.log(`[mailer/resend] Sent — id: ${data?.id}`);
  return data;
};

// ─── 3. SMTP fallback (blocked on Render — use only locally) ─────────────────

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

const sendViaSmtp = async (to, code) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  console.log(`[mailer/smtp] Sending to ${to} from ${from}`);

  const info = await getSmtpTransporter().sendMail({
    from, to, subject: emailSubject, text: emailText(code), html: emailHtml(code),
  });

  console.log(`[mailer/smtp] Accepted — messageId: ${info.messageId}, response: ${info.response}`);
  return info;
};

// ─── Public API ──────────────────────────────────────────────────────────────

const sendPasswordResetEmail = async (to, code) => {
  if (process.env.SENDGRID_API_KEY) {
    console.log('[mailer] Using SendGrid HTTP API (no domain required)');
    return sendViaSendGrid(to, code);
  }

  if (process.env.RESEND_API_KEY) {
    console.log('[mailer] Using Resend HTTP API (domain required for external recipients)');
    return sendViaResend(to, code);
  }

  console.warn(
    '[mailer] No SENDGRID_API_KEY or RESEND_API_KEY set. ' +
    'Falling back to SMTP — this will TIMEOUT on Render free/starter tier. ' +
    'Set SENDGRID_API_KEY in your Render environment variables to fix this.'
  );
  return sendViaSmtp(to, code);
};

module.exports = { sendPasswordResetEmail };
