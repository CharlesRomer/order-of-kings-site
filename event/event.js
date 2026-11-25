// =====================================================================
// DESIGNED BACKWARDS — event funnel (event.orderofkings.org)
// Everything you might need to change lives in EVENT_CONFIG below.
// =====================================================================

window.EVENT_CONFIG = {
  name: 'Designed Backwards',

  // Session start times. Always write them with the Pacific offset (-08:00 in December).
  // 10:00 AM Pacific both days. Every visitor sees these converted to their own time zone.
  day1Start: '2026-12-08T10:00:00-08:00',
  day2Start: '2026-12-09T10:00:00-08:00',
  sessionMinutes: 90,
  vipMinutesBefore: 60, // the VIP hour starts this many minutes before each main session

  // $47 VIP checkout. Paste a Stripe Payment Link (or GHL order-form URL) here.
  // In Stripe, set the "after payment" redirect to: https://event.orderofkings.org/confirmed?vip=1
  vipCheckoutUrl: '',
  vipPrice: 47,

  // Optional Wistia media IDs. Leave blank to show Dan's photo instead of a video.
  regVslWistiaId: 'poaqbg8ztn',      // 5–6 min registration-page VSL
  vipVslWistiaId: 'z1k9c9gqav',      // 4–5 min VIP upsell VSL
  confirmWistiaId: '',     // short "you're in, here's what to do" video

  // Scorecard link (Typeform / GHL survey). Leave blank to show "arriving by email".
  scorecardUrl: '',

  // Where the Zoom/webinar link will be sent from, shown on the confirmation page.
  supportEmail: 'support@orderofkings.org', // TODO(Charles): confirm

  // Confirmation-page call funnel. Off by default: the webinar doc says no pitch until Day 2.
  showApplySection: false,
  applyUrl: 'https://orderofkings.org/#apply',
};

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
(function () {
  const C = window.EVENT_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const track = (name, props) => { try { window.posthog && posthog.capture(name, Object.assign({ event_name: 'designed_backwards' }, props || {})); } catch (e) {} };
  window.ebTrack = track;

  const day1 = new Date(C.day1Start);
  const day2 = new Date(C.day2Start);
  const addMin = (d, m) => new Date(d.getTime() + m * 60000);

  // ── Date/time text ──
  const fmt = (d, opts, tz) => d.toLocaleString('en-US', Object.assign({ timeZone: tz }, opts));
  const timeShort = (d, tz) => fmt(d, { hour: 'numeric', minute: '2-digit' }, tz).replace(':00', '');
  const ptEt = (d) => `${timeShort(d, 'America/Los_Angeles')} PT / ${timeShort(d, 'America/New_York')} ET`;
  // Visitor's own time zone (from their device). Every date and time on the page is shown in it,
  // with the Pacific time alongside so it matches emails, texts and what Dan says live.
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  const tzAbbr = d => { const a = fmt(d, { timeZoneName: 'short' }, localTz).split(' ').pop(); return /^(GMT|UTC)[+-]/.test(a) ? 'your time' : a; };
  const tzLong = (new Intl.DateTimeFormat('en-US', { timeZone: localTz, timeZoneName: 'long' }).formatToParts(day1).find(x => x.type === 'timeZoneName') || {}).value || localTz;
  const sameAsPacific = timeShort(day1, localTz) === timeShort(day1, 'America/Los_Angeles') && fmt(day1, { day: 'numeric' }, localTz) === fmt(day1, { day: 'numeric' }, 'America/Los_Angeles');
  const smartTime = d => sameAsPacific ? `${timeShort(d, 'America/Los_Angeles')} PT` : `${timeShort(d, localTz)} ${tzAbbr(d)} (${timeShort(d, 'America/Los_Angeles')} PT)`;
  const day = (d, o) => fmt(d, o, localTz);
  const sameMonth = day(day1, { month: 'long' }) === day(day2, { month: 'long' });

  const fills = {
    'day1-date': day(day1, { weekday: 'long', month: 'long', day: 'numeric' }),
    'day2-date': day(day2, { weekday: 'long', month: 'long', day: 'numeric' }),
    'day1-short': day(day1, { weekday: 'short', month: 'short', day: 'numeric' }),
    'day2-short': day(day2, { weekday: 'short', month: 'short', day: 'numeric' }),
    'dates-long': sameMonth ? `${day(day1, { month: 'long', day: 'numeric' })} & ${day(day2, { day: 'numeric' })}` : `${day(day1, { month: 'long', day: 'numeric' })} & ${day(day2, { month: 'long', day: 'numeric' })}`,
    'dates-short': sameMonth ? `${day(day1, { month: 'short', day: 'numeric' })} & ${day(day2, { day: 'numeric' })}` : `${day(day1, { month: 'short', day: 'numeric' })} & ${day(day2, { month: 'short', day: 'numeric' })}`,
    'session-time': smartTime(day1),
    'vip-time': smartTime(addMin(day1, -C.vipMinutesBefore)),
    'pt-time': ptEt(day1),
    'local-time': `${timeShort(day1, localTz)} ${tzAbbr(day1)}`,
    'tz-name': sameAsPacific ? 'Pacific Time' : tzLong,
    'vip-price': `$${C.vipPrice}`,
    'support-email': C.supportEmail,
  };
  $$('[data-fill]').forEach(el => { const v = fills[el.dataset.fill]; if (v) el.textContent = v; });
  $$('a[data-support-link]').forEach(a => { a.href = 'mailto:' + C.supportEmail; });

  // ── Countdowns (any number on the page): "14d 03h 44m 12s" ──
  const cds = $$('[data-countdown]');
  if (cds.length) {
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const now = Date.now();
      let target = day1, txt = 'Day 1 starts in';
      if (now >= day1.getTime() && now < day2.getTime()) { target = day2; txt = 'Day 2 starts in'; }
      if (now >= addMin(day2, C.sessionMinutes).getTime()) { cds.forEach(c => c.setAttribute('hidden', '')); return; }
      let s = Math.max(0, Math.floor((target.getTime() - now) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      const out = (d ? `${d}d ` : '') + `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
      cds.forEach(c => { $('[data-cd-label]', c).textContent = txt; $('[data-cd-text]', c).textContent = out; });
    };
    tick(); setInterval(tick, 1000);
  }

  // ── Video slots: show Dan's photo until a Wistia ID is set in EVENT_CONFIG ──
  $$('[data-media]').forEach(card => {
    const id = C[card.dataset.media];
    if (!id) return;
    if (!document.querySelector('script[src="https://fast.wistia.com/player.js"]')) {
      const s = document.createElement('script'); s.src = 'https://fast.wistia.com/player.js'; s.async = true; document.head.appendChild(s);
    }
    const s2 = document.createElement('script'); s2.src = `https://fast.wistia.com/embed/${id}.js`; s2.async = true; s2.type = 'module'; document.head.appendChild(s2);
    const wrap = $('.video-frame, .vsl-video-wrap', card);
    wrap.innerHTML = `<wistia-player media-id="${id}" aspect="1.7777777777777777"></wistia-player>`;
    if (!document.getElementById('wistia-swatch-' + id)) {
      const st = document.createElement('style'); st.id = 'wistia-swatch-' + id;
      st.textContent = `wistia-player[media-id='${id}']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${id}/swatch'); display: block; filter: blur(5px); padding-top: 56.25%; }`;
      document.head.appendChild(st);
    }
    wrap.classList.add('has-video');
    card.classList.add('has-video');
    card.removeAttribute('hidden');
    customElements.whenDefined('wistia-player').then(() => {
      const p = $('wistia-player', card); if (!p) return;
      const fired = {};
      p.addEventListener('play', () => { if (!fired.play) { fired.play = 1; track('video_play', { video: card.dataset.media }); } });
      p.addEventListener('ended', () => track('video_ended', { video: card.dataset.media }));
    });
  });

  // ── FAQ (native <details>) ──
  $$('.faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) track('faq_opened', { question: $('summary', d).textContent.trim() }); }));

  // ── Fade-up on scroll (same behaviour as the main site) ──
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.fade-up').forEach(el => io.observe(el));

  // ── Nav background on scroll ──
  const nav = $('#nav');
  if (nav && !nav.classList.contains('scrolled')) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60), { passive: true });

  // ── Mobile sticky CTA: appears once the form has scrolled off the top ──
  const mCta = $('#mCta'), regEl = $('#register');
  if (mCta && regEl) new IntersectionObserver(es => { const e = es[0]; mCta.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0); }).observe(regEl);

  // ── "Save my seat" buttons scroll to the form and focus it ──
  $$('[data-to-form]').forEach(a => a.addEventListener('click', e => {
    const box = $('#register');
    if (!box) return;
    e.preventDefault();
    track('cta_clicked', { location: a.dataset.toForm });
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => $('input[name="first_name"]', box)?.focus({ preventScroll: true }), 650);
  }));

  // ── Registration form ──
  const form = $('#register-form');
  if (form) {
    let started = false;
    form.addEventListener('input', () => { if (!started) { started = true; track('reg_form_started'); } });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form);
      const err = $('.form-error', form);
      err.textContent = '';
      const data = Object.fromEntries(new FormData(form).entries());
      data.first_name = (data.first_name || '').trim();
      data.email = (data.email || '').trim().toLowerCase();
      data.phone = (data.phone || '').trim();
      if (!data.first_name || !/^\S+@\S+\.\S+$/.test(data.email) || data.phone.replace(/\D/g, '').length < 7) {
        err.textContent = 'Please add your first name, a valid email and a mobile number.';
        return;
      }

      // Attribution
      const qs = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach(k => { if (qs.get(k)) data[k] = qs.get(k); });
      data.page = location.href;
      data.timezone = localTz;
      data.registered_at = new Date().toISOString();
      try { data.ph_id = window.posthog && posthog.get_distinct_id ? posthog.get_distinct_id() : ''; } catch (e) {}

      btn.disabled = true; btn.classList.add('loading');

      // 1) Netlify Forms: always-on backup copy of every registration
      const nf = new URLSearchParams(Object.assign({ 'form-name': 'registration' }, data)).toString();
      const backup = fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: nf }).catch(() => null);
      // 2) Forward to GoHighLevel (tags, reminders, SMS) through the Netlify function
      const ghl = fetch('/.netlify/functions/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => null);

      const [b, g] = await Promise.all([backup, ghl]);
      const savedBackup = !!(b && b.ok), sentToGhl = !!(g && g.status === 200);
      if (!savedBackup && !sentToGhl) {
        btn.disabled = false; btn.classList.remove('loading');
        err.textContent = "We couldn't save your seat. Please try again, or email " + C.supportEmail + '.';
        track('reg_failed');
        return;
      }

      try {
        posthog.identify(data.email, { email: data.email, first_name: data.first_name, phone: data.phone });
      } catch (e) {}
      // If GHL didn't take it (after the function's retries), the lead is still in Netlify Forms. Flag it so it can be re-sent.
      if (!sentToGhl) track('ghl_forward_failed', { email: data.email });
      track('event_registered', { ghl: sentToGhl, utm_source: data.utm_source || null, utm_campaign: data.utm_campaign || null });
      try { window.fbq && fbq('track', 'CompleteRegistration'); } catch (e) {}

      sessionStorage.setItem('eb_reg', JSON.stringify({ first_name: data.first_name, email: data.email }));
      location.href = 'vip?' + new URLSearchParams({ name: data.first_name, email: data.email }).toString();
    });
  }

  // ── VIP upsell ──
  const reg = (() => {
    const qs = new URLSearchParams(location.search);
    let s = {}; try { s = JSON.parse(sessionStorage.getItem('eb_reg') || '{}'); } catch (e) {}
    return { first_name: qs.get('name') || s.first_name || '', email: qs.get('email') || s.email || '' };
  })();
  $$('[data-fill="first-name"]').forEach(el => { if (reg.first_name) el.textContent = reg.first_name; else el.closest('[data-hide-if-no-name]')?.remove(); });

  $$('[data-vip-buy]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      track('vip_checkout_clicked', { location: a.dataset.vipBuy });
      if (!C.vipCheckoutUrl) { alert('VIP checkout link not set yet (EVENT_CONFIG.vipCheckoutUrl).'); return; }
      const u = new URL(C.vipCheckoutUrl);
      if (reg.email && /stripe\.com/.test(u.host)) u.searchParams.set('prefilled_email', reg.email);
      let phId = ''; try { phId = (window.posthog && posthog.get_distinct_id && posthog.get_distinct_id()) || ''; } catch (e) {}
      if (phId && /stripe\.com/.test(u.host)) u.searchParams.set('client_reference_id', String(phId).replace(/[^\w-]/g, '').slice(0, 200));
      location.href = u.toString();
    });
  });
  $$('[data-vip-decline]').forEach(a => a.addEventListener('click', () => track('vip_declined')));
  if (document.body.dataset.page === 'vip') track('vip_offer_viewed');

  // ── Confirmation page ──
  if (document.body.dataset.page === 'confirmed') {
    const isVip = new URLSearchParams(location.search).get('vip') === '1' || sessionStorage.getItem('eb_vip') === '1';
    if (isVip) { sessionStorage.setItem('eb_vip', '1'); document.body.classList.add('is-vip'); }
    track('confirmation_viewed', { vip: isVip });
    if (isVip) { try { posthog.capture('vip_purchased', { event_name: 'designed_backwards', value: C.vipPrice }); window.fbq && fbq('track', 'Purchase', { value: C.vipPrice, currency: 'USD' }); } catch (e) {} }

    // Calendar links
    const gcal = (title, start, mins, details) => {
      const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${f(start)}/${f(addMin(start, mins))}`, details }).toString();
    };
    const details = 'Live workshop with Dan Romer. Your join link comes by email and text before we go live.\n\nTake the scorecard before Day 1. Bring your wife on Day 2.';
    const events = [
      { key: 'day1', title: 'Designed Backwards: Day 1 (live with Dan Romer)', start: day1, mins: C.sessionMinutes },
      { key: 'day2', title: 'Designed Backwards: Day 2 (bring your wife)', start: day2, mins: C.sessionMinutes },
    ];
    if (isVip) {
      events.push({ key: 'vip1', title: 'Designed Backwards: VIP hour with Dan (Day 1)', start: addMin(day1, -C.vipMinutesBefore), mins: C.vipMinutesBefore });
      events.push({ key: 'vip2', title: 'Designed Backwards: VIP hour with Dan (Day 2)', start: addMin(day2, -C.vipMinutesBefore), mins: C.vipMinutesBefore });
    }
    events.forEach(ev => {
      const a = $(`[data-gcal="${ev.key}"]`);
      if (a) { a.href = gcal(ev.title, ev.start, ev.mins, details); a.addEventListener('click', () => track('calendar_added', { which: ev.key, kind: 'google' })); }
    });
    const ics = $('[data-ics]');
    if (ics) {
      const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Order of Kings//Designed Backwards//EN']
        .concat(...events.map((ev, i) => ['BEGIN:VEVENT', `UID:designed-backwards-${ev.key}@orderofkings.org`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ev.start)}`, `DTEND:${f(addMin(ev.start, ev.mins))}`, `SUMMARY:${ev.title}`, `DESCRIPTION:${details.replace(/\n/g, '\\n')}`, 'END:VEVENT']))
        .concat('END:VCALENDAR').join('\r\n');
      ics.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
      ics.download = 'designed-backwards.ics';
      ics.addEventListener('click', () => track('calendar_added', { kind: 'ics' }));
    }

    const sc = $('[data-scorecard]');
    if (sc) {
      if (C.scorecardUrl) { sc.href = C.scorecardUrl; sc.addEventListener('click', () => track('scorecard_clicked')); }
      else { const n = Object.assign(document.createElement('p'), { textContent: 'Your scorecard link is on its way to your inbox.' }); n.style.cssText = 'font-size:14px;color:var(--white-60);margin-top:12px'; sc.replaceWith(n); }
    }

    // Share with wife
    const share = $('[data-share-wife]');
    if (share) share.addEventListener('click', async () => {
      const text = `I signed us up for Designed Backwards, a free 2-day live workshop with Dan Romer. Day 2 is ${fills['day2-date']} at ${fills['session-time']}. I'd love for you to be there with me.`;
      const url = location.origin + '/';
      track('share_wife_clicked');
      if (navigator.share) { try { await navigator.share({ title: 'Designed Backwards', text, url }); } catch (e) {} }
      else { location.href = `sms:&body=${encodeURIComponent(text + ' ' + url)}`; }
    });

    if (C.showApplySection) $('[data-apply-section]')?.removeAttribute('hidden');
    $$('[data-apply-link]').forEach(a => { a.href = C.applyUrl; a.addEventListener('click', () => track('apply_clicked_from_event')); });
  }
})();
