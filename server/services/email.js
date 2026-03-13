const nodemailer = require('nodemailer');

// ── Gmail SMTP config ──────────────────────────────────────────────────────
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'cyberrangetz@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS;             // Gmail App Password (16 chars)
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const FROM_NAME  = process.env.FROM_NAME || 'CyberRange TZ';
const BASE_URL   = process.env.CLIENT_URL || 'https://cyberrangetz.com';
const WHATSAPP_LINK = process.env.WHATSAPP_LINK || 'https://chat.whatsapp.com/YOUR_GROUP_LINK';

// Reusable transporter (created lazily, cached)
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[email] SMTP_USER / SMTP_PASS not set — emails disabled');
    return null;
  }
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,   // true for 465, false for 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
  return _transporter;
}

// ── Email wrapper ──────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) return;
  return transport.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

// ── Shared styles ──────────────────────────────────────────────────────────
const BRAND_GREEN = '#1EB53A';
const STYLES = {
  body:     'margin:0;padding:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#ffffff;',
  wrapper:  'background:#050505;padding:40px 16px;',
  card:     'background:#0d0d0d;border:1px solid rgba(255,255,255,0.09);border-radius:16px;overflow:hidden;max-width:560px;width:100%;',
  header:   'padding:32px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.09);',
  logo:     `font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fff;`,
  logoAccent: `color:${BRAND_GREEN};`,
  section:  'padding:36px 36px 32px;',
  h1:       'margin:0 0 20px;font-size:26px;font-weight:700;line-height:1.3;color:#ffffff;',
  body:     'margin:0 0 16px;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.75);',
  divider:  'height:1px;background:rgba(255,255,255,0.09);margin:0 36px;',
  btnWrap:  'padding:0 36px 36px;',
  btn:      `display:inline-block;background:${BRAND_GREEN};color:#000;font-weight:700;font-size:14px;letter-spacing:0.04em;text-decoration:none;padding:14px 32px;border-radius:8px;`,
  footer:   'padding:24px 36px;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;',
};

// ── Welcome / Confirmation Email ───────────────────────────────────────────
function welcomeHtml({ firstName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to CyberRange TZ</title>
</head>
<body style="${STYLES.body}">
  <table width="100%" cellpadding="0" cellspacing="0" style="${STYLES.wrapper}">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="${STYLES.card}">

        <!-- Logo -->
        <tr>
          <td style="${STYLES.header}">
            <span style="${STYLES.logo}">
              <span style="${STYLES.logoAccent}">Cyber</span>Range TZ
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="${STYLES.section}">
            <h1 style="${STYLES.h1}">Hi ${firstName},</h1>
            <p style="${STYLES.body}">
              Thank you for joining our waitlist as a cybersecurity enthusiast &mdash;
              we know how excited you are, and we are just as excited!
            </p>
            <p style="${STYLES.body}">
              While we are working on launching the product, we will be sharing
              <strong style="color:#fff;">tips, tricks, and insights</strong> useful in today's
              cybersecurity industry. We'd love for you to follow along.
            </p>
            <p style="${STYLES.body}">
              Join our WhatsApp community below to stay in the loop.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="${STYLES.btnWrap}">
            <a href="${WHATSAPP_LINK}" style="${STYLES.btn}" target="_blank">
              Join WhatsApp Community &rarr;
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td><div style="${STYLES.divider}"></div></td></tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:28px 36px 12px;">
            <p style="margin:0 0 4px;font-size:14px;color:rgba(255,255,255,0.65);">Best,</p>
            <p style="margin:0;font-size:14px;font-weight:700;color:#fff;">
              The CyberRange TZ Team
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="${STYLES.footer}">
            &copy; ${new Date().getFullYear()} CyberRange TZ. Dar es Salaam, Tanzania.<br />
            <a href="${BASE_URL}" style="color:${BRAND_GREEN};text-decoration:none;">${BASE_URL.replace('https://', '')}</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send the personalised welcome email after a new waitlist signup.
 */
async function sendWaitlistConfirmation({ firstName, email }) {
  return sendEmail({
    to: email,
    subject: `Welcome to CyberRange TZ, ${firstName}!`,
    html: welcomeHtml({ firstName }),
  });
}

// ── Tier-unlocked Email (kept for referral system) ─────────────────────────
function tierHtml({ firstName, tierName, rewardDescription, referralCount }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You unlocked ${tierName}!</title>
</head>
<body style="${STYLES.body}">
  <table width="100%" cellpadding="0" cellspacing="0" style="${STYLES.wrapper}">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="${STYLES.card}">

        <tr>
          <td style="${STYLES.header}">
            <span style="${STYLES.logo}">
              <span style="${STYLES.logoAccent}">Cyber</span>Range TZ
            </span>
          </td>
        </tr>

        <tr>
          <td style="${STYLES.section}">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);">Tier unlocked</p>
            <h1 style="${STYLES.h1}">
              ${firstName}, you just hit <span style="color:#FCD116;">${referralCount} referrals</span>!
            </h1>
            <div style="background:rgba(252,209,22,0.08);border:1px solid rgba(252,209,22,0.25);border-radius:12px;padding:20px 24px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#FCD116;">${tierName}</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);">${rewardDescription}</p>
            </div>
            <p style="${STYLES.body}">
              Keep sharing your referral link to unlock even more rewards.
            </p>
          </td>
        </tr>

        <tr><td><div style="${STYLES.divider}"></div></td></tr>

        <tr>
          <td style="${STYLES.footer}">
            &copy; ${new Date().getFullYear()} CyberRange TZ. Dar es Salaam, Tanzania.
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendTierUnlockedEmail({ firstName, email, tierName, rewardDescription, referralCount }) {
  return sendEmail({
    to: email,
    subject: `You unlocked "${tierName}" — ${referralCount} referrals!`,
    html: tierHtml({ firstName, tierName, rewardDescription, referralCount }),
  });
}

// ── Newsletter Email ───────────────────────────────────────────────────────
function newsletterHtml({ firstName, subject, bodyContent }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="${STYLES.body}">
  <table width="100%" cellpadding="0" cellspacing="0" style="${STYLES.wrapper}">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="${STYLES.card}">

        <tr>
          <td style="${STYLES.header}">
            <span style="${STYLES.logo}">
              <span style="${STYLES.logoAccent}">Cyber</span>Range TZ
            </span>
          </td>
        </tr>

        <tr>
          <td style="${STYLES.section}">
            <h1 style="${STYLES.h1}">Hi ${firstName},</h1>
            <div style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.75);">
              ${bodyContent}
            </div>
          </td>
        </tr>

        <tr><td><div style="${STYLES.divider}"></div></td></tr>

        <tr>
          <td style="padding:28px 36px 12px;">
            <p style="margin:0 0 4px;font-size:14px;color:rgba(255,255,255,0.65);">Best,</p>
            <p style="margin:0;font-size:14px;font-weight:700;color:#fff;">
              The CyberRange TZ Team
            </p>
          </td>
        </tr>

        <tr>
          <td style="${STYLES.footer}">
            &copy; ${new Date().getFullYear()} CyberRange TZ. Dar es Salaam, Tanzania.<br />
            <a href="${BASE_URL}" style="color:${BRAND_GREEN};text-decoration:none;">${BASE_URL.replace('https://', '')}</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send a newsletter to a single subscriber.
 * @param {{ firstName: string, email: string, subject: string, bodyContent: string }} opts
 *   bodyContent is raw HTML (paragraphs, links, etc.) inserted inside the template.
 */
async function sendNewsletter({ firstName, email, subject, bodyContent }) {
  return sendEmail({
    to: email,
    subject,
    html: newsletterHtml({ firstName, subject, bodyContent }),
  });
}

module.exports = {
  sendWaitlistConfirmation,
  sendTierUnlockedEmail,
  sendNewsletter,
  getTransporter,       // exported so you can verify SMTP connection
};
