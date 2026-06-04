# Atlas Automation — Missed-Call Text-Back · Public Demo

A **prospect-viewable static demo** of Atlas Automation's missed-call text-back service for
Peterborough / Kawartha trades (plumbers, HVAC, electricians).

A cold prospect can open this link on their own phone or laptop **before** a live call and:

1. See the missed-call scenario for their trade.
2. Play with a phone-style SMS conversation simulator.
3. Watch a lead dashboard fill in live as they click through.
4. Read a transparent "what happens in a live pilot" section.
5. Book a 10-minute demo with Emeka / Atlas Automation.

It is **100% static** — HTML/CSS/JS only. No backend, no database, no secrets, no paid APIs,
no tracking, no real customer data. Everything runs in the browser with sample data.

The conversation engine here mirrors the real Node MVP at
`/Users/emeka/atlas-portfolio/missed-call-mvp` (same greeting → issue → name → time → confirm
flow), so what a prospect tries here is what the live service actually does.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing page + interactive demo (single page). |
| `styles.css` | Modern, responsive styling. |
| `app.js` | Demo controller: conversation engine, live dashboard, CTA wiring. |
| `personalize.js` | Pure helper for `?business=` personalization (shared by page + test). |
| `test/smoke-test.js` | Zero-dependency Node smoke test (DOM/text + functional personalization). |
| `package.json` | `npm test` and `npm run serve` helpers (no dependencies to install). |

---

## Open it locally

It's static, so you have two easy options.

**Option A — just double-click**
Open `index.html` in any browser. The `mailto:` CTAs and personalization both work from
`file://`. (Some browsers are stricter about `file://` query params; if personalization looks
off, use Option B.)

**Option B — tiny local server (recommended, no installs)**
```bash
cd /Users/emeka/AtlasRevenue/public-demo
npm run serve
# → http://localhost:8080/
# personalized: http://localhost:8080/?business=Acme%20Plumbing
```
`npm run serve` uses only Node's built-in `http` module — nothing to `npm install`.

---

## Personalization (for outreach links)

Add `?business=` to the URL and the prospect sees their own name in the hero, the demo, the SMS
sender, and the CTA:

```
https://YOUR-HOST/?business=Mike%27s%20Plumbing
https://YOUR-HOST/?business=Kawartha%20Heating%20%26%20Cooling
```

Rules of thumb for encoding in a link:
- Space → `%20`
- `&` → `%26`
- `'` → `%27`

Input is trimmed and capped at 60 characters, and always rendered as plain text (XSS-safe).
With no param it falls back to neutral wording ("your business").

---

## Set your real contact (one edit)

The "Book a 10-min demo" buttons open the prospect's mail app pre-filled. Point them at your
real inbox by editing the top of **`app.js`**:

```js
var CONFIG = {
  contactEmail: 'atlas-autonomous-agent@proton.me',  // ← change to your real booking inbox
  contactName: 'Emeka',
  company: 'Atlas Automation',
};
```

If you use a calendar link (Calendly/Cal.com), you can also point the `#book-email` button's
`href` at that URL instead of the mailto in `app.js`.

---

## Host it (pick one)

### GitHub Pages
```bash
cd /Users/emeka/AtlasRevenue/public-demo
git init
git add .
git commit -m "Atlas missed-call public demo"
# create an empty repo on GitHub first, then:
git remote add origin https://github.com/<you>/atlas-missed-call-demo.git
git branch -M main
git push -u origin main
```
Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch: `main` / `/ (root)` → Save.**
Your link: `https://<you>.github.io/atlas-missed-call-demo/?business=Acme%20Plumbing`

### Vercel
```bash
npm i -g vercel        # one time
cd /Users/emeka/AtlasRevenue/public-demo
vercel                 # accept defaults; it auto-detects a static site
vercel --prod          # promote to production
```
No build step or framework needed — it's a static folder. Vercel gives you a
`https://<project>.vercel.app/` URL; append `?business=...` per prospect.

### Netlify (drag-and-drop)
Go to <https://app.netlify.com/drop> and drag the `public-demo` folder onto the page. Done.

> Not deployed automatically by this build — deploy when you're ready.

---

## Test it

```bash
cd /Users/emeka/AtlasRevenue/public-demo
npm test          # or: node test/smoke-test.js
```

The smoke test is Playwright-free and has **no dependencies**. It checks:
- all required files exist;
- every DOM hook the demo relies on is present in `index.html`;
- the demo / pilot / book sections exist;
- conversion copy + tone (e.g. the hero doesn't lead with scary "AI" language);
- the conversation-engine copy matches the real MVP;
- **functional** `?business=` personalization (it actually executes `personalize.js`).

Exit code `0` = all pass, `1` = failure (with a printed list).

---

## Exact email language for sending the demo link

Plain, benefit-first, no hard sell. Replace `[Business]`, the link, and your sign-off.
**Send these yourself — this project does not send any email.**

### Email A — cold, observation-led
> **Subject:** quick thing for [Business] when you can't get to the phone
>
> Hi [First name],
>
> I build simple tools for Peterborough-area trades. Quick, non-salesy one: when a call comes
> in while you're on a job, what usually happens to that lead?
>
> I put together a 60-second interactive demo you can poke at on your own — it shows how a
> missed call can text the customer back in your name and book the job, with every lead landing
> in one simple view. I even dropped [Business]'s name on it:
>
> **https://YOUR-HOST/?business=[URL-encoded Business name]**
>
> No sign-up, nothing to install — just tap "Simulate missed call" and reply like a customer.
> If it looks useful, I'll run it live with you in 10 minutes. If not, no worries at all.
>
> — Emeka, Atlas Automation (Kawarthas)

### Email B — shorter follow-up / DM style
> Hi [First name] — made you a quick demo of the missed-call text-back idea, with [Business] on
> it: **https://YOUR-HOST/?business=[encoded name]**. Tap "Simulate missed call" and reply like
> a customer — you'll see the lead fill in live. Worth a 10-min call to see it with your real
> setup? — Emeka

### Email C — referral / warm
> Hi [First name], [Referrer] thought this might fit how [Business] handles calls during busy
> season. It's a 1-minute interactive demo (no sign-up) of automatic text-back on missed calls,
> personalized to you: **https://YOUR-HOST/?business=[encoded name]**. If the flow feels right,
> grab a 10-minute slot with me and I'll show it live. — Emeka, Atlas Automation

---

## Guardrails honoured in this build

- Static only — no backend, no secrets, no paid APIs, no accounts created, nothing deployed.
- Honest framing: the "live pilot" section openly states a trusted communications provider is
  wired in for real texts, and that this is the **intake** slice (no payments/calendar yet).
- Leads in the dashboard are clearly sample data; no real customer info is collected.
- You stay in control: every flow is approved by you before going live.
