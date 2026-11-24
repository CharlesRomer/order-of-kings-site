// Forwards a Designed Backwards registration to a GoHighLevel inbound webhook.
// Set GHL_EVENT_WEBHOOK_URL in this Netlify site's environment variables.
// (Netlify Forms also keeps a copy of every registration, so nothing is lost if this isn't set yet.)

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let d;
  try { d = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  if (d.company) return { statusCode: 200, body: 'ok' }; // honeypot
  if (!d.email || !d.first_name) return { statusCode: 400, body: 'Missing fields' };

  const url = process.env.GHL_EVENT_WEBHOOK_URL;
  if (!url) {
    console.warn('register: GHL_EVENT_WEBHOOK_URL not set, skipping forward for', d.email);
    return { statusCode: 202, body: 'stored (no webhook configured)' };
  }

  const payload = {
    first_name: String(d.first_name).slice(0, 80),
    email: String(d.email).slice(0, 200),
    phone: String(d.phone || '').slice(0, 40),
    tags: ['designed-backwards', 'designed-backwards-ga'],
    event: 'Designed Backwards',
    source: 'event.orderofkings.org',
    utm_source: d.utm_source || '', utm_medium: d.utm_medium || '', utm_campaign: d.utm_campaign || '',
    utm_content: d.utm_content || '', utm_term: d.utm_term || '', fbclid: d.fbclid || '',
    page: d.page || '', registered_at: d.registered_at || new Date().toISOString(), ph_id: d.ph_id || '',
  };

  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) { console.error('register: GHL responded', r.status, await r.text()); return { statusCode: 502, body: 'upstream error' }; }
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error('register: forward failed', e);
    return { statusCode: 502, body: 'upstream error' };
  }
};
