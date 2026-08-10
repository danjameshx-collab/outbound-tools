# Strategy Doc — Whale Campaign Builder

Complete internal reference documentation for `strategy-doc.html`, a single-page HTML/CSS/JS web app in the "Outreach Tools" suite (sibling tools: `physical-goods.html`, `swipe-desk.html`, `vsl-loom.html`, all reachable via the "&larr; Outreach Tools" back-link to `index.html`).

---

## 1. Overview

**What it is:** A self-contained, client-side (no backend) tool that takes a handful of inputs about a "prospect" (the agency/company doing the outreach) and a "whale" (their dream target account), and generates a complete, polished, client-facing **strategy document** — the kind an agency like Lincko would send to a prospective client to sell them on running an 85-day, 5-touchpoint, 29-touch outbound campaign aimed at landing one specific whale account.

**Purpose:** It is simultaneously:
1. A **sales artifact generator** — the actual document text/HTML that gets sent to a prospect to convince them to buy the campaign.
2. A **campaign planning tool** — it computes the full day-by-day touch schedule (29 touches across 5 mediums over 85 days) and lets the user check off touches as "done," tracking real campaign execution progress.

**The "D100" method (philosophy):** Explained directly in the setup step's intro card ("Why this works: the D100 method"):

> "D100 means doing real, upfront work for one dream prospect before you ever reach out — instead of spraying a template at a thousand of them. Whales get hit with 200+ pitches a week; their pattern-recognition for generic outreach is surgical. Specificity is the only thing that gets through."

> "The more specific you are here, the better every section below turns out — especially **Why We Reached Out** and **The Campaign**, which are built entirely from what you type into this form."

The whole app is an operationalization of this philosophy: instead of mass-templated outreach, it forces the user to input specific, researched details (what the prospect does, what the whale does/why it matters, and a specific "signal"/hook) and then weaves those details into every section of the generated document, so the final artifact reads as bespoke rather than generic. When fields are left blank, the copy templates fall back to generic phrasing (see §6) — the tool is explicitly self-aware that skipping the specificity step produces weaker copy, and says so in the UI (field hint under "The Specific Hook You've Found": *"Leave it blank and we'll write around it generically."*).

**Who it's for:** Agencies/freelancers/sales teams running high-touch, account-based outbound campaigns against a small number of large ("whale") target accounts, who want to (a) produce a polished sales document to pitch the campaign to their own client (the "prospect"), and (b) get a ready-made execution checklist/timeline for running it.

**Branding:** Signed "Prepared by Dan James · Lincko" throughout — this is Dan James's own agency (Lincko) tool, both selling the D100/Super Loom methodology and using this exact document as a demonstration of it (the About Me section is explicit: "I run Lincko, a creative outbound agency...").

---

## 2. App shell & navigation

### Page chrome
- `.site-topbar-accent` — a 4px solid `#231F2E` accent bar at the very top.
- `.site-topbar` — flex row: back link `&larr; Outreach Tools` (href `index.html`) on the left, centered `<h1>Strategy Doc</h1>`, and a "who" block on the right showing `Signed in as Dan` plus a `Sign out` button (both non-functional placeholders — no auth wired in this file).

### Layout grid (`#app`)
CSS grid: `grid-template-columns: var(--sidebar-w) 1fr` (`--sidebar-w: 372px`), two areas `"rail main"`.
- `nav#rail` — the sidebar (grid-area `rail`).
- `main#content-col` — main content area (grid-area `main`), contains the mobile topbar and `#content` (the actual scrollable pane).

### Sidebar (`nav#rail`) structure, top to bottom
1. **`.sidebar-logo`** — a stamp-colored 28×28 "SD" logo mark, "Strategy Doc" name, "Whale Campaign Builder" sub-label, plus a mobile-only "Close" button (`.rail-close-mobile`, hidden ≥980px).
2. **`.sidebar-progress`** — "Campaign progress" label with a live `id="progressLabel"` counter (format `n/29`, i.e. done touches / total touches) and a `.progress-bar` fill bar (`id="progressFill"`, width % driven by done/total).
3. **`.rail-scroll`** (scrollable middle section):
   - **`#navGroups`** — rendered by `renderNav()`: Step 1/Step 2 nav items (see below) plus, once step 2 is active and valid, an "In This Doc" table-of-contents group listing all 11 `DOC_SECTIONS` as jump-to buttons (`.toc-item`, numbered `01`–`11`).
   - **`.rail-divider`** — "Campaign Snapshot" eyebrow heading plus a "Clear" button (`id="clearBtn"`) that opens a confirm dialog to wipe all input + progress.
   - **`#snapBody`** — rendered by `renderSnapshot()`: read-only recap rows for Prospect / Whale Target / Contact (each with an "Edit →" link that jumps back to setup), plus, once valid, a "Campaign Length" row showing "85 days · 5 touchpoints · 29 total touches".
4. **`.sidebar-footer`** — a single full-width primary button, **"Copy Full Doc"** (`id="copyDocBtn"`), which copies the plain-text export (`docText()`) to the clipboard via `copyText()`.

### 2-step flow
`STEPS` array:
```js
const STEPS = [
  {id:'setup', num:1, label:'Target & Whale'},
  {id:'doc',   num:2, label:'Strategy Doc'},
];
```
- Step 1 (`setup`): the input form ("Who's The Whale?").
- Step 2 (`doc`): the generated strategy document.

Step items (`.step-item`) render with a circular step-number badge (`.step-num`) that becomes a green checkmark (✓) once step 1 is valid (`isValid()`), and the step-2 item gets class `.locked` (opacity .55, `cursor:not-allowed`) whenever `isValid()` is false. Clicking a locked step-2 item shows a toast: *"Fill in the prospect, whale, and contact name first"* rather than navigating.

### Table-of-contents jump nav
Only shown when `activeStep==='doc' && isValid()`. Each `.toc-item` button has `data-scroll` set to a section's DOM id (`sec-headline`, `sec-loom`, etc.) and on click calls `el.scrollIntoView({behavior:'smooth', block:'start'})`.

### Campaign snapshot panel
Built by `renderSnapshot()` — read-only mirror of the 3 required setup fields plus, once complete, a computed campaign-length summary row. Each populated row shows an "Edit →" link (`data-jump="setup"`) that calls `setActiveStep('setup')`.

### Progress tracking
`renderProgress()` computes `touchDoneCount()` (count of touch checkboxes marked done across all 5 campaigns) over `totalTouches()` (sum of all `campaign.touches` = 29) and updates the sidebar's `progressLabel` text and `progressFill` bar width.

### Mobile behavior
- Breakpoint **980px**: `#app` collapses to a single column (`grid-template-areas: "main"`); `nav#rail` becomes a fixed-position off-canvas drawer (`position:fixed; inset:0 auto 0 0; width:340px; max-width:88vw; z-index:50; transform:translateX(-100%)`) that slides in via `.open` class (`transform:translateX(0)` + drop shadow). A `.mobile-topbar` bar appears (hidden ≥980px) showing "Menu" button (`#railOpenBtn`), the current step eyebrow (`Step X of 2`) and step name.
- Breakpoint **640px**: `.field-grid` collapses to a single column; `#content` padding shrinks; `.page-header` padding/margins shrink; `.offer-two-way`, `.proof-ba`, `.tp-explain` all collapse to single column.
- Breakpoint **560px**: `.loom-thumb` shrinks to `flex-basis:120px`; `.about-wrap` stacks vertically.
- The campaign track visualization (`.campaign-track`) switches from a horizontal row to a vertical stacked list at 640px, with the connector arrow rotating from `\2192` (→) to `\2193` (↓).
- Opening the rail on mobile calls `.classList.add('open')`; navigating via `setActiveStep()` auto-closes the rail if `window.innerWidth <= 980`.

---

## 3. Setup step in full (`renderSetupStep()`)

**Page header:** eyebrow "Step 1 of 2", `<h1>Who's The Whale?</h1>`, sub-copy: *"Tell us who you're pitching and who they're trying to land. We'll build the rest of the strategy doc — and the full 85-day campaign — around it."*

### Intro card (`.setup-intro`) — the D100 explainer
Heading: **"Why this works: the D100 method"**. Body copy verbatim (see §1 above, reproduced there in full).

### Card 1 — "The Prospect"
Sub-copy: *"The company reading this doc — the one who wants to land a whale."*

| Field id | Label | Required? | Type | Placeholder |
|---|---|---|---|---|
| `f-prospect` | Company Name | **Required** (`*`) | text | `e.g. Frank Collective` |
| `f-contact` | Contact First Name | **Required** (`*`) | text | `e.g. Sarah` |
| `f-prospectWhat` | What They Do | optional | textarea | `One line - e.g. a design agency that builds brand systems for Series A/B SaaS companies` |

(First two fields are laid out side-by-side in `.field-grid` (2-col grid, collapses to 1-col ≤640px); the textarea is full width below.)

### Card 2 — "The Whale"
Sub-copy: *"The dream client they want to land — the account this whole doc is built around."*

| Field id | Label | Required? | Type | Placeholder |
|---|---|---|---|---|
| `f-whale` | Whale's Name | **Required** (`*`) | text | `e.g. Anthropic` |
| `f-whaleContact` | Who To Target There | optional | text | `e.g. Head of Partnerships, Jane Doe` |
| `f-whaleWhat` | What The Whale Does / Why They Matter | optional | textarea | `e.g. a frontier AI lab that would validate every future deal this prospect closes` |
| `f-signal` | The Specific Hook You've Found | optional | textarea | `e.g. their VP of Partnerships posted last week about wanting a creative agency who 'gets' technical audiences` |

Field hint under "The Specific Hook You've Found": *"This is the 'signal' layer of research — the one detail that becomes the hook for the Super Loom and every touch after it. Leave it blank and we'll write around it generically."*

### Card 3 — "Booking Link"
Sub-copy: *"Used for both 'banger offer' sections in the generated doc."*

| Field id | Label | Required? | Type | Placeholder |
|---|---|---|---|---|
| `f-calendly` | Your Calendly Link | optional | url | `https://calendly.com/...` |

### Actions
Single button: **"Generate Strategy Doc →"** (`#generateBtn`). On click: if `isValid()` is false, shows toast *"Company name, whale name, and contact name are required"* and auto-focuses whichever required field is empty (checks prospect → whale → contact, in that order). If valid, calls `setActiveStep('doc')`.

### Wiring (`wireSetupStep()`)
All 8 fields (`prospect, contact, prospectWhat, whale, whaleWhat, whaleContact, signal, calendly`) are bound with an `input` event listener that writes to the `input` state object, persists it (`persistInput()`), and re-renders both the snapshot panel and the nav (so the sidebar and lock-state stay live as you type — the doc step unlocks the instant the 3 required fields are filled, without needing to click Generate).

---

## 4. The generated document, section by section

The document is built by `renderDocStep()`, which concatenates 11 section-builder functions joined with `<hr class="doc-divider">`, wrapped in `.doc-shell` (max-width 740px). Page header for this step: eyebrow "Step 2 of 2", `<h1>{{prospect}} × {{whale}}</h1>`, sub *"Your generated strategy doc. Click a section on the left to jump to it, or scroll straight through."*, plus an "Edit Inputs" ghost button that returns to step 1.

### DOC_SECTIONS registry (drives TOC + numbering)
```js
const DOC_SECTIONS = [
  {id:'sec-headline',     n:1,  label:'Headline'},
  {id:'sec-loom',         n:2,  label:'Loom Video'},
  {id:'sec-why',          n:3,  label:'Why We Reached Out'},
  {id:'sec-toc',          n:4,  label:'Table Of Contents'},
  {id:'sec-proof',        n:5,  label:'Social Proof'},
  {id:'sec-offer1',       n:6,  label:'The Offer'},
  {id:'sec-problem',      n:7,  label:'The Problem'},
  {id:'sec-deliverables', n:8,  label:'The Campaign'},
  {id:'sec-faq',          n:9,  label:'FAQs'},
  {id:'sec-about',        n:10, label:'About Me'},
  {id:'sec-offer2',       n:11, label:"Let's Talk"},
];
```

### 4.1 — Headline (`secHeadline()`, section 1, no numbered label rendered)
```html
<div class="doc-hero" id="sec-headline">
  <span class="doc-kicker">Strategy Doc · Prepared For {{P()}}</span>
  <h1 class="doc-h1">How {{P()}} Lands {{W()}} - In Full.</h1>
  <p class="doc-sub">Not a pitch deck. The exact 5-touch campaign we'll build and run to get {{C()}} and the team at {{P()}} in front of {{W()}} - mapped out end to end, so you can see precisely how this works before you spend a dollar.</p>
  <p class="doc-meta">Prepared by Dan James · Lincko</p>
</div>
```
No numeric badge (`secLabel`) is used here — it's the hero, sitting above the numbered sections.

### 4.2 — Loom Video (`secLoom()`, section 2)
- Heading: "Watch This Before Anything Else"
- A mocked-up Loom video card (`.loom-card`) with a fake 02:14 duration, "Loom" source tag, title `Strategy Walkthrough for {{C()}} at {{P()}}`, and sub-copy: *"Recorded personally by Dan James, walking through exactly why {{W()}} is the right whale to chase and how the campaign below lands them."*
- A red "Don't Skip" banner: `⚠ Don't Skip The Video Above ⚠`
- Explanatory paragraph distinguishing this video (meant for the prospect's contact, `{{C()}}`, reading the doc) from the actual "Super Loom" campaign asset sent to the whale on Day 1: *"Quick distinction, so nothing below is confusing: this video is for {{C()}} — a two-minute walkthrough of why we picked {{W()}} and how the next ten sections play out. It is separate from the Super Loom that {{W()}}'s team receives on Day 1 of the campaign itself. That one's for them."*

### 4.3 — Why We Reached Out (`secWhy()`, section 3)
Built as an array of conditional paragraphs (`paras`), pushed in order:
1. Always: `"{{C()}}, we don't send a doc like this to everyone."`
2. If `prospectWhat` filled: `"We looked at what {{P()}} does - {prospectWhat} - and it's exactly the kind of business that can credibly walk up to {{W()}} and be taken seriously, not laughed out of the inbox."` Else (fallback, no prospectWhat): `"We looked at what {{P()}} does, and it's exactly the kind of business that can credibly walk up to {{W()}} and be taken seriously, not laughed out of the inbox."`
3. If `whaleWhat` filled: `"{{W()}} matters here because {whaleWhat}. That's not a small account to add to the roster - it's the kind of client that changes which conversations {{P()}} gets invited into next."` Else: `"{{W()}} isn't just another name on a list - it's the kind of client that changes which conversations {{P()}} gets invited into next."`
4. If `signal` filled: `"Here's the part most outreach skips: {signal}. That single detail is the hook the entire campaign below is built around - it's the reason the Super Loom on Day 1 won't feel like everything else landing in {{WCInbox()}} that week."` Else: `"We haven't found the specific hook yet - that's the first thing we'll nail down on the call before Day 1, because a whale can tell within three seconds whether a message was made for them or blasted to a list."`
5. Always (closer): `"That's exactly why we built the campaign in Section 8 - specifically to get {{P()}} in front of {{W()}}, not a generic version of this doc sent to a hundred other companies."`

### 4.4 — Table Of Contents (`secToc()`, section 4)
Renders `.doc-steps`: a numbered step-list (`.doc-step`, circular numbered badge + label, no description) for every entry in `DOC_SECTIONS` (all 11, including itself and the headline concept implicitly via the section list) — essentially a visual index card recap of the whole doc.

### 4.5 — Social Proof (`secProof()`, section 5)
Intro line: *"We don't ask you to take our word for it. Here's what happened when we ran this exact playbook for other people chasing their own whale."*

Hardcoded `PROOF` array (3 testimonials), rendered as before/after cards with a pull-quote:

| Name | Before | After | Quote (verbatim) |
|---|---|---|---|
| Kirill Marin | Sending hundreds of outreaches and landing nothing. | Signed big names like Remotely X, closed an $8,000 deal, and started generating real revenue from a handful of tailored outreaches. | "Before your systems, I was sending hundreds of outreaches and landing nothing. Then I switched, signed big names like Remotely X, closed an $8K deal, and started generating real revenue from just a handful of tailored outreaches. The prospects come in warm, the close is easy, and it compounds: every client becomes proof that brings in the next one." |
| Abdulazeez Ba | Went on 7 to 10 calls and didn't close a single one. | Sent his first Super Loom and immediately closed a whale client with instant authority - plus a referral within 24 hours. | "I went on 7 to 10 calls and didn't close a single one. Then I sent my first Super Loom and the guy replied 'f**k it let's work together'. I literally had to pull over because it felt like I'd stumbled on gold. Now I'd rather send a few targeted Super Looms I know will close than waste time sending hundreds of messages that go nowhere." |
| Michel Lieben (ColdIQ) | An 8-figure founder we had no business signing - just another cold outreach target. | We saw holes in his business and built the best outreach he'd ever seen: a full skiing movie, produced just for him. Booked the meeting, and he reposted it to his 70,000 followers - 15 inbound leads followed. | "Wow ok you got me. Let's chat." |

Each card is `.proof-card` with `.proof-name`, a 2-col `.proof-ba` grid (`.before` in danger-red, `.after` in mimeo-green), and an italic `.proof-quote` with a left green border-accent.

### 4.6 — The Offer (`secOffer1()`, section 6)
Headline claim: **"We'll build your first Super Loom for {{W()}}. Free."**

4-step `.doc-steps` process list:
1. **Hop On A Quick Call** — "15 minutes to confirm {{W()}} is the right target, sanity-check the hook, and agree the angle."
2. **We Script & Produce It** — "We write, storyboard, and produce a bespoke Super Loom aimed at {{WC()}} - the exact Day 1 asset from the campaign below."
3. **You See It Before Anyone Else** — "Watch the finished video before it goes anywhere near {{W()}}. If it doesn't make you want to send it, we haven't done our job."
4. **Then We Decide Together** — "Like what you see? We run the full 85-day campaign. Don't? Keep the video - it's yours either way."

Followed by a `calendlyCard()` (see §8) and a 2-column `.offer-two-way` block:
- **Just Respond To This Doc** — "Reply and tell us you're in - we'll follow up to schedule the call."
- **Book A Call Above** — "Pick a time directly - no back and forth needed."

### 4.7 — The Problem (`secProblem()`, section 7)
Two body paragraphs:
1. *"You already know {{W()}} would change {{P()}}'s business. That's not the hard part. The hard part is that {{W()}}'s team gets 200+ pitches a week, and their pattern recognition for templated garbage is surgical - they can tell within three seconds whether a message was made for them or blasted to a list."*
2. *"Every week this stays unsolved, someone else - with a worse offer but a louder signal - gets the meeting instead of you. Volume can't fix this. You can't out-template a whale. The only thing that works is doing something at their door that would be physically impossible to do for a thousand people at once."*

Closing callout (`.doc-callout.good`, labeled "Why It Matters"): *"That's what the five deliverables below are built to do - not impress {{W()}}, but prove to them that {{P()}} is different, before a single sales conversation happens."*

### 4.8 — The Campaign (`secDeliverables()`, section 8)
The largest, most data-driven section — full documentation of its internals is in §5 below. Structure:
- Heading: `The Campaign: How We Actually Land {{W()}}`
- Intro: *"This is the deliverable. Not a slide of ideas - the full, day-by-day, 85-day campaign we will build and run to get {{P()}} in front of {{W()}}. Five touchpoints, each one earning the right to the next."*
- `.campaign-track` — horizontal (vertical on mobile) 5-node timeline visualization, one node per `CAMPAIGN_DEFS` entry, showing icon, name, and start day, connected by arrow connectors.
- `.doc-callout.neutral` labeled "Campaign Length": *"{{totalTouches()}} total touches across 5 mediums, running from Day 1 to Day {{campaignEndDay()}}. Every touch below is trackable - check them off as you run the real campaign."* (i.e. "29 total touches ... Day 1 to Day 85").
- One `.tp-card` per campaign phase (see §5, §8 for full breakdown of card contents: header/icon/tags, "What It Is"/"Why It Works" explain boxes, the "angle for this campaign" artifact block, and the collapsible touch-by-touch schedule).

### 4.9 — FAQs (`secFaq()`, section 9)
Renders the hardcoded `FAQS` array (see §5 for verbatim Q&A with tokens) as `.faq-item` cards, each running both question and answer through `fill()`.

### 4.10 — About Me (`secAbout()`, section 10)
Avatar circle "DJ". Body copy (verbatim, 3 paragraphs):
1. *"I'm Dan James. I run Lincko, a creative outbound agency that builds bespoke, out-of-this-world outreach for B2B companies targeting whale clients. We've signed 8-figure founders using our own Super Looms, and helped clients close $12,000, $20,000, and even $32,000 deals using the exact same system you're looking at right now."*
2. *"I started Lincko because I kept seeing the same thing in every industry: the world's most boring, most generic outreach, being ignored by exactly the prospects it needed to land - even when the business behind it was massive, with tons of social proof. People were tired of it. So we went the opposite direction and got completely obsessive instead. The results have been incredible."*
3. *"This document is that obsession, aimed at {{W()}}."*

Links row (`.about-links`): `lincko.co` (real link, opens `https://lincko.co`), `LinkedIn` and `YouTube` (both `href="#" onclick="return false;"` — placeholders, non-functional).

### 4.11 — Let's Talk (`secOffer2()`, section 11)
Heading: **"Still Reading? Good. That Means You Get It."**
Body: *"Let's get {{W()}} on the phone. Same offer as before - we'll build your first Super Loom for {{W()}}, free, and you decide from there whether to run the rest of the campaign."*
Repeats the `calendlyCard()` and the identical `.offer-two-way` 2-column block used in section 6 (same copy, same two options).

---

## 5. Campaign data model

### 5.1 `CAMPAIGN_DEFS` — the 5 campaign phases (verbatim)

```js
const CAMPAIGN_DEFS = [
  {id:'superloom', num:1, name:'Super Loom', touches:6, startDay:1, newThread:[3,5], manualEach:false, icon:'video',
    what:'A bespoke, one-take video sent straight to a specific person at {{whale}} - no template, no automation, filmed for them and no one else.',
    why:"Video breaks the pattern before a single word is read. It proves a real person spent real time on this one account - the exact opposite of everything else landing in that inbox this week."},
  {id:'strategydoc', num:2, name:'Strategy Doc', touches:6, startDay:19, newThread:[3,5], manualEach:false, icon:'doc',
    what:'The detailed, one-page breakdown of exactly how {{prospect}} would work with {{whale}} - the same format as the document you are reading right now.',
    why:'By the time {{whale}}’s team opens this, the video already earned their attention. The doc turns that attention into belief - it removes every reason to say "I don’t get what you’re offering."'},
  {id:'physicalgood', num:3, name:'Physical Good', touches:5, startDay:37, newThread:[3,5], manualEach:false, icon:'gift',
    what:'Something physical, shipped straight to the office - fun, interactive, and built around a detail specific to {{whale}}.',
    why:"Nobody ignores a package. It's impossible to auto-delete, it usually gets shown to other people in the office, and it proves - again - this isn't a mail-merge."},
  {id:'coldcall', num:4, name:'Cold Call', touches:6, startDay:52, newThread:[], manualEach:true, icon:'phone',
    what:'A short, no-script call timed for maximum pattern interrupt - not a pitch, just a direct, human check-in.',
    why:"By week seven, {{whale}}'s team has seen the video, read the doc, and unboxed the package. A real voice on the phone is the one channel a templated sequence can never fake."},
  {id:'coldemail', num:5, name:'Cold Email', touches:6, startDay:70, newThread:[3,5], manualEach:false, icon:'mail',
    what:'A short, plain-text email - easy to write, easy to read, and impossible to misinterpret.',
    why:'After four channels of proof, the ask can finally be this simple. It works because everything before it already did the heavy lifting.'},
];
```

### 5.2 CAMPAIGN_DEFS as a table

| # | id | Name | Touches | Start Day | New-Thread Touches | Manual Each | Icon | End Day (computed) |
|---|---|---|---|---|---|---|---|---|
| 1 | `superloom` | Super Loom | 6 | 1 | [3, 5] | false | `video` | 16 (1 + 5×3) |
| 2 | `strategydoc` | Strategy Doc | 6 | 19 | [3, 5] | false | `doc` | 34 |
| 3 | `physicalgood` | Physical Good | 5 | 37 | [3, 5] | false | `gift` | 49 |
| 4 | `coldcall` | Cold Call | 6 | 52 | [] | true | `phone` | 67 |
| 5 | `coldemail` | Cold Email | 6 | 70 | [3, 5] | false | `mail` | **85** |

Total touches = 6+6+5+6+6 = **29**. Campaign end day = 85 (from `campaignEndDay()`, based on the last def in the array: `last.startDay + (last.touches-1)*3` = `70 + 5*3` = 85).

### 5.3 Touch-numbering / day-spacing logic

```js
function totalTouches(){ return CAMPAIGN_DEFS.reduce((a,c)=>a+c.touches,0); }

function campaignTouches(cp){
  const list=[];
  for(let n=1;n<=cp.touches;n++){
    list.push({n, day: cp.startDay + (n-1)*3, newThread: cp.newThread.includes(n)});
  }
  return list;
}

function campaignEndDay(){
  const last = CAMPAIGN_DEFS[CAMPAIGN_DEFS.length-1];
  return last.startDay + (last.touches-1)*3;
}

function touchName(cp, n){
  if(cp.id==='coldcall') return n===1 ? 'Initial Call' : `Call Attempt ${n}`;
  if(n===1){
    if(cp.id==='superloom') return 'Send The Super Loom';
    if(cp.id==='strategydoc') return 'Send The Strategy Doc';
    if(cp.id==='physicalgood') return 'Ship The Physical Send';
    return 'Send The Opening Email';
  }
  return `Email Follow-Up ${n}`;
}

function touchKey(cp, n){ return cp.id + '-' + n; }

function touchDoneCount(){
  let n=0;
  CAMPAIGN_DEFS.forEach(cp=>{ campaignTouches(cp).forEach(t=>{ if(touchDone[touchKey(cp,t.n)]) n++; }); });
  return n;
}
```

- **Spacing:** every touch within a phase is spaced exactly **3 days** apart, starting at `cp.startDay` (touch 1 = startDay, touch 2 = startDay+3, touch 3 = startDay+6, etc.).
- **"New Thread" flag:** a touch is tagged `newThread:true` (rendered as an orange "New Thread" pill) if its touch-number `n` appears in `cp.newThread` (e.g. `[3,5]` means touches 3 and 5 in that phase start a fresh email thread rather than continuing the last one). Cold Call has `newThread:[]` since it's phone-based, not thread-based.
- **`touchName()` naming rules:**
  - Cold Call phase: touch 1 = "Initial Call", touches 2+ = "Call Attempt N".
  - All other phases, touch 1: phase-specific verb — Super Loom → "Send The Super Loom", Strategy Doc → "Send The Strategy Doc", Physical Good → "Ship The Physical Send", Cold Email → "Send The Opening Email" (the default/fallback case).
  - All other phases, touches 2+: "Email Follow-Up N".
- **`touchKey()`** produces a stable localStorage/DOM key like `superloom-1`, `coldcall-3`, used both as checkbox element ids and as keys into the `touchDone` map.
- **`touchDoneCount()`** iterates every campaign's every touch and counts how many keys are truthy in `touchDone` — this feeds the sidebar progress bar (`n / 29`).

### 5.4 `FAQS` array (verbatim, all Q&A pairs with `{{tokens}}`)

```js
const FAQS = [
  {q:'Why does landing {{whale}} take 85 days?',
   a:"Because whales don't reply to the first message - they reply to proof, repeated across five different channels. Every touchpoint below earns the right to the next one. Rush it and {{prospect}} looks like everyone else in {{whale}}'s inbox."},

  {q:'What if {{whale}} replies before day 85?',
   a:'Then the campaign is over and we move straight to the call. 85 days is the maximum, not the goal - most of the campaigns we run close long before the last touch.'},

  {q:'Do I need to do any of this myself?',
   a:'No. We script the Super Loom, write every email, design the physical send, and brief the caller. The only thing we need from {{contact}} is 15 minutes to sign off on the angle before Day 1.'},

  {q:'What happens after {{whale}} says yes?',
   a:'You get the meeting. What you do with it from there is on you - but we will have already given {{whale}}’s team five reasons to believe {{prospect}} is worth their time before you say a word.'},

  {q:'Why not just cold email {{whale}} 500 times instead?',
   a:"Because the math is worse, not better. A 0.6% reply rate on 1,000 generic sends gets you 6 conversations. A campaign built entirely around one qualified whale routinely closes at several times that rate - with a bigger deal on the other end of it."},

  {q:'What do you need from me to start?',
   a:'Exactly what you filled in on the last page - who {{prospect}} is, who {{whale}} is, and anything specific you already know about them. We turn that into the five deliverables below.'},
];
```

Both `q` and `a` for every FAQ are run through `fill()` at render time (in `secFaq()`), substituting `{{whale}}`, `{{prospect}}`, and `{{contact}}`.

### 5.5 Per-campaign "artifact" copy (`campaignArtifact(cp)`)

Beyond the static `what`/`why` fields, each campaign card also renders a dynamically-generated "angle for this campaign" block via `campaignArtifact(cp)`. This function pulls live values (`p=P(), w=W(), c=C(), wc=WC(), greet=WCGreeting()`) and a `hook` (the user's `signal` input if provided, else the fallback string `"something specific we've found about ${w}"`), then returns phase-specific copy:

- **superloom**: *"A 60-90 second video from {p}, addressed to {wc} by name, opening on {hook}."* + a quoted sample script: *"Hey {greet} - noticed {hook}. We help teams land accounts exactly like {w}, and we've already mapped out three specific ways {p} could open the door with you. Want to see them?"*
- **strategydoc**: *"The doc that {wc} receives here is this same format, rebuilt from scratch around {w} - showing exactly how {p} would become a partner worth having."* + *"It repeats the offer, the proof, and the plan in writing, so nothing about {p}'s pitch is left for {w}'s team to guess at."*
- **physicalgood**: *"A physical send tied to {hook}, shipped directly to {WCOffice()}, with a handwritten note referencing the Super Loom and Strategy Doc they already saw from {p}."* + quoted script: *"Figured a video and a doc weren't enough - wanted you to have something to hold too. 15 minutes when this lands?"*
- **coldcall**: *"A short, no-pitch call from {p}'s team."* + quoted script: *"Hey {greet} - this is {p}. You've probably seen the video, the doc, and the package by now. Not calling to sell you anything - just to ask if it's worth 15 minutes."*
- **coldemail** (default/else branch): *"One line, from {p} directly to {wc}."* + quoted script: *"Hey {greet} - five touches in, so I'll keep this short: worth 15 minutes to talk through how {p} would work with {w}?"*

Each returns `{label:'The angle for this campaign', lines:[...]}` rendered inside `.tp-artifact` (dashed border box).

---

## 6. Template token system

### Raw tokens
Two forms of substitution exist in this app:
1. **Simple `fill()` tokens** — literal `{{prospect}}`, `{{whale}}`, `{{contact}}` strings baked into `CAMPAIGN_DEFS.what/why` and `FAQS.q/a`, replaced by a single regex-based `fill()` call at render time.
2. **Helper-function interpolation** — most of the actual document prose (headline, why, offer, problem, about, artifacts) is built with JS template literals calling helper functions directly (`P()`, `W()`, `C()`, `WC()`, etc.) rather than `{{}}` placeholders — these are resolved immediately at generation time, not deferred like `fill()`.

### Helper functions (verbatim) and their fallback defaults

```js
function isValid(){ return !!(input.prospect.trim() && input.contact.trim() && input.whale.trim()); }
function P(){ return esc(input.prospect.trim() || 'your team'); }
function C(){ return esc(input.contact.trim() || 'there'); }
function W(){ return esc(input.whale.trim() || 'your dream client'); }
function hasWC(){ return !!input.whaleContact.trim(); }
function WC(){ return esc(input.whaleContact.trim()) || (W() + '’s team'); }
function WCGreeting(){ return hasWC() ? WC() : 'there'; }
function WCOffice(){ return hasWC() ? WC() + '’s office' : W() + '’s office'; }
function WCInbox(){ return hasWC() ? WC() + '’s inbox' : W() + '’s inbox'; }
function fill(str){
  return str.replace(/\{\{prospect\}\}/g, P()).replace(/\{\{whale\}\}/g, W()).replace(/\{\{contact\}\}/g, C());
}
```

| Function | Resolves to | Fallback when field empty |
|---|---|---|
| `P()` | prospect (escaped) | `'your team'` |
| `C()` | contact first name (escaped) | `'there'` |
| `W()` | whale name (escaped) | `'your dream client'` |
| `hasWC()` | boolean: whaleContact filled? | — |
| `WC()` | whale contact person/title (escaped) | `{{W()}}'s team` (note: since W() already has its own fallback, an empty whale AND empty whaleContact yields `"your dream client's team"`) |
| `WCGreeting()` | a greeting-safe name for "Hey ___" openers | `WC()` if set, else literal `'there'` (deliberately different fallback than `WC()` alone, to avoid "Hey Anthropic's team" in scripts) |
| `WCOffice()` | "___'s office" phrasing for physical-good copy | `{{WC()}}'s office` if set, else `{{W()}}'s office` |
| `WCInbox()` | "___'s inbox" phrasing | `{{WC()}}'s inbox` if set, else `{{W()}}'s inbox` |
| `fill(str)` | resolves literal `{{prospect}}`/`{{whale}}`/`{{contact}}` tokens inside a static string (used for `CAMPAIGN_DEFS` and `FAQS` copy) | uses `P()`, `W()`, `C()` fallbacks respectively |

All of `P()`, `C()`, `W()`, `WC()` run their result through `esc()` (HTML-escaping `&`, `<`, `>`) to prevent injection when a user pastes HTML-ish text into a field — note `WCGreeting/WCOffice/WCInbox` compose already-escaped strings with literal apostrophe suffixes.

`isValid()` is the master gate: true only when `prospect`, `contact`, and `whale` are all non-empty (trimmed). This one function controls: whether step 2 is unlocked in the sidebar, whether TOC appears, whether the doc step actually renders (vs. redirecting to setup), and whether the "Copy Full Doc" button works.

---

## 7. State & persistence

### localStorage keys
- **`strategydoc_input`** — JSON-serialized `input` object (the 8 setup fields). Written on every keystroke via `persistInput()`.
- **`strategydoc_progress`** — JSON-serialized `touchDone` object (a flat map of `touchKey → boolean`). Written on every checkbox toggle via `persistDone()`.

### State shape

```js
function defaultInput(){
  return {prospect:'', contact:'', prospectWhat:'', whale:'', whaleWhat:'', whaleContact:'', signal:'', calendly:''};
}
```
8 fields, all strings, all default to empty string.

```js
function loadInput(){
  try{
    const i = JSON.parse(localStorage.getItem('strategydoc_input'));
    if(i && typeof i==='object') return Object.assign(defaultInput(), i);
  }catch(e){}
  return defaultInput();
}
```
Loading merges saved data over `defaultInput()` defaults (so newly-added fields in a future version wouldn't break old saved state — forward-compatible pattern), and falls back to fresh defaults on any parse error or missing/invalid data.

```js
function loadDone(){
  try{
    const d = JSON.parse(localStorage.getItem('strategydoc_progress'));
    if(d && typeof d==='object') return d;
  }catch(e){}
  return {};
}
```
`touchDone` has no fixed shape — it's a sparse dictionary keyed by `touchKey()` strings (e.g. `{"superloom-1": true, "coldcall-3": true}`), so keys simply don't exist until a checkbox is checked at least once.

### Module-level state variables
```js
let input = loadInput();
let touchDone = loadDone();
let openTouchpoints = {};          // NOT persisted - resets to all-collapsed on reload
let activeStep = (input.prospect && input.contact && input.whale) ? 'doc' : 'setup';
```
- `openTouchpoints` tracks which campaign cards have their touch-schedule expanded (`.tp-touches.open`) — this is **not** persisted to localStorage, so a page reload always starts with all schedules collapsed.
- `activeStep` initializes to `'doc'` automatically if the 3 required fields already have saved values (returning users skip straight to their doc), else `'setup'`.

### `isValid()` gating logic
Reiterated here in the state context: `isValid()` reads live `input` state (not a cached flag), so it's recomputed on every render. It gates:
1. Step-2 sidebar nav item (`.locked` class + toast-blocked click).
2. TOC group visibility in the sidebar.
3. `renderStepContent()`'s runtime redirect: even if `activeStep==='doc'` (e.g. from stale state), if `!isValid()` it force-resets `activeStep='setup'` and renders the setup step instead — a hard safety net against ever rendering the doc step with missing required data.
4. The "Copy Full Doc" button.
5. The "Generate Strategy Doc →" button (client-side validation + focus-the-missing-field UX).

---

## 8. UI components

### Touchpoint checklist rows (`.touch-row`)
Rendered by `tpTouchesHtml(cp)`. Each row: a custom-styled checkbox (`appearance:none`, 18×18px rounded square, green checkmark drawn via `::after` pseudo-element border-rotate trick when `:checked`), a `<label>` containing (in order): an optional orange "New Thread" pill (`.touch-pill.new`), the touch name (from `touchName()`), a neutral "Touch N of M" pill (`.touch-pill.of`), a small gray instructional hint, and a right-aligned monospace "Day N" (`.touch-day`, pushed right via `margin-left:auto`). The whole row gets `.done` styling (green-tinted background, strikethrough label text) when checked.

The instructional hint text varies: `cp.manualEach ? 'Mark call attempted' : (t.n===1 ? 'Mark as sent' : 'Mark as replied / no reply, move on')` — i.e. Cold Call touches all say "Mark call attempted", while every other campaign's first touch says "Mark as sent" and subsequent touches say "Mark as replied / no reply, move on".

Checkbox `change` handler (`wireDocStep()`): updates `touchDone`, persists it, toggles the row's `.done` class, calls `renderProgress()` (sidebar bar), and live-updates that specific card's "N/M Done" tag without a full re-render (`tags[2].textContent`).

### Campaign track/timeline visualization (`.campaign-track`)
A flex row of `.campaign-step` items (one per `CAMPAIGN_DEFS` entry): each has a filled circular icon node (`.campaign-node`, 42px, stamp-green background), a bold label (campaign name), and a monospace "Day N" sub-label, connected by `.campaign-connector` — a 2px line with a centered `→` arrow (CSS `content:'\2192'` on `::after`, background clipped to the paper color so the arrow appears to "cut through" the line). On mobile (≤640px) the whole track becomes a vertical stack and the arrow rotates to `↓` (`content:'\2193'`).

### Touchpoint card (`.tp-card`, via `tpCardHtml(cp)`)
Full anatomy per card:
1. `.tp-head` — icon badge (`.tp-icon`, rounded square, from `ICONS[cp.icon]`), title `"{num}. {name}"`, and a tag row (`.tp-tag-row`) with 3 pills: `Day {startDay}`, `{touches} Touches`, `{doneN}/{touches} Done` (live-updated).
2. `.tp-explain` — 2-col grid of "What It Is" and "Why It Works" boxes, both filled via `fill(cp.what)` / `fill(cp.why)`.
3. `.tp-artifact` — dashed-border box from `campaignArtifact(cp)` (see §5.5), labeled "The angle for this campaign".
4. `.tp-touches-head` — "Touch-By-Touch Schedule" label + a "Show/Hide Schedule" toggle button (`data-toggle="{cp.id}"`) that flips `openTouchpoints[cp.id]` and toggles the `.open` class on the touches container.
5. `.tp-touches` — the collapsible list of touch rows (collapsed/`display:none` by default via lack of `.open` class, expands to `display:flex` when open).

### Loom video card mockup (`.loom-card`)
Fixed-width dark gradient thumbnail (`.loom-thumb`, 200px, `linear-gradient(135deg,#1d2430,#0d1117)`) with a centered play-triangle icon and a fake `02:14` duration badge (bottom-right pill). Right side (`.loom-meta`) shows a "Loom" source line with video icon, bold title, and gray sub-copy. Purely decorative/illustrative — no real video is embedded or playable.

### Calendly card (`.calendly-card`, via `calendlyCard()`)
Green-tinted icon thumb (calendar icon) + meta panel: "Calendly" source label, title "Discovery Call · Dan James", sub-copy about the 15-minute confirmation call, and a "Book A Call" button. If `input.calendly` is set, this is a real `<a>` link (opens the Calendly URL in a new tab); if not, it's a placeholder `<button id="calendlyPlaceholderBtn">` that, when clicked, shows a toast: *"Add your Calendly link on the Target & Whale step"* (wired via `wireCalendlyPlaceholders()`, which binds to every instance since the card is reused in both section 6 and section 11).

### Proof / before-after card (`.proof-card`)
Bold name header, a 2-col grid (`.proof-ba`) with a red-tinted "Before" box and a green-tinted "After" box (each with a small uppercase label), and an italic pull-quote below with a left green accent border.

### FAQ accordion items (`.faq-item`)
Despite the CSS class naming suggesting an accordion, these are **not actually collapsible** — every `.faq-item` renders its question (`<h4>`) and full answer (`<p>`) simultaneously, always visible, in a simple bordered card. There is no JS toggle/accordion behavior wired to FAQ items in this file — "accordion" styling exists but the interactive collapse behavior is absent (unlike the touchpoint schedule, which genuinely toggles).

### Confirm dialog (`.confirm-overlay` / `.confirm-box`)
A generic reusable modal, invoked via `showConfirm({title, message, confirmLabel})` which returns a Promise resolved by either the Confirm button, Cancel button, clicking the overlay backdrop, or pressing Escape. Currently the only caller is the sidebar's "Clear" button, with:
- title: "Clear everything and start over?"
- message: "This clears the prospect, whale, and all campaign progress. This cannot be undone."
- confirmLabel: "Clear Everything"

On confirm, it resets `input` to `defaultInput()`, `touchDone` to `{}`, `openTouchpoints` to `{}`, persists both, forces `activeStep='setup'`, and re-renders.

### Toast (`#toast`)
Simple bottom-centered dark pill, shown via `toast(msg)`, auto-hides after 1700ms (managed via a single shared `window._toastTimer` so overlapping toasts reset the timer rather than stacking).

### Copy-to-clipboard
`copyText(s)` wraps `navigator.clipboard.writeText(s)`, toasting "Copied" on success or "Copy failed" on rejection. Used by the sidebar's "Copy Full Doc" button, which calls `docText()` (see below) to build a plain-text (HTML-stripped) export of the whole document — not the rendered HTML — suitable for pasting into an email or plain document.

**`docText()` structure:** uppercase title line, "A Strategy Doc prepared by Dan James, Lincko", then plain-text renders of Why We Reached Out and The Problem (via `stripTags()` on the section's HTML, whitespace-collapsed), then a full campaign breakdown (each phase's name/start day, What/Why copy, artifact lines, and every touch as `Day N - {touchName} (Touch n of m) [New Thread] [DONE]` tags where applicable), then all FAQs as `Q:`/`A:` pairs, then the About Me text, then a "Book a call:" line using the real Calendly link or a placeholder note.

---

## 9. Styling system

### CSS custom properties (design tokens, from `:root`)

| Token | Value | Purpose |
|---|---|---|
| `--paper` | `#FFFFFF` | Base background |
| `--paper-raised` | `#FFFFFF` | Card backgrounds (same as paper, relies on shadow for elevation) |
| `--paper-tab` | `#FFFFFF` | Sidebar/tab background |
| `--ink` | `#14181B` | Primary text |
| `--ink-soft` | `#5B6560` | Secondary text |
| `--ink-faint` | `#757E78` | Tertiary/muted text |
| `--stamp` | `#1E6B45` | Primary brand green (accents, active states) |
| `--stamp-ink` | `#FFFFFF` | Text-on-stamp color |
| `--mimeo` | `#2F8F5B` | Secondary green (selection highlight) |
| `--mimeo-ink` | `#E6F4EC` | Pale green tint (badge/callout backgrounds) |
| `--line` | `#E4E9E6` | Default border color |
| `--line-strong` | `#CCD5D0` | Emphasized border color |
| `--good` | `#2F8F5B` | Success/checked state green |
| `--warn` | `#B4691A` | Warning/orange accent |
| `--danger-bg` | `#FBEAE7` | Pale red background (before-cards, danger callouts) |
| `--danger-ink` | `#B23A2E` | Red text/icon color |
| `--shadow` | `0 1px 0 rgba(20,24,27,.03), 0 8px 20px -12px rgba(20,24,27,.14)` | Standard card elevation |
| `--shadow-hover` | `0 1px 0 rgba(20,24,27,.03), 0 14px 30px -14px rgba(20,24,27,.22)` | Hover elevation (defined but not observed wired to a `:hover` rule in this file) |
| `--radius` | `8px` | Base corner radius (defined but most components hardcode their own radii: 6-14px range) |
| `--sidebar-w` | `372px` | Sidebar width |
| `--font-display` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Headings/labels font stack |
| `--font-body` | same stack as display | Body text |
| `--font-mono` | `ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace` | Day counters, meta text |
| `--ease` | `cubic-bezier(.2,.7,.3,1)` | Standard easing (defined, referenced implicitly) |
| `--dur-fast` | `.12s` | Fast transition duration |
| `--dur-base` | `.18s` | Base transition duration |

### Typography
Base body font-size `14.5px`, line-height `1.5`. Headings use the display stack with heavy weights (700-800) and negative letter-spacing on large sizes (e.g. `.doc-h1` at 30px uses `letter-spacing:-.015em`). Uppercase micro-labels (eyebrows, tags, pills) consistently use `font-weight:700`, `text-transform:uppercase`, `letter-spacing:.04em–.08em`, sizes 9.5px–11.5px.

### Color palette / theme character
A muted, paper-and-stamp palette — evokes "official document"/mimeograph aesthetic (`--stamp`, `--mimeo` naming itself references rubber-stamp and mimeograph-copy metaphors), reinforced by the "Prepared by / Stamp" framing of the strategy doc as a semi-official artifact. Primary accent is a forest green (`#1E6B45`/`#2F8F5B`), paired with warm orange for warnings (`#B4691A`) and soft red/pink for danger/before-states (`#B23A2E`/`#FBEAE7`). No dark mode is implemented — the stylesheet has no `prefers-color-scheme` handling.

### Notable component patterns
- **`.doc-hero`** — centered hero block for the headline section: pill-shaped kicker badge, large bold H1 with balanced text-wrap (`text-wrap:balance`), centered sub-copy capped at `56ch`, and a monospace meta line.
- **`.doc-section`** — every numbered section: `margin-bottom:56px`, `scroll-margin-top:20px` (so `scrollIntoView` from the TOC doesn't hide content under the sticky header), preceded by a `.doc-section-num` mini-label (uppercase, stamp-green, with a small colored dot) generated via `secLabel(n)`.
- **`.doc-callout` variants** — `.good` (pale green, dark green text), `.warn` (pale red, dark red text), `.neutral` (white/bordered) — all share a bold uppercase micro-heading inside via `<b>` (`display:block`).
- **`.campaign-track` visualization CSS** — uses a flex layout with `flex:1 1 0` steps and `flex:1 1 30px` connectors so the timeline stretches to fill available width regardless of container size; the connector's arrow glyph is achieved by absolutely centering a `::after` pseudo-element with a background matching the page (`var(--paper)`) so it "erases" a gap in the line behind the arrow character.
- **`.tp-artifact`** — deliberately uses a dashed border (`1.5px dashed var(--line-strong)`) to visually distinguish "example creative angle" content from the more structured explain-boxes around it.
- **Sticky page header** (`.page-header`) — `position:sticky; top:0` with a negative margin trick (`margin:0 -30px 20px`) to bleed full-width under the `#content` padding while the content below scrolls underneath it.
- **Custom checkbox** — fully re-skinned via `appearance:none` + a hand-drawn checkmark using rotated border segments, rather than relying on native OS checkbox rendering, to match the paper/stamp aesthetic.

---

## 10. Business logic / key functions

Grouped by concern:

**State / persistence**
- `defaultInput()` — returns a fresh blank input object (8 fields).
- `loadInput()` / `persistInput()` — localStorage read/write for `strategydoc_input`.
- `loadDone()` / `persistDone()` — localStorage read/write for `strategydoc_progress`.

**Generic helpers**
- `esc(s)` / `escAttr(s)` — HTML-escaping for text content and attribute values respectively.
- `toast(msg)` — shows the bottom toast notification with auto-dismiss.
- `showConfirm({title,message,confirmLabel})` / `closeConfirm(result)` — Promise-based confirm-dialog helper.
- `copyText(s)` — clipboard write with toast feedback.

**Token/copy resolution**
- `isValid()`, `P()`, `C()`, `W()`, `hasWC()`, `WC()`, `WCGreeting()`, `WCOffice()`, `WCInbox()`, `fill(str)` — documented fully in §6.

**Campaign math**
- `totalTouches()` — sums `touches` across `CAMPAIGN_DEFS` (= 29).
- `campaignTouches(cp)` — expands a campaign def into its list of `{n, day, newThread}` touch objects.
- `campaignEndDay()` — computes the final day of the whole campaign (= 85) from the last def.
- `touchName(cp, n)` — produces the human-readable name of a specific touch (phase-aware).
- `touchKey(cp, n)` — stable string key for a touch, used for both DOM ids and the `touchDone` map.
- `touchDoneCount()` — counts completed touches across the entire campaign.
- `campaignArtifact(cp)` — generates the dynamic "angle for this campaign" copy block per phase (documented in §5.5).

**Sidebar rendering**
- `renderNav()` — builds and wires the step-list + TOC groups; handles the locked-step toast and step navigation.
- `renderProgress()` — updates the progress label/bar.
- `renderSnapshot()` — builds and wires the campaign-snapshot recap rows.
- `setActiveStep(id)` — central step-switcher: sets `activeStep`, calls `render()`, scrolls content to top, and auto-closes the mobile rail.
- `renderMobileTopbar()` — updates the mobile-only step eyebrow/name.

**Setup step**
- `renderSetupStep()` — returns the full HTML string for step 1.
- `wireSetupStep()` — binds all input fields (live persistence + re-render) and the Generate button (validation + focus-missing-field + navigate).

**Document section builders** (each returns an HTML string for one section)
- `secLabel(n)` — the small numbered "01"-style section marker.
- `secHeadline()`, `secLoom()`, `secWhy()`, `secToc()`, `secProof()`, `secOffer1()`, `secProblem()`, `secDeliverables()`, `secFaq()`, `secAbout()`, `secOffer2()` — documented individually in §4.
- `calendlyCard()` / `wireCalendlyPlaceholders()` — shared component used in both offer sections.
- `tpArtifactHtml(cp)`, `tpTouchesHtml(cp)`, `tpCardHtml(cp)` — the campaign-card sub-renderers used inside `secDeliverables()`.

**Doc step orchestration**
- `renderDocStep()` — assembles all 11 sections + divider rules into the final doc-shell HTML.
- `wireDocStep()` — binds the "Edit Inputs" button, calendly placeholders, all touch checkboxes (with live progress + per-card done-count updates), and all schedule show/hide toggles.

**Plain-text export**
- `stripTags(html)` — regex strips all HTML tags from a string.
- `docText()` — assembles the full plain-text version of the document for clipboard export (documented in §8).

**Top-level render**
- `renderStepContent()` — dispatches to setup or doc rendering based on `activeStep`, with the hard `isValid()` safety-redirect back to setup.
- `render()` — the master render function: calls `renderNav()`, `renderProgress()`, `renderStepContent()`, `renderSnapshot()`, `renderMobileTopbar()` in sequence. Called once at load (`render();` at the bottom of the script) and again after every state-changing action.

**Global event bindings (bottom of script, run once at load)**
- Mobile rail open/close (`railOpenBtn`, `railCloseBtn`).
- Confirm overlay: click-outside-to-cancel, OK/Cancel buttons, Escape-key handler.
- `copyDocBtn` — validates then copies `docText()`.
- `clearBtn` — shows the confirm dialog and, on confirmation, performs the full state wipe described in §8.

---

## 11. Notable UX/edge cases

- **Hard lock on step 2:** Even if a user somehow forces `activeStep` to `'doc'` (e.g., stale/tampered state), `renderStepContent()` re-validates and silently redirects back to setup, so the doc step can never render with missing required data — a defense-in-depth safety net beyond the UI-level lock.
- **Returning users skip setup automatically:** `activeStep` initializes to `'doc'` on load if all 3 required fields are already populated in localStorage — no need to re-click "Generate" every session.
- **Progressive fallback copy, not blocking validation:** All *optional* fields (`prospectWhat`, `whaleWhat`, `whaleContact`, `signal`, `calendly`) are truly optional — the document still fully generates without them, just with more generic phrasing (see the conditional paragraph branches in `secWhy()`, and the `WC()`/`WCGreeting()`/`hook` fallbacks). This directly embodies the D100 pitch: it works either way, but works much better when the user does the research.
- **Live-typing reactivity:** Because setup-field input listeners immediately update `input`, persist it, and re-render nav + snapshot, the sidebar's lock-state and snapshot panel update in real time as the user types — no explicit "save" step exists anywhere in the app.
- **Non-destructive "Clear":** Clearing requires an explicit confirm-dialog step with a clearly worded warning ("This cannot be undone") before wiping `input`, `touchDone`, and `openTouchpoints` and resetting to step 1.
- **Calendly-optional graceful degradation:** If no Calendly link is set, the booking button still renders (as a `<button>` instead of `<a>`) and clicking it gives actionable guidance via toast rather than doing nothing or erroring.
- **FAQ "accordion" is visually named but not functionally collapsible** — a potential inconsistency/incomplete-feature note: the CSS/class naming (`faq-item`) suggests an accordion pattern common in other doc tools, but no JS toggle exists; all FAQ content is always expanded.
- **`--shadow-hover` token is defined but appears unused** — no CSS rule in the file applies it on any `:hover` state (cards use only `--shadow`), suggesting either a leftover from a shared design system or an intended-but-unimplemented hover-elevation effect.
- **Non-functional placeholder UI left in intentionally:** the topbar "Sign out" button, and the About Me section's LinkedIn/YouTube links (`href="#" onclick="return false;"`), are inert — consistent with this being a self-contained internal tool/prototype rather than a fully productized multi-user SaaS page.
- **Mobile connector glyph swap:** the campaign-track's directional arrow literally changes from `→` to `↓` via a CSS content swap at the 640px breakpoint, keeping the "flow" metaphor coherent whether the timeline is horizontal or vertical.
- **Per-touch instructional copy varies by mechanism:** Cold Call touches always say "Mark call attempted" (reflecting that a call can fail to connect, unlike a sent email), while every other touch type distinguishes touch 1 ("Mark as sent") from follow-ups ("Mark as replied / no reply, move on") — a subtle but deliberate acknowledgment that channel mechanics differ (a call is binary/attempted, an email send vs. a reply are different states).
- **Copy-to-clipboard exports plain text, not HTML** — deliberately, so the output can be pasted directly into an email client or plain document without carrying over the app's styling, and so section content stays readable/compact (HTML stripped, whitespace collapsed) rather than dumping raw markup.
