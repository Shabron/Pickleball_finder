const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,          // STARTTLS on 587 — do NOT use SSL/465 (blocked on Render)
    family: 4,              // Force IPv4 — Render's IPv6 routing is unreliable
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  };

  console.log('[mailer] Creating SMTP transporter with config:', {
    ...config,
    auth: { user: config.auth.user, pass: config.auth.pass ? '(set)' : '(missing)' },
  });

  transporter = nodemailer.createTransport(config);

  transporter.verify((error) => {
    if (error) {
      console.error('[mailer] SMTP connection verification FAILED:', error);
    } else {
      console.log('[mailer] SMTP connection verified — ready to send emails');
    }
  });

  return transporter;
};

const sendPasswordResetEmail = async (to, code) => {
  console.log(`[mailer] Sending password reset email to ${to} from ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);

  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Your Pickleball Finder password reset code',
    text: `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#0F2C4C;">Reset your password</h2>
        <p>Use the code below to reset your Pickleball Finder password. It expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background:#F3F4F6; padding:16px 24px; border-radius:8px; text-align:center; margin: 24px 0;">${code}</div>
        <p style="color:#6B7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });

  console.log(`[mailer] Email accepted by SMTP server — messageId: ${info.messageId}, response: ${info.response}`);
  return info;
};

module.exports = { sendPasswordResetEmail };
