// Forwards a Designed Backwards registration to a GoHighLevel inbound webhook.
// Set GHL_EVENT_WEBHOOK_URL in this Netlify site's environment variables.
// (Netlify Forms also keeps a copy of every registration, so nothing is lost if this isn't set yet.)

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let d;
  try { d = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  if (d.company) return { statusCode: 200, body: 'ok' }; // honeypot

  // Non-registration events (VIP click). Forwarded to GHL with the event field unchanged so GHL
  // doesn't treat them as a second GA registration. Only known event names are accepted.
  const ALLOWED_EVENTS = ['vip_checkout_started'];
  const isEvent = typeof d.event === 'string' && d.event !== '' && d.event !== 'Designed Backwards';
  if (isEvent && !ALLOWED_EVENTS.includes(d.event)) return { statusCode: 400, body: 'Unknown event' };
  if (isEvent && !/^\S+@\S+\.\S+$/.test(String(d.email || ''))) return { statusCode: 400, body: 'Missing email' };
  if (!isEvent && (!d.email || !d.first_name)) return { statusCode: 400, body: 'Missing fields' };

  const url = process.env.GHL_EVENT_WEBHOOK_URL;
  if (!url) {
    console.warn('register: GHL_EVENT_WEBHOOK_URL not set, skipping forward for', d.email);
    return { statusCode: 202, body: 'stored (no webhook configured)' };
  }

  const payload = isEvent ? {
    event: d.event,
    email: String(d.email).trim().toLowerCase().slice(0, 200),
    first_name: String(d.first_name || '').slice(0, 80),
    last_name: String(d.last_name || '').slice(0, 120),
    phone: String(d.phone || '').slice(0, 40),
  } : {
    first_name: String(d.first_name).slice(0, 80),
    last_name: String(d.last_name || '').slice(0, 120),
    full_name: String(d.full_name || d.first_name).slice(0, 200),
    phone_country: String(d.phone_country || '').slice(0, 2),
    email: String(d.email).slice(0, 200),
    phone: String(d.phone || '').slice(0, 40),
    // SMS consent (checkbox on the form, unchecked by default). Boolean for GHL; texts go only to sms_consent === true.
    sms_consent: d.sms_consent === true || d.sms_consent === 'true',
    sms_consent_at: d.sms_consent === true || d.sms_consent === 'true' ? String(d.sms_consent_at || new Date().toISOString()) : '',
    sms_consent_text: String(d.sms_consent_text || '').slice(0, 600),
    sms_consent_source: d.page || 'event.orderofkings.org',
    tags: ['designed-backwards', 'designed-backwards-ga'].concat(d.sms_consent === true || d.sms_consent === 'true' ? ['sms-opt-in'] : []),
    event: 'Designed Backwards',
    source: 'event.orderofkings.org',
    utm_source: d.utm_source || '', utm_medium: d.utm_medium || '', utm_campaign: d.utm_campaign || '',
    utm_content: d.utm_content || '', utm_term: d.utm_term || '', fbclid: d.fbclid || '',
    page: d.page || '', timezone: String(d.timezone || '').slice(0, 60), registered_at: d.registered_at || new Date().toISOString(), ph_id: d.ph_id || '',
  };

  // Up to 3 attempts (0s, 0.7s, 2s back-off), each capped at 4s, so a GHL blip doesn't drop the lead.
  const delays = [0, 700, 2000];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await new Promise(r => setTimeout(r, delays[i]));
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(4000) });
      if (r.ok) return { statusCode: 200, body: 'ok' };
      console.error(`register: GHL responded ${r.status} (attempt ${i + 1})`, (await r.text()).slice(0, 300));
      if (r.status >= 400 && r.status < 500 && r.status !== 429) break; // bad request: retrying won't help
    } catch (e) {
      console.error(`register: forward failed (attempt ${i + 1})`, e.message);
    }
  }
  // Lead is still safe in Netlify Forms; the page logs ghl_forward_failed to PostHog.
  console.error('register: GIVING UP forwarding to GHL for', payload.email);
  return { statusCode: 502, body: 'upstream error' };
};
