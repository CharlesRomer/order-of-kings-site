// Returns the visitor's country (ISO-2) from Netlify's own IP geolocation, so the phone field
// can preselect the right country code. No third-party IP service, nothing stored.
exports.handler = async function (event) {
  const h = event.headers || {};
  let country = (h['x-country'] || '').trim();
  if (!country && h['x-nf-geo']) {
    try { country = (JSON.parse(Buffer.from(h['x-nf-geo'], 'base64').toString('utf8')).country || {}).code || ''; } catch (e) {}
  }
  country = /^[A-Za-z]{2}$/.test(country) ? country.toLowerCase() : '';
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    body: JSON.stringify({ country }),
  };
};
