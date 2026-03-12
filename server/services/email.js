const https = require('https');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL    = process.env.FROM_EMAIL || 'noreply@cyberrangetz.com';
const FROM_NAME     = 'CyberRange TZ';
const BASE_URL      = process.env.CLIENT_URL || 'https://cyberrangetz.com';

function htmlEmail({ firstName, email, referralCode, position }) {
  const refLink = `${BASE_URL}/waitlist?ref=${referralCode}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You're on the CyberRange TZ waitlist</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:'Roboto',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.09);border-radius:16px;overflow:hidden;max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:36px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.09);">
            <span style="font-size:22px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
              <span style="color:#1EB53A;">Cyber</span>Range TZ
            </span>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);">You're in</p>
            <h1 style="margin:0 0 20px;font-size:32px;font-weight:700;line-height:1.2;">
              Hey ${firstName}, spot <span style="color:#1EB53A;">#${position}</span> is yours.
            </h1>
            <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.7);">
              Welcome to the CyberRange TZ waitlist — Tanzania's first browser-based cybersecurity lab.
              We'll let you know the moment early access opens.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.09);"></div></td></tr>

        <!-- Referral section -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.45);">Move up the list</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);">
              Every friend you refer bumps you up. Share your personal link:
            </p>
            <div style="background:#111;border:1px solid rgba(30,181,58,0.3);border-radius:10px;padding:16px 20px;font-family:'Courier New',monospace;font-size:13px;color:#1EB53A;word-break:break-all;">
              ${refLink}
            </div>
            <div style="margin-top:20px;">
              <a href="${refLink}" style="display:inline-block;background:#1EB53A;color:#000;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:8px;">
                Share your link →
              </a>
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.09);"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 40px;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
            You signed up with <span style="color:rgba(255,255,255,0.55);">${email}</span>.
            If this wasn't you, you can ignore this email.<br />
            &copy; ${new Date().getFullYear()} CyberRange TZ. Dar es Salaam, Tanzania.
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send a waitlist confirmation email via Brevo.
 * @param {{ email: string, referralCode: string, position: number }} opts
 */
async function sendWaitlistConfirmation({ firstName, email, referralCode, position }) {
  if (!BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set — skipping confirmation email');
    return;
  }

  const payload = JSON.stringify({
    sender:  { name: FROM_NAME, email: FROM_EMAIL },
    to:      [{ email }],
    subject: `You're #${position} on the CyberRange TZ waitlist`,
    htmlContent: htmlEmail({ firstName, email, referralCode, position }),
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path:     '/v3/smtp/email',
        method:   'POST',
        headers:  {
          'Content-Type':  'application/json',
          'api-key':       BREVO_API_KEY,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            console.error('[email] Brevo error', res.statusCode, body);
            reject(new Error(`Brevo ${res.statusCode}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { sendWaitlistConfirmation };
