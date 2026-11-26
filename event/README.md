# Designed Backwards: event funnel (event.orderofkings.org)

A self-contained static funnel for the free 2-day live workshop.

| Page | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Registration page (free GA) |
| `vip.html` | `/vip` | $47 VIP upsell (shown right after registering) |
| `confirmed.html` | `/confirmed` (`?vip=1` after purchase) | Confirmation: calendar, scorecard, bring your wife |

**Everything editable lives at the top of `event.js` (`EVENT_CONFIG`)**: dates/times, VIP checkout link, Wistia IDs, scorecard link, support email.

## How data flows
1. The registration form posts to **Netlify Forms** (backup copy, visible in Netlify → Forms) **and** to `/.netlify/functions/register`,
   which forwards to GoHighLevel when the `GHL_EVENT_WEBHOOK_URL` env var is set.
2. The visitor goes to `/vip`. "Yes" opens `EVENT_CONFIG.vipCheckoutUrl` (Stripe Payment Link / GHL order form) with the email prefilled.
   Set its after-payment redirect to `https://event.orderofkings.org/confirmed?vip=1`.
3. "No thanks" goes to `/confirmed`.

PostHog (same project as orderofkings.org; every custom event carries `event_name = designed_backwards`, and pageviews can be filtered by `$host = event.orderofkings.org`): `reg_form_started`, `event_registered`, `vip_offer_viewed`,
`vip_checkout_clicked`, `vip_declined`, `confirmation_viewed`, `vip_purchased`, `calendar_added`, `scorecard_clicked`, `share_wife_clicked`, `cta_clicked`, `faq_opened`, and `ghl_forward_failed` (lead is in Netlify Forms but did not reach GHL after 3 tries; re-send it).

## Deploy
This folder is deployed as a **separate Netlify site** from the same repo, with Base directory = `event`.
The main orderofkings.org site is untouched.

## Calendar files
`designed-backwards.ics` (both days) and `designed-backwards-vip.ics` (both days + VIP hours) are static files with fixed UTC times
(10:00 AM PT = 18:00 UTC; VIP 17:00 UTC). If the start time changes, update `day1Start`/`day2Start` in `event.js` **and** regenerate these two files.
