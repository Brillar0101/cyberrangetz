const { Resend } = require('resend');

// ── Resend config ─────────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME  = process.env.FROM_NAME || 'CyberRange TZ';
const BASE_URL   = process.env.CLIENT_URL || 'https://cyberrangetz.com';
const WHATSAPP_LINK = process.env.WHATSAPP_LINK || '';
const SERVER_URL  = process.env.SERVER_URL || 'https://cyberrange-api.onrender.com';

// Resend client (created lazily)
let _resend = null;
function getResend() {
  if (_resend) return _resend;
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — emails disabled');
    return null;
  }
  _resend = new Resend(RESEND_API_KEY);
  return _resend;
}

// ── Email wrapper ──────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  console.log(`[email] Attempting to send "${subject}" to ${to}`);
  const resend = getResend();
  if (!resend) {
    console.warn('[email] No Resend client — skipping');
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[email] FAILED:`, error.message);
      throw new Error(error.message);
    }
    console.log(`[email] Sent successfully: ${data.id}`);
    return data;
  } catch (err) {
    console.error(`[email] FAILED:`, err.message);
    throw err;
  }
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

// ── Tracking pixel helper ─────────────────────────────────────────────────
const crypto = require('crypto');
const TRACKING_SECRET = process.env.TRACKING_SECRET || process.env.JWT_SECRET || 'tracking-fallback';

function trackingPixel(waitlistId) {
  if (!waitlistId) return '';
  const apiBase = SERVER_URL.replace(/\/$/, '');
  const sig = crypto.createHmac('sha256', TRACKING_SECRET)
    .update(String(waitlistId)).digest('hex').slice(0, 16);
  return `<img src="${apiBase}/api/waitlist/track/${waitlistId}?sig=${sig}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
}

// ── Welcome / Confirmation Email ───────────────────────────────────────────
function welcomeHtml({ firstName, waitlistId }) {
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

        <tr>
          <td style="${STYLES.section}">
            <p style="${STYLES.body}">
              Hey ${firstName}!
            </p>
            <p style="${STYLES.body}">
              Thank you so much for signing up to the CyberRange TZ waitlist. We are really glad you are here.
            </p>
            <p style="${STYLES.body}">
              We are building Tanzania's first browser-based cybersecurity training lab, and your interest means a lot to us. We are working hard to get things ready and we will keep you posted on our progress.
            </p>
            <p style="${STYLES.body}">
              In the meantime, we will be sharing tips, tricks, and insights on cybersecurity that we think you will find useful. Keep an eye on your inbox!
            </p>
${WHATSAPP_LINK ? `
            <p style="${STYLES.body}">
              You can also <a href="${WHATSAPP_LINK}" style="color:${BRAND_GREEN};text-decoration:underline;" target="_blank">join our WhatsApp community</a> to connect with others who are just as excited about cybersecurity.
            </p>` : ''}
            <p style="margin:0 0 4px;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.75);">
              Talk soon,<br />
              The CyberRange TZ Team
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 36px;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
            CyberRange TZ &middot; Dar es Salaam, Tanzania<br />
            <a href="${BASE_URL}" style="color:rgba(255,255,255,0.3);text-decoration:none;">${BASE_URL.replace('https://', '')}</a>
          </td>
        </tr>

      </table>
      ${trackingPixel(waitlistId)}
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send the personalised welcome email after a new waitlist signup.
 */
async function sendWaitlistConfirmation({ firstName, email, waitlistId }) {
  return sendEmail({
    to: email,
    subject: `Welcome to CyberRange TZ, ${firstName}!`,
    html: welcomeHtml({ firstName, waitlistId }),
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

        <!-- Logo header -->
        <tr>
          <td style="${STYLES.header}">
            <span style="${STYLES.logo}">
              <span style="${STYLES.logoAccent}">Cyber</span>Range TZ
            </span>
          </td>
        </tr>

        <!-- Green accent bar -->
        <tr>
          <td style="padding:0;">
            <div style="height:3px;background:linear-gradient(90deg, ${BRAND_GREEN}, ${BRAND_GREEN}44);"></div>
          </td>
        </tr>

        <!-- Subject label -->
        <tr>
          <td style="padding:28px 36px 0;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.4);">
              Newsletter
            </p>
          </td>
        </tr>

        <!-- Greeting & body -->
        <tr>
          <td style="${STYLES.section}">
            <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;line-height:1.3;color:#ffffff;">
              Hi ${firstName},
            </h1>
            <div style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.75);">
              ${bodyContent}
            </div>
          </td>
        </tr>

        <!-- Tip box (optional visual element) -->
        <tr>
          <td style="padding:0 36px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(30,181,58,0.06);border:1px solid rgba(30,181,58,0.15);border-radius:10px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND_GREEN};font-weight:700;">
                    Stay Connected
                  </p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.6);">
                    Follow us for cybersecurity tips, industry news, and early access updates.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA button -->
        <tr>
          <td style="padding:0 36px 32px;">
            <a href="${BASE_URL}" style="${STYLES.btn}" target="_blank">
              Visit CyberRange TZ &rarr;
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td><div style="${STYLES.divider}"></div></td></tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:28px 36px 12px;">
            <p style="margin:0 0 4px;font-size:14px;color:rgba(255,255,255,0.55);">Best,</p>
            <p style="margin:0;font-size:14px;font-weight:700;color:#fff;">
              The CyberRange TZ Team
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="${STYLES.footer}">
            <p style="margin:0 0 8px;">
              &copy; ${new Date().getFullYear()} CyberRange TZ. Dar es Salaam, Tanzania.
            </p>
            <p style="margin:0;">
              <a href="${BASE_URL}" style="color:${BRAND_GREEN};text-decoration:none;">${BASE_URL.replace('https://', '')}</a>
            </p>
            <p style="margin:12px 0 0;font-size:10px;color:rgba(255,255,255,0.2);">
              You received this because you joined the CyberRange TZ waitlist.
            </p>
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
};
