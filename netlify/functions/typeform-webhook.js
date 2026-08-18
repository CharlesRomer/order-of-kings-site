const https = require('https');

function postToPostHog(body) {
  return new Promise(function (resolve, reject) {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: 'us.i.posthog.com',
        path: '/capture/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      function (res) {
        let responseBody = '';
        res.on('data', function (chunk) { responseBody += chunk; });
        res.on('end', function () { resolve({ status: res.statusCode, body: responseBody }); });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

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

  const hidden = (payload.form_response && payload.form_response.hidden) || {};
  const distinctId = hidden.ph_id;
  const copyVariant = hidden.copy_variant || null;
  const vslVariant = hidden.vsl_variant || null;

  if (!distinctId) {
    console.warn('typeform-webhook: no ph_id — aborting');
    return { statusCode: 200, body: 'ok (no ph_id)' };
  }

  // Extract answers — find email specifically for person identification
  const answers = (payload.form_response && payload.form_response.answers) || [];
  const props = {
    source: 'typeform_webhook',
    $current_url: 'https://orderofkings.org/',
    $host: 'orderofkings.org'
  };

  if (copyVariant) props.copy_variant = copyVariant;
  if (vslVariant) props.vsl_variant = vslVariant;

  let applicantEmail = null;

  answers.forEach(function (a) {
    const key = a.field && a.field.ref ? a.field.ref : a.field && a.field.id;
    if (!key) return;
    const value = a.text || a.email || a.phone_number || a.url ||
      (a.choice && a.choice.label) || (a.number != null ? a.number : null);
    props['tf_' + key] = value;
    // Capture email from email-type fields
    if (a.type === 'email' && a.email) applicantEmail = a.email;
  });

  // Fire the application event
  const captureResult = await postToPostHog({
    api_key: process.env.POSTHOG_KEY,
    event: 'typeform_application_complete',
    distinct_id: distinctId,
    properties: props
  });
  console.log('typeform-webhook: capture responded', captureResult.status, captureResult.body);

  // Identify the person with their email so PostHog links the ID to a real person
  if (applicantEmail) {
    const identifyResult = await postToPostHog({
      api_key: process.env.POSTHOG_KEY,
      event: '$identify',
      distinct_id: distinctId,
      properties: {
        $set: { email: applicantEmail }
      }
    });
    console.log('typeform-webhook: identify responded', identifyResult.status, identifyResult.body);
  }

  return { statusCode: 200, body: 'ok' };
};
