// Forwards a Designed Backwards registration to a GoHighLevel inbound webhook.
// Set GHL_EVENT_WEBHOOK_URL in this Netlify site's environment variables.
// (Netlify Forms also keeps a copy of every registration, so nothing is lost if this isn't set yet.)
//
// Registrations are also sent to Meta's Conversions API (server side) when META_CAPI_TOKEN is set,
// with the same event_id as the browser pixel so Meta deduplicates the pair. Meta errors never block
// or fail a registration. Optional: META_TEST_EVENT_CODE (Events Manager -> Test events) while testing.

const crypto = require('crypto');
const META_DATASET_ID = '1624105552195579';
const sha256 = v => crypto.createHash('sha256').update(v).digest('hex');

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

  // Registrations go to GHL and Meta CAPI at the same time; the response reflects GHL only.
  const [ghlStatus] = await Promise.all([
    forwardToGhl(payload),
    isEvent ? Promise.resolve() : sendMetaRegistration(d, event.headers || {}),
  ]);
  if (ghlStatus === 'ok') return { statusCode: 200, body: 'ok' };
  if (ghlStatus === 'no-webhook') return { statusCode: 202, body: 'stored (no webhook configured)' };
  // Lead is still safe in Netlify Forms; the page logs ghl_forward_failed to PostHog.
  return { statusCode: 502, body: 'upstream error' };
};

async function forwardToGhl(payload) {
  const url = process.env.GHL_EVENT_WEBHOOK_URL;
  if (!url) { console.warn('register: GHL_EVENT_WEBHOOK_URL not set, skipping forward for', payload.email); return 'no-webhook'; }
  // Up to 3 attempts (0s, 0.5s, 1.2s back-off), each capped at 2.5s, so a GHL blip doesn't drop the lead
  // and the whole function stays inside Netlify's ~10s limit.
  const delays = [0, 500, 1200];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await new Promise(r => setTimeout(r, delays[i]));
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(2500) });
      if (r.ok) return 'ok';
      console.error(`register: GHL responded ${r.status} (attempt ${i + 1})`, (await r.text()).slice(0, 300));
      if (r.status >= 400 && r.status < 500 && r.status !== 429) break; // bad request: retrying won't help
    } catch (e) {
      console.error(`register: forward failed (attempt ${i + 1})`, e.message);
    }
  }
  console.error('register: GIVING UP forwarding to GHL for', payload.email);
  return 'failed';
}

async function sendMetaRegistration(d, headers) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;                                                   // not configured yet
  if (d.internal === true || d.internal === 'true') return;            // team/test browser (?internal=1)
  if (!d.meta_event_id) return;                                         // no shared ID -> can't deduplicate
  try {
    const h = k => headers[k] || headers[k.toLowerCase()] || '';
    const email = String(d.email || '').trim().toLowerCase();
    const phone = String(d.phone || '').replace(/\D/g, '');            // digits only, incl. country code, no +
    const fn = String(d.first_name || '').trim().toLowerCase();
    const ln = String(d.last_name || '').trim().toLowerCase();
    const user_data = {
      client_ip_address: h('x-nf-client-connection-ip') || String(h('x-forwarded-for')).split(',')[0].trim() || undefined,
      client_user_agent: h('user-agent') || undefined,
    };
    if (email) user_data.em = [sha256(email)];
    if (phone) user_data.ph = [sha256(phone)];
    if (fn) user_data.fn = [sha256(fn)];
    if (ln) user_data.ln = [sha256(ln)];
    if (d.fbp) user_data.fbp = String(d.fbp);
    if (d.fbc) user_data.fbc = String(d.fbc);
    const body = {
      data: [{
        event_name: 'CompleteRegistration',
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(d.meta_event_id).slice(0, 100),
        action_source: 'website',
        event_source_url: String(d.page || 'https://event.orderofkings.org/').slice(0, 1000),
        user_data,
        custom_data: { content_name: 'designed_backwards' },
      }],
    };
    if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;
    const r = await fetch(`https://graph.facebook.com/v21.0/${META_DATASET_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(4000),
    });
    const text = await r.text();
    if (r.ok) console.log('register: Meta CAPI', r.status, text.slice(0, 200));     // expect {"events_received":1,...}
    else console.error('register: Meta CAPI error', r.status, text.slice(0, 400));
  } catch (e) {
    console.error('register: Meta CAPI failed', e.message);
  }
}
