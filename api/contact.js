// Vercel Serverless Function: POST /api/contact
// Receives the contact form on contact.html and emails it via Resend.
// Same pattern as the FutureInSites /api/inquire function.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   e.g. re_xxxxxxxxxxxxxxxx
//   CONTACT_TO       hello@spirantix.ai (or any inbox you want submissions delivered to)
//   CONTACT_FROM     Spirantix <forms@spirantix.ai>   (sender must be on a verified Resend domain)

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill hidden fields. If filled, pretend success and drop.
  if (body.website || body.fax) {
    return res.status(200).json({ ok: true });
  }

  const name    = (body.name    || '').toString().trim().slice(0, 200);
  const email   = (body.email   || '').toString().trim().slice(0, 200);
  const message = (body.message || '').toString().trim().slice(0, 4000);

  if (!name)           return res.status(400).json({ ok: false, error: 'Name is required.' });
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: 'A valid email is required.' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const CONTACT_TO     = process.env.CONTACT_TO   || 'spirantix@futureinsites.com';
  const CONTACT_FROM   = process.env.CONTACT_FROM || 'Spirantix <forms@futureinsites.com>';

  if (!RESEND_API_KEY) {
    console.error('contact: RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Server is not configured to send mail yet.' });
  }

  const html = `
    <h2>New message from spirantix.ai</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td valign="top"><strong>Message</strong></td><td>${escapeHtml(message).replace(/\n/g, '<br>') || '<em>(none)</em>'}</td></tr>
    </table>
  `;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        reply_to: email,
        subject: `Spirantix contact: ${name}`,
        html,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('contact: Resend error', resp.status, detail);
      return res.status(502).json({ ok: false, error: 'Mail service error. Please email hello@spirantix.ai directly.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact: unexpected error', err);
    return res.status(500).json({ ok: false, error: 'Unexpected server error. Please email hello@spirantix.ai directly.' });
  }
};
