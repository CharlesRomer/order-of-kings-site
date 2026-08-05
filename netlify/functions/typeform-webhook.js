const https = require('https');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Extract the ph_id hidden field from the Typeform submission.
  // Typeform sends hidden fields under form_response.hidden.
  const hidden = (payload.form_response && payload.form_response.hidden) || {};
  const distinctId = hidden.ph_id;

  if (!distinctId) {
    // No identity to link — still return 200 so Typeform doesn't retry
    console.warn('typeform-webhook: no ph_id in payload');
    return { statusCode: 200, body: 'ok (no ph_id)' };
  }

  // Pull any useful answer fields for richer PostHog properties
  const answers = (payload.form_response && payload.form_response.answers) || [];
  const props = { source: 'typeform_webhook' };
  answers.forEach(function (a) {
    const key = a.field && a.field.ref ? a.field.ref : a.field && a.field.id;
    if (!key) return;
    props['tf_' + key] = a.text || a.email || a.phone_number || a.url ||
      (a.choice && a.choice.label) || (a.number != null ? a.number : null);
  });

  const body = JSON.stringify({
    api_key: process.env.POSTHOG_KEY,
    event: 'typeform_application_complete',
    distinct_id: distinctId,
    properties: props
  });

  await new Promise(function (resolve, reject) {
    const req = https.request(
      {
        hostname: 'us.i.posthog.com',
        path: '/capture/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      function (res) {
        res.resume();
        res.on('end', resolve);
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  return { statusCode: 200, body: 'ok' };
};
