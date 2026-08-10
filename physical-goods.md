# Physical Goods — Send Builder

Documentation of `outreach-work/physical-goods.html`, a single-page HTML/CSS/JS web app.

---

## 1. Overview

**Physical Goods** (page `<title>Physical Goods</title>`, browser tab icon `logo.png`) is a single-page, client-side tool for planning a **physical-goods outreach send** ("gifting" / direct-mail outreach) to one specific prospect/account. It is one tool inside a larger **"Outreach Tools" suite** — the top bar has a `&larr; Outreach Tools` back-link to `index.html`, and the sidebar logo subtitle reads **"Send Builder"**. Sibling tools referenced by the surrounding product family are `strategy-doc.html`, `swipe-desk.html`, and `vsl-loom.html` (not present in this file, but implied by the shared chrome/back-link pattern).

The tool exists to operationalize a sales tactic often called "gifting" or "surprise & delight" outreach: sending a prospect (or account) a physical item — from a $1 postcard to a $200 custom office flag — accompanied by carefully sequenced messaging (a pre-arrival heads-up, an in-box note, an optional public post, and post-delivery follow-up emails), in order to earn a meeting. It is built for SDRs/AEs/founders doing account-based, high-touch outbound sales, and encodes a specific methodology:

1. Research the account/founder from three lenses (strategic, business, personal) to find a genuine "in."
2. Pick a cost tier appropriate to the account's size/opportunity via a scored quiz.
3. Pick a physical good matched to size (small/medium/large) and cost tier, from a 27-item seed catalog.
4. Run a pre-ship checklist (sender ID, address confirmation, tracking).
5. Decide how to ship it (carrier/timing guidance).
6. Write the four moments of messaging around the send (before-landing, inside-the-box, optional public posting, and up to 4 follow-up emails), optionally seeded from a customizable **Template Bank**.

Everything is persisted to `localStorage` in the browser; there is no server/backend — it's a fully client-rendered vanilla-JS app (no framework), with all HTML built via template strings and re-rendered wholesale on state changes.

---

## 2. App Shell & Navigation

### 2.1 Site chrome (outer shell, outside `#app`)
- `.site-topbar-accent` — a 4px solid `#231F2E` bar across the very top (matches the outer Outreach Tools suite branding accent).
- `.site-topbar` — flex row: `&larr; Outreach Tools` back-link (left) → centered `<h1>Physical Goods</h1>` → right-aligned "Signed in as Dan" + a `Sign out` button (both decorative/non-functional in this build — no JS listener wires the sign-out button).

### 2.2 Sidebar (`nav#rail`)
Fixed-width left rail (`--sidebar-w: 372px`), full height, flex column, non-scrolling shell with one internal scrolling region (`.rail-scroll`). Contents top-to-bottom:
1. **`.sidebar-logo`** — "PG" logo mark (stamp-colored square), "Physical Goods" / "Send Builder" text, plus a mobile-only `Close` button (`#railCloseBtn`).
2. **`.sidebar-progress`** — "Plan progress" label with `n/6` counter (`#progressLabel`) and a `.progress-bar` fill bar (`#progressFill`), width set to `(doneSteps/6)*100%`.
3. **`.rail-scroll`** (independently scrolling column) containing:
   - **`#navGroups`** — the step navigator (see 2.3).
   - **`.rail-divider`** — a labeled divider ("Goods Plan" eyebrow) with a `Clear` button (`#clearPlanBtn`) that wipes the entire plan (with confirm dialog).
   - **`#ppBody`** — the live "Goods Plan" tracker/summary panel (see §5.8).
4. **`.sidebar-footer`** — a full-width `Copy Plan` button (`#copyPlanBtn`) that copies a plain-text rendering of the whole plan to the clipboard.

### 2.3 Step navigator (Builder steps)
Defined by the `STEPS` array (see §4.1) and rendered by `renderNav()`. Each step is a `.step-item` button showing:
- A circular `.step-num` badge: shows the step number normally; shows a `✓` checkmark and switches to filled/"done" styling when the step's completion predicate (`stepStatus()`) returns `'done'`; shows an in-progress outline color when `'progress'`.
- The step label.
- `.active` class highlights the currently open step (green-tinted background + left inset stamp-colored bar).

Clicking a step item calls `setActiveStep(id)`.

### 2.4 Progress tracking
`stepStatus(id)` in `render.js`-equivalent logic computes one of `'pending' | 'progress' | 'done'` per step based on plan contents (exact rules documented in §6.2). `doneStepCount()` counts `'done'` steps; `renderProgress()` renders `n/6` and fills the progress bar proportionally.

### 2.5 Mobile behavior
- Breakpoint: `@media (max-width: 980px)` — `#app` collapses from the two-column grid (`sidebar-w 1fr`) to a single `main`-only column; `nav#rail` becomes a fixed, off-canvas drawer (`transform:translateX(-100%)`) that slides in when given the `.open` class (triggered by `#railOpenBtn` in the mobile topbar) and slides out via `#railCloseBtn` or automatically whenever `setActiveStep()` runs while `window.innerWidth <= 980`.
- A `.mobile-topbar` (hidden ≥980px) appears showing a `Menu` button, current step eyebrow ("Step X of 6"), and step name — updated by `renderMobileTopbar()`.
- At `@media (max-width:640px)` content padding tightens (`#content`, `.page-header`).
- Modal boxes go edge-to-edge/full-height at `@media (max-width:720px)`.
- `@media (prefers-reduced-motion: reduce)` disables the page-header fade-in and modal open animations.

### 2.6 Focus handling
A single global focus-visible ring style (`:focus-visible{outline:2px solid var(--stamp); outline-offset:2px;}`) applies app-wide, with explicit `outline-offset` re-affirmed on interactive custom controls: `.quiz-opt`, `.chip`, `.size-card`, `.tpl-card`, `.step-item`, `.msg-card.optional.collapsed`, `.fe-box`. Quiz options and collapsible optional message cards are also keyboard-operable (`tabindex="0"`, `role="radio"`/`role="button"`, Enter/Space handlers).

---

## 3. Full Workflow Walkthrough

The builder is a 6-step wizard, defined in `STEPS` (§4.1) and driven by `activeStep` global state + `renderStepContent()` dispatch. Every step renders a shared `pageHeaderHtml(eyebrow, title, sub)` header and a shared `stepNavHtml()` prev/next footer (`&larr; Prev` / `Next &rarr;`), wired by `wireStepNav()`.

### Step 1 — Research Fit (`id: 'research'`)
Header: *"Step 1 of 6 — Research Fit — Understand this prospect from three angles, then land on one outreach idea worth sending."*

- Iterates `RESEARCH_LENSES` (Strategic / Business / Personal), and under each lens's `.group-title` + description, renders one `.card` per matching `RESEARCH_PROMPTS` entry via `researchCardHtml()`.
- Each prompt card shows accumulated **findings** (free-text notes the user has logged against that prompt) as `findingRowHtml()` rows, each with optional `source`, `confidence` (Low/Medium/High badge), and `date` metadata, plus a delete (`&times;`) button (confirmed via the custom confirm dialog).
- An **"+ Add finding"** button opens an inline `findingFormHtml()` form (textarea for the finding text, source input, date input, confidence `<select>` defaulting to Medium) — `addingFindingFor` state variable tracks which prompt's form is open.
- Below all three lenses: a **"Where to look"** section (`sourceGroupsHtml()`) rendering `RESEARCH_SOURCES_TIP` as italic guidance text plus a `.source-grid` of `RESEARCH_SOURCE_GROUPS` cards (Company / First-Hand / Long-form / News / Public presence / Voice of customer), each a card of chip-style source names.
- A final **"Outreach Angle"** section: hint text *"What's the absolute best thing worth saying to this company given all of the above?"* and a single freeform textarea (`#oppAngle`) bound to `plan.research.opportunity.angle`.

State written: `plan.research.{strategic,business,personal}.<key>` (arrays of finding objects `{id, text, source, date, confidence, addedAt}`), `plan.research.opportunity.angle` (string).

### Step 2 — Cost Fit (`id: 'cost'`)
Header: *"Step 2 of 6 — Cost Fit — Answer a few quick questions to land on the right budget tier for this account."*

- Renders `COST_QUESTIONS` (§4.4) via the shared quiz engine (`quizQuestionsHtml` / `wireQuizOptions`), storing answers in `plan.costAnswers`.
- A **"See recommendation"** button is disabled until every non-optional question is answered (`COST_QUESTIONS.every(q=> q.optional || plan.costAnswers[q.id]!=null)`).
- On click, `scoreQuiz()` sums each option's `points` object (keyed `low`/`mid`/`high`) across all answered questions, `topScoreId()` picks the tier with the highest total score, and a `.quiz-result` card shows the winning `COST_TIERS` entry's name/range/principle plus a **"Use this tier"** button that sets `plan.costTier`.

### Step 3 — Goods Catalog (`id: 'catalog'`, but page header literally reads "Step 3 of 6")
Header: *"Step 3 of 6 — Goods Catalog — Pick a size to browse the goods that fit it, grouped by cost."*

- Shows three large `.size-card` buttons, one per `SIZES` entry (Small/Medium/Large), each displaying a live count of goods of that size (`getGoods().filter(g=>g.size===s.id).length`) and the size's description.
- Clicking a size card opens the **Goods Catalog modal** (`openGoodsModal(sizeId)`) — see §5.4.

### Step 4 — Package Checklist (`id: 'checklist'`)
Header: *"Step 4 of 6 — Package Checklist — What has to be true about the box before it ships."*

- Shows a progress bar (`done/total`) then a single `.card` containing all `PACKAGE_CHECKLIST` items (§4.6) as `.check-item` checkboxes with custom-styled checkmark checkboxes. Items with `bullets` render a `<ul class="check-bullets">`; items with plain `b` text render inline. Checked items get strikethrough styling on the bold label.
- State: `plan.checklist[checklistKey(item)] = true/false`, where `checklistKey()` slugifies the item's heading (`item.h.toLowerCase().replace(/[^a-z0-9]+/g,'-')`).

### Step 5 — How to Send (`id: 'send'`)
Header: *"Step 5 of 6 — How to Send — Carrier, packaging, and timing guidance, plus the method for this send."*

- Renders `SEND_GUIDE` (§4.7) as plain `.card` entries (Carriers / Packaging / Timing / Address collection).
- A "Send Method" `.group-title` + row of `.chip` buttons for `SEND_METHODS` (USPS Priority / FedEx-UPS Express / Local courier-hand-delivered / Other) — single-select, toggled via `plan.sendMethod`.
- A free-text "Send notes (address, tracking #, expected delivery)" textarea bound to `plan.sendNotes`.

### Step 6 — Messaging (`id: 'followup'`)
Header: *"Step 6 of 6 — Messaging — The three moments of contact around the send - before it lands, inside the box, and after it lands."* (Note: the sub-copy says "three moments" while the flow diagram below it depicts **four**.)

- **Flow diagram** (`renderMsgFlowHtml()`) — a horizontal (vertical on mobile) 4-node track showing all `MESSAGE_SECTIONS` in order with connecting arrows, each node numbered and tagged (Optional / In The Box / Optional / After It Lands).
- **Before Landing** + **Message Inside** cards (`msgCardHtml`), filtered to exclude `followup` and `publicPosting`.
- **Public Posting** card, rendered separately in its own `.msg-sections` wrapper.
- **Follow-Up Emails** block (`renderFollowupEmailsHtml()`) — 4 clickable preview tiles (`.fe-box`), each opening a dedicated modal (`openFollowupEmailModal(idx)`) to write/edit that individual follow-up email.
- Each message card (except the follow-up tiles) has a **"Browse Template Bank"** trigger (`.tpl-trigger`) that opens the Template Bank modal scoped to that section, a subject-line input (if `hasSubject`), a body textarea, a live character counter, and a **"Save Email"** button.
- Optional sections (`tag === 'Optional'`, i.e. Before Landing and Public Posting) default to **collapsed** (`optionalExpanded[s.id]` state, default falsy) showing only a dashed dropzone-style card with a hint ("Skip this if it doesn't apply — click to add it" or, if filled, "`N` characters written - click to edit"). Clicking/Enter/Space expands it in place.

---

## 4. Data Model

All seed/constant data lives at the top of the `<script>` block under the comment `DATA — placeholder / seed content. Replace and expand freely.`

### 4.1 `STEPS` — wizard steps
| id | num | label |
|---|---|---|
| `research` | 1 | Research Fit |
| `cost` | 2 | Cost Fit |
| `catalog` | 3 | Goods Catalog |
| `checklist` | 4 | Package Checklist |
| `send` | 5 | How to Send |
| `followup` | 6 | Messaging |

### 4.2 `COST_TIERS` — cost tiers
| id | name | range | tableLabel | principle |
|---|---|---|---|---|
| `low` | Low-Cost / Mass | $1 - $15 | Low Cost | "Cheap enough to send to hundreds without a second thought - used to open a lot of doors at once." |
| `mid` | Mid-Tier / Targeted | $15 - $50 | Mid Cost | "Reserved for accounts that have shown some signal - a named shortlist, not a mass blast." |
| `high` | High-Touch / Strategic | $50+ | High Cost | "Only for accounts worth real 1:1 effort - big deal size or a champion you need to win over." |

### 4.3 `SIZES` — package sizes
| id | name | desc |
|---|---|---|
| `small` | Small | "Fits in an envelope or a small padded mailer - postcards, cards, and other flat or pocket-sized items." |
| `medium` | Medium | "Ships in a standard box - mugs, books, boxed gadgets, and similar single-item sends." |
| `large` | Large | "Bulkier sends - hampers, multi-item bundles, and anything that needs a bigger box." |

### 4.4 `SEED_GOODS` — the physical-goods catalog (27 items)
Each item: `{id, name, size, tier, costRange, category, desc, whenToUse:'', examples:[]}` (`whenToUse` and `examples` are seeded empty on every item but supported by the UI — see `.when`/`.examples` CSS and `goodRowHtml()`).

| Name | Size | Tier | Cost | Category |
|---|---|---|---|---|
| Bespoke Postcard | small | low | $1 flat | Opener / Mass |
| Prepaid Disposable Phone | small | mid | Under $30 | Timed / High-Impact |
| Rubik's Cube | small | low | $8 - $15 | Puzzle / Curiosity |
| Candle | small | mid | $20 - $35 | Relationship / Warm-up |
| Ship in a Bottle | medium | low | $15 - $30 | Novelty / Craft |
| Compass | small | low | $10 - $18 | Direction / Metaphor |
| Mini Safe | small | mid | $25 - $45 | Security / Intrigue |
| Yo-Yo | small | low | $6 - $12 | Playful / Curiosity |
| Chess Piece | small | low | $8 - $15 | Strategy / Metaphor |
| Magnifying Glass | small | low | $7 - $14 | Insight / Metaphor |
| Small Lego Kit | medium | low | $15 - $30 | Playful / Build Together |
| Mini Cactus | small | low | $8 - $16 | Low-Maintenance / Warm-up |
| Framed AI Portrait | medium | mid | $30 - $50 | Personalized / Flattery |
| Printed T-Shirt with AI Photo | medium | low | $15 - $28 | Personalized / Playful |
| Handwritten Note | small | low | $1 - $5 | Opener / No-Gift |
| Flowers | medium | mid | $35 - $60 | Relationship / Classic |
| Custom Logo Rug | medium | mid | $40 - $70 | Bold / Office Presence |
| Hamper | large | mid | $50 - $90 | Shared / Team |
| Branded Merchandise | medium | mid | $25 - $45 | Bundle / Introduction |
| Rubber Duck | small | low | £5 - £10 | Playful / Icebreaker |
| Bobblehead | medium | mid | £40 - £70 | Personalization |
| Neon Sign | large | mid | $55+ | Bold / Office Statement |
| Custom Office Flag | large | high | £100 - £200 | Company Branding |
| Caricature | medium | mid | £35 - £60 | Personalization / Humor |
| Vinyl Record | medium | mid | $25 - $45 | Personalized / Flattery |
| Branded Company Bags | large | high | $100+ | Bulk / Branding |

Note: currency is inconsistent across items — some use `$` (USD) and some `£` (GBP) — with no unit conversion or normalization logic; this appears to be a seed-data authoring inconsistency rather than an intentional design.

Full verbatim descriptions (the note copy embedded in each item is the actual selling mechanism of the tool — the description doubles as an example note-text template):

- **Bespoke Postcard**: "A custom-designed postcard, printed and mailed for $1 per person - cheap enough to send at real volume while still feeling personal."
- **Prepaid Disposable Phone**: "Ship a cheap prepaid phone with a note (\"I'll call you at 10am\") and call it the moment it's delivered - control the timing precisely by hand-delivering via FedEx yourself."
- **Rubik's Cube**: "A classic Rubik's Cube, sent solved with a handwritten note tucked inside the box explaining the connection - something like: \"Every [problem] looks like an unsolvable puzzle from the outside. I promise it's simpler than it looks - got 15 minutes to talk it through?\" The puzzle sits on their desk as a reason to keep thinking about you."
- **Candle**: "A quality scented candle, sent with a short handwritten card explaining the gesture - something like: \"Thought you could use a moment to breathe amid the [X] chaos - lit one for you. Hope it buys you a few minutes to hear me out.\" Works well as a warm-up send once there's already some signal, not a cold opener."
- **Ship in a Bottle**: "A miniature ship-in-a-bottle model, shipped boxed with a handwritten note tying the craft to the pitch - something like: \"Built this to remind you - getting [outcome] right takes patience and the right hands. Would love 15 minutes to show you how we do it.\" The obvious care that goes into it is the point."
- **Compass**: "A small brass or pocket compass, sent with a handwritten note built around a \"finding direction\" angle - something like: \"Figured you could use one more thing pointing you in the right direction this quarter. Got 15 minutes for me to show you where we'd point yours?\" A desk-drawer keepsake that keeps your name attached to a simple, positive idea."
- **Mini Safe**: "A small combination lockbox or mini safe, sent locked with a handwritten note explaining the gimmick - something like: \"Didn't want to just hand this over, so I locked it. Reply and I'll send the combination - it's worth the 15 minutes, I promise.\" Great when you want to add real intrigue to a shortlist send; pair with a small item or gift card inside as the payoff."
- **Yo-Yo**: "A branded or novelty yo-yo, sent with a light, self-aware note - something like: \"Sales can feel like this thing - up, down, up, down. Figured I'd send something to fidget with while you read this. 15 minutes to talk about flattening the curve?\" Cheap, memorable, and easy to send at real volume to a broader list."
- **Chess Piece**: "A single, weighty chess piece (often a knight or king), sent alone with a handwritten note built around a strategy angle - something like: \"Every good move starts with seeing a few steps ahead. Wanted to send you this one piece as an opener - happy to bring the rest of the board to a quick call.\" Works especially well as a first touch to a strategic, senior-level contact."
- **Magnifying Glass**: "A classic magnifying glass, sent with a handwritten note built around a \"closer look\" angle - something like: \"Took a closer look at [Company] before reaching out - here's what stood out. Worth 15 minutes to see what else we found?\" A simple prop that doubles as proof you actually did your research."
- **Small Lego Kit**: "A small, self-contained Lego set, sent with a handwritten note built around a \"building something\" angle - something like: \"Figured we could build something together - starting small. Got 15 minutes to talk through what we'd build for [Company]?\" Playful enough to stand out, and cheap enough to send to a real shortlist rather than just one account."
- **Mini Cactus**: "A small potted cactus, sent with a handwritten note built around a \"low-maintenance\" angle - something like: \"Low-maintenance, like this ask: just 15 minutes, no watering required. Figured this could sit on your desk while you think it over.\" Hard to throw away and sits in view for weeks, giving you a natural reason to check back in on how it's doing."
- **Framed AI Portrait**: "An AI-generated portrait of the recipient (built from a public headshot, styled to reflect something specific about them - their industry, a hobby, or an achievement), printed and framed, sent with a handwritten note explaining it - something like: \"Had this made for you based on [specific detail] - hope it's a good likeness. Would love 15 minutes to explain why I went to the trouble.\" A highly personalized, hard-to-ignore piece that proves real research went into the send."
- **Printed T-Shirt with AI Photo**: "A t-shirt printed with an AI-generated image of the recipient (styled around something specific to them - their industry, a hobby, or an in-joke from their own LinkedIn posts), sent with a handwritten note explaining it - something like: \"Made you a shirt - figured you should have official merch for [specific detail]. Wear it well, and give me 15 minutes to explain myself.\" Cheaper and more playful than a framed portrait, and easy to send to a wider shortlist."
- **Handwritten Note**: "Just a genuinely handwritten note, no object attached - sent to explain plainly why you're reaching out, something like: \"No gift here, just wanted to write this by hand so you know a real person is behind it. Noticed [specific detail about them or their company] and wanted 15 minutes to explain why I thought of you.\" The cheapest possible send in the whole catalog, and still one of the highest-signal - almost nobody gets real handwritten mail anymore."
- **Flowers**: "A flower arrangement delivered to their office, with a card explaining why it's showing up - something like: \"Saw [specific reason - a win, an anniversary, a tough week] and wanted to send something to mark it. Would love 15 minutes when you have a moment.\" A classic, low-risk gesture that reads as thoughtful rather than salesy, especially well-timed around a trigger event."
- **Custom Logo Rug**: "A custom rug printed or woven with their own company logo, shipped directly to their HQ. Send a card separately with a photo of the rug in place and a note explaining it - something like: \"Figured your office could use a little more [Company] in it - sent this over for the entryway. Would love 15 minutes to tell you why.\" Bold enough to get talked about around the office, and the photo card means you don't have to wait to find out if it landed."
- **Hamper**: "A curated hamper (snacks, drinks, or a themed mix) shipped to their office for the whole team to share, with a card explaining the gesture - something like: \"This one's for the team, not just you - figured a hard week deserved something to share. Would still love 15 minutes of your time when things calm down.\" Built to be opened and passed around, so your name ends up mentioned to more people than just the recipient."
- **Branded Merchandise**: "A small bundle of your own company's branded merch (e.g. a hoodie, water bottle, or notebook set), sent with a card explaining why - something like: \"Wanted you to have a little [Your Company] gear before we've even had a proper conversation. Would love 15 minutes to make it worth wearing.\" Doubles as quiet brand exposure every time they use it, and works well once you've got some signal but haven't met yet."
- **Rubber Duck**: "A simple rubber duck, sent with a light, self-aware note explaining it - something like: \"Getting a straight answer out of [industry/problem] can feel like herding these things. Sent you one to keep on your desk - 15 minutes to talk through the real answer?\" Cheap, silly, and disarming enough to get a reply even from a genuinely cold contact."
- **Bobblehead**: "A custom bobblehead made to look like the recipient, sent with a handwritten note explaining it - something like: \"Had this made to look like you - hope it's a fair likeness. Would love 15 minutes to explain what prompted it.\" Unmistakably personal and impossible to mix up with generic swag, which makes it hard to ignore and easy to remember."
- **Neon Sign**: "A custom LED neon-style sign (their name, company, or a short line tied to your pitch), shipped to their office with a note explaining it - something like: \"Figured [Company] deserved something that lights up the room - literally. Would love 15 minutes to tell you why I sent it.\" Big, bold, and genuinely display-worthy, so it tends to stay up and keep getting noticed long after it arrives."
- **Custom Office Flag**: "A custom flag printed with their own company logo/colors, sized for an office flagpole or lobby stand, shipped with a note explaining the gesture - something like: \"Wanted [Company] to have a flag worth flying - hope it earns a spot in the lobby. Would love 15 minutes to tell you why I went to the trouble.\" A high-effort, high-visibility send reserved for accounts worth the investment - the scale and permanence of it signal how seriously you take the relationship."
- **Caricature**: "A custom drawn (or AI-generated) caricature of the recipient, framed or printed, sent with a handwritten note explaining it - something like: \"Had an artist take a crack at you - hope you can laugh at it as much as I did. Would love 15 minutes to make up for it.\" Playful rather than flattering, which makes it a good pick for lightening up a relationship that's felt a bit too formal."
- **Vinyl Record**: "A vinyl record curated to match their taste (sourced from a music mention in their bio, posts, or a podcast appearance), sent with a handwritten note explaining it - something like: \"Saw you mentioned [artist/album] - figured you'd want this on wax. Would love 15 minutes to talk shop once you've given it a spin.\" A well-chosen record shows real research went into the send and tends to stay on display rather than get filed away."
- **Branded Company Bags**: "Send a ton of branded bags their custom logo on the bags with a note attached" *(this entry is noticeably terser/less polished than the rest — reads as an unfinished seed row)*.

### 4.5 `COST_QUESTIONS` — Cost Fit quiz (5 questions)
Format: `{id, type?, optional?, prompt, placeholder?, sub?, row?, options:[{label, points:{tierId:n}}]}`.

| id | prompt | type/layout | options → points |
|---|---|---|---|
| `q1` | "How has the prospect responded to the other forms of outreach? (if applicable)" | free text, `optional:true`, placeholder "e.g. opened every email but hasn't replied yet..." | — |
| `q2` | "How large of an account do you believe this can be?" | `row:true` (horizontal options) | Smaller→`low:3`; Medium→`mid:3`; Huge→`high:3` |
| `q3` | "What is the general vibe of the company?" | has `sub`: "Does the founder seem very narrow, or are they a company that would likely appreciate a grand gesture? Research should give an accurate 'vibe' of the company as a whole." | Narrow - keep it modest→`low:2, mid:1`; Would likely appreciate a grand gesture→`high:2, mid:1` |
| `q4` | "What is the revenue tier of the business?" | vertical options | $1+ million→`low:3`; $5-$10 million→`low:3`; $10-$25 million→`mid:3`; $50-$70 million→`mid:2, high:1`; $70+ million→`high:3` |
| `q5` | "Do you truly believe you can close this account with a grand gesture?" | vertical options | Unsure...→`mid:1`; Yes, it's worth a shot!→`high:3` |

Scoring: `scoreQuiz()` sums `points` per tier across all answered non-text questions; `topScoreId()` selects the tier id with the highest accumulated score (ties resolved by iteration order of `COST_TIERS.map(t=>t.id)` = `['low','mid','high']`, i.e. `low` wins ties over `mid`/`high`, `mid` wins ties over `high`).

### 4.6 `RESEARCH_PROMPTS` — 11 research questions across 3 lenses
Format: `{id, lens, key, label, placeholder}`.

**Strategic lens:**
| key | label | placeholder |
|---|---|---|
| `priorities6to12` | "What are they obviously trying to accomplish in the next 6-12 months?" | "e.g. stated goal to expand into enterprise, mentioned in a recent interview..." |
| `recentLaunches` | "What have they recently launched, or are visibly doubling down on?" | "e.g. shipped a new pricing tier last month, posting about it weekly..." |
| `growthSignals` | "What growth signals show where they're investing? (hiring, fundraising, new markets, exec hires, rebrand)" | "e.g. hiring 3 AEs, raised a seed round in March..." |

**Business lens:**
| key | label | placeholder |
|---|---|---|
| `workingWell` | "What's working extremely well for them right now?" | "e.g. a specific channel or product line clearly outperforming others..." |
| `contrarianBelief` | "Founder or business beliefs that they speak about over & over?" | "e.g. publicly dismisses a tactic most competitors swear by..." |
| `customerSignal` | "What are customers/reviews saying they love about that the company?" | "e.g. reviews repeatedly praise X but complain about slow support..." |

**Personal lens:**
| key | label | placeholder |
|---|---|---|
| `obsessions` | "What does the founder repeatedly talk about outside of work (hobby, cause, story, metaphor)?" | "e.g. mentions running marathons in nearly every interview..." |
| `recurringStory` | "What stories does the founder tell?" | "e.g. always tells the story of bootstrapping the first version alone..." |
| `frustrations` | "What frustrates the business/founder in their personal life or business life?" | "e.g. visibly annoyed by people assuming they're VC-backed..." |
| `trueCares` | "What does the founder truly care about? (hobbies, books, media, sports)" | "e.g. constantly references sci-fi novels, plays competitive chess..." |

`RESEARCH_LENSES` metadata:
| id | name | description |
|---|---|---|
| `strategic` | Strategic | "Direction and worldview - what they're heading toward, and why." |
| `business` | Business | "Mechanics, bottleneck, and edge - how the business actually works, and where the friction is." |
| `personal` | Personal | "The human, not the bio - what makes them notice you as a person, not a vendor." |

`RESEARCH_SOURCES_TIP`: *"Recency beats breadth - a founder's last podcast appearance usually tells you more about current priorities than a 2-year-old About page. Work newest-first, then go back for historical context."*

`RESEARCH_SOURCE_GROUPS`:
| Label | Items |
|---|---|
| Company | Careers page & job posts, Docs / help centre, Investor info, Landing / product pages |
| First-Hand | Ask employee on email, Ask employee on LinkedIn |
| Long-form | Conference talks, Email sequences, Guest interviews, Newsletter archive, Podcast appearances, Webinars |
| News | News articles, Press releases |
| Public presence | Facebook, Instagram, Landing Page, LinkedIn, TikTok, X / Twitter, YouTube |
| Voice of customer | Landing Page Reviews, Reddit, Social Media Case Studies, Trustpilot, YouTube comments |

### 4.7 `PACKAGE_CHECKLIST` — 6 pre-ship checklist items
Format: `{h, b}` or `{h, bullets:[...]}`.

| Heading | Body / bullets |
|---|---|
| Handwritten note | "A short, genuinely handwritten (or handwriting-font) note beats a printed card every time." |
| No overt pitch inside the box | "The gift should feel like a gift, not a brochure. Save the pitch for the follow-up." |
| One clear next step | "A single, low-friction CTA on the note - a specific date/time or a simple reply, not a hard sell." |
| Sender identified clearly | bullets: Your name; Email address; Phone Number; Company; LinkedIn profile (shortened via Bitly); QR code to a book call (if possible). |
| Shipping address confirmed | "Verify the address (and that the recipient still works there) before you ship - check all available sources." |
| Tracking number logged | "Log the tracking number and expected delivery date against the account so follow-up timing is exact." |

### 4.8 `SEND_GUIDE` — 4 how-to-send guidance cards
| Heading | Body |
|---|---|
| Carriers | "For US domestic, USPS Priority (2-3 days) is the default for most sends. Use FedEx/UPS for anything time-sensitive or over $75 in value so it stays trackable and insured." |
| Packaging | "Match the box to the gift - an unbranded, well-packed box outperforms an oversized shipping carton. Avoid loud outer branding that screams \"vendor mailer.\"" |
| Timing | "Avoid shipping on a Friday - it sits over the weekend. Aim to land Tuesday-Thursday so your follow-up call or email lands the same week." |
| Address collection | "Never ask for a home or office address cold. Confirm it via a short, low-friction email or call first - \"Where should I send this?\"" |

### 4.9 `SEND_METHODS`
| id | label |
|---|---|
| `usps` | USPS Priority |
| `fedex` | FedEx / UPS Express |
| `courier` | Local courier / hand-delivered |
| `other` | Other |

### 4.10 `MESSAGE_SECTIONS` — the 4 messaging moments
Format: `{id, num, tag, label, desc, placeholder, hasSubject, subjectPlaceholder?}`.

| id | num | tag | label | desc | hasSubject |
|---|---|---|---|---|---|
| `beforeLanding` | 01 | Optional | Before Landing Message | "A quick heads-up - voicemail, text, or email - sent before the gift arrives, so it doesn't land looking like random mail." | yes (`Subject line...`) |
| `insideMessage` | 02 | In The Box | Message Inside | "What the handwritten note actually says once they open the box." | no |
| `publicPosting` | 03 | Optional | Public Posting | "A social post about the send - LinkedIn, X, etc. - if you plan to make the gift public." | no |
| `followup` | 04 | After It Lands | Follow-Up Message | "Your call opener or nudge email once tracking shows it's delivered." | yes (`Subject line...`) — but rendered specially as 4 separate emails, not a single card |

### 4.11 `TEMPLATE_BANK` — seeded message templates
Structure: `{ sectionId: [ {cat, items:[{id, title, subject, text}]} ] }`.

Only **one** seed template exists in the whole bank, under `beforeLanding` → category `General`:

- **id**: `get-ready-for-this` (auto-generated pattern otherwise is `sectionId__catSlug__index`)
- **title**: "Get Ready For This"
- **subject**: "get ready for this..."
- **text** (verbatim):
  > Willing to bet 5 inches of height (that I absolutely need) that we are going to blow you away in 48 hours...
  > We are sending something absolutely awesome your way to {insert address}.
  > Get prepared to check it out {name}.
  >
  > Love,
  > {Your Name}

`insideMessage`, `followup`, and `publicPosting` all seed as **empty arrays** — no starter templates for those sections; the tool relies on the user (or a future content pass) to populate the bank via "+ New Template".

An IIFE `ensureTemplateIds()` runs once at load to backfill any missing `id` on seed items using the pattern `sectionId + '__' + cat.replace(/\s+/g,'_') + '__' + idx`.

---

## 5. UI Components

### 5.1 Cards (`.card`)
Generic bordered/shadowed content block with `h3`/`p`. Used for research prompts, checklist container, and send-guide entries. Hover raises shadow and darkens border slightly (`--shadow` → `--shadow-hover`).

### 5.2 Chips (`.chip`)
Pill-shaped toggle buttons (uppercase, bold, letter-spaced). Used for send-method selection and template-category filters (`.chip.small` variant, smaller padding/font). `.active` state fills with the mimeo-green background/ink. Hover lifts (`translateY(-1px)`) and raises shadow, but not when already active.

### 5.3 Size picker (`.size-card`)
Large clickable cards (min-height 260px) shown on the Goods Catalog step — one per `SIZES` entry — each with a count pill, big title, and description. Hover lifts the card and turns the border stamp-green.

### 5.4 Goods Catalog modal (`openGoodsModal` / `renderGoodsModal`)
Triggered by clicking a size card. Modal title: "`{Size}` Physical Goods". Body groups goods (from `getGoods()`, which merges seed + custom-added − custom-removed, with custom-edits applied) by `COST_TIERS` into three sub-sections (Low Cost / Mid Cost / High Cost), each rendered as a `table.goods-table` with columns: Good / Cost (tier badge + cost range + category) / Description (+ optional `whenToUse` italic note and `examples` bullet list, both currently always empty in seed data) / Action.

Row actions per good:
- **"Use this good" / "Selected ✓"** — sets `plan.good = {id, name, tier, costRange}` (a lightweight snapshot, not the full object) and marks the row `.selected` (green tinted background).
- **Edit** — swaps the row for an inline `editGoodRowHtml()` form (name, cost range, size `<select>`, tier `<select>`, category, description) with Save/Cancel. Save calls `editGood(id, updates)`.
- **Delete** — opens the custom confirm dialog ("Delete this good? ... This can't be undone."); on confirm calls `deleteGood(id)`. If the deleted good is the currently selected `plan.good`, the plan selection is cleared.

Below each tier's table, a dashed **"+ Add a good"** toggle reveals an `add-good-form` (name, cost range, category, description) scoped to that size+tier combination (`addGoodFormHtml`/`wireAddGoodForms`), saving via `addGood()`.

If a tier has zero matching goods for the selected size, an italic empty-state message renders instead of a table: *"No `{size}` goods in this tier yet."*

The modal supports a **fullscreen toggle** (`.modal-fullscreen-btn`, top-right expand/collapse icon) that expands the modal box to `100vw/100vh` with no border radius — shared by all three modal types (Goods Catalog, Follow-up email, Template Bank) via `fullscreenBtnHtml()`/`wireFullscreenBtn()`.

### 5.5 Confirm dialog (`#confirmOverlay`)
Replaces native `confirm()`. A promise-based helper `showConfirm({title, message, confirmLabel, cancelLabel})` returns a Promise resolved `true`/`false` by the Confirm/Cancel buttons, by clicking the overlay backdrop, or by pressing `Escape`. Used for: deleting a good, deleting a research finding, deleting a template, deleting a template category, and clearing the whole plan. Icon is a static `!` in a warm-toned circle; primary action button is `.btn.primary.danger` (warm/orange).

### 5.6 Toast (`#toast`)
A single bottom-center transient notification (`toast(msg)`), auto-hides after 1600ms via a debounced `setTimeout`. Used for nearly every mutating action's confirmation ("Copied", "Deleted", "Saved changes", "Added to catalog", "Finding added", "Cost tier set to X", "Set as the good for this plan", "Email saved", "Template applied", "Category renamed/added/deleted", validation nudges like "Give it a name first" / "Add some finding text first" / "That category already exists" / "General is the default category and can't be deleted", etc.).

### 5.7 Quiz UI (shared engine)
Generic renderer used by both Research... no — used specifically by Cost Fit (`COST_QUESTIONS`); the "quiz" visual style (`.quiz-q`, `.quiz-opts`, `.quiz-opt` radio-styled rows with a `.dot` indicator, `.quiz-result` callout) is a shared component (`quizQuestionsHtml`/`wireQuizOptions`/`scoreQuiz`/`topScoreId`) explicitly commented as **"GENERIC QUIZ ENGINE (used by Cost Fit + Research Fit)"** in the source, though in the current build only Cost Fit actually invokes it (Research Fit uses its own bespoke finding-card UI instead). Options support a `row:true` layout (horizontal, evenly split) or default vertical stacking, plus a `sub` line of clarifying text under the question. A `type:'text'` question renders a free-text `<textarea>` instead of options (used for `q1`).

### 5.8 Goods Plan tracker panel (`#ppBody`, `renderPlanPanel()`)
Lives in the sidebar beneath the step nav, inside the "Goods Plan" divider section. Renders one `.plan-section` per plan facet:
- **Good** — selected good name + tier badge, or "Not selected yet".
- **Cost Tier** — tier name + range, or "Not set yet".
- **Research Angle** — the `plan.research.opportunity.angle` text (with a "N findings across 3 lenses" sub-line if findings exist), or if only findings exist but no angle, an italic "N findings logged - angle not set yet", or "Not set yet" if nothing at all.
- **Package Checklist** — "N/6 checked" count.
- **Send Method** — chosen method label + send notes sub-line, or "Not set yet".
- One row per non-followup `MESSAGE_SECTIONS` entry — shows the trimmed text or "Not written yet".
- **Follow-Up Emails** — "N/4 written" or "Not written yet".

Each row has a "Change"/"Set" (or "Edit →" for message rows) link that calls `setActiveStep()` to jump straight to the relevant step (`data-jump`).

### 5.9 Template Bank trigger + modal
**Trigger** (`.tpl-trigger`): a dashed-border button embedded in each message card and in the follow-up email modal, showing a stamp-colored icon (`&#9776;` hamburger glyph), "Browse Template Bank" title, a live count sub-line ("`N` templates available - pick one to start from"), and an arrow. Clicking opens `openTemplateModal(sectionId)`.

**Modal** (`renderTemplateModal()`), scoped per message section:
- Header: "Template Bank" eyebrow + section label + section description, plus header actions: fullscreen toggle, **"+ New Template"**, Close.
- Controls row: a live-filtering search box (`#tplSearch`, matches on `title`/`subject`/`text` case-insensitively — cursor position is explicitly preserved across re-renders via `setSelectionRange`), a row of category filter chips (`All N` + one chip per category with a live item count, plus a `⚙ Manage Categories` toggle chip).
- **Category management panel** (`.tpl-cat-manage`, toggled by the gear chip): lists every category with a rename (`&#9998;`) and delete (`&times;`, hidden for `General`) action per row, plus an "add new category" input + button at the bottom. Renaming validates non-empty/non-duplicate names; deleting requires confirm and reassigns all member templates to `General`; `General` itself cannot be deleted or renamed away (guarded in `deleteCategory`).
- **Template grid** (`.tpl-grid`), grouped by category with a `.tpl-group-label` heading per group. Each `.tpl-card` shows title, edit (`&#9998;`) and add (`+`) icon-buttons, subject (if present), body text (`white-space:pre-wrap`, capped `max-height:150px` with internal scroll), and a full-width **"Use this template"** button.
- **Empty states**: if the section has zero templates at all → "No templates yet" empty state with a pencil icon; if templates exist but none match the current search/category filter → "No matches — Nothing found for "`{query}`" - try a different search term." with a magnifying-glass icon.
- **New/Edit form** (`templateEditFormHtml()`): inline card with Title, Category `<select>`, Subject, Body textarea, and action row — Delete (hidden for a brand-new/unsaved template, id `'NEW'`), Cancel, "Save Template".
- **"Use this template"** behavior: if the modal was opened from a specific follow-up email slot (`followupModalIdx !== null` and section is `followup`), it writes into that specific `plan.followupEmails[idx]` and reopens the follow-up email modal; otherwise it writes into `plan[section.id]` (and `plan[section.id+'Subject']` if applicable), closes the modal, and re-renders the whole app.

### 5.10 Follow-up email modal (`openFollowupEmailModal(idx)` / `renderFollowupEmailModal()`)
A dedicated modal per follow-up slot (index 0–3), titled "Email `{idx+1}` of `{plan.followupEmails.length}`". Contains the same template-bank trigger, a subject input, a body textarea with live character count, and "Save Email". Saving writes `plan.followupEmails[idx] = {subject, body}` and returns to the Messaging step.

### 5.11 Add-good inline form / Edit-good inline form
Dashed-bordered forms (`.add-good-form`) reused for both adding a brand-new catalog item (scoped to a specific size+tier combo) and editing an existing item's row. Two-column responsive grid (collapses to 1 column ≤640px) for paired fields (Name/Cost, Size/Tier).

---

## 6. Business Logic / Functions

### 6.1 Data-merging & persistence functions
- `defaultPlan()` — returns the canonical empty plan shape (see §7 for the full schema).
- `loadPlan()` / `persistPlan()` — read/write `localStorage['physicalgoods_plan']`. `loadPlan()` also actively **migrates** legacy shape by deleting deprecated top-level keys (`researchAngle`, `researchAnswers`, `researchNotes`) and `Object.assign`-merging onto `defaultPlan()` so new fields introduced later always exist; it also normalizes `followupEmails` to always be exactly a 4-element array of `{subject, body}` objects (truncating extras, padding shortfalls, coercing missing subject/body to empty strings).
- `loadCustomGoods()` / `persistCustomGoods()` — `localStorage['physicalgoods_custom_goods']`, shape `{added:[], removed:[], edited:{}}`.
- `getGoods()` — computes the effective catalog: `SEED_GOODS` minus any id in `customGoods.removed`, concatenated with `customGoods.added`, then any id present in `customGoods.edited` has those field overrides merged in. This is the **single source of truth** every catalog-rendering function reads from — seed data itself is never mutated.
- `addGood(g)` / `deleteGood(id)` / `editGood(id, updates)` — mutate `customGoods` and persist. `deleteGood` behaves differently for seed vs. custom items: seed items get added to the `removed` blacklist (soft-delete, reversible in theory by clearing storage), custom-added items are spliced out entirely (hard-delete); either way, any `edited` override for that id is also cleared, and if that good was the plan's selected good, the plan selection is nulled and persisted. `editGood` similarly branches: if the id belongs to a custom-added item, it patches that array entry directly; otherwise it records a delta in `customGoods.edited[id]`. If the currently selected `plan.good` matches the edited id, the plan's lightweight snapshot (`name`/`tier`/`costRange`) is refreshed too.
- `slugify(s)` — generates a URL-safe id from an arbitrary name (lowercase, non-alnum → `-`, trim leading/trailing `-`, fallback `'good'`); used when adding a new custom good, with a timestamp suffix appended if the slug collides with an existing id.
- Template persistence: four parallel localStorage-backed stores — `physicalgoods_template_edits` (per-item field overrides), `physicalgoods_template_adds` (brand-new custom template items), `physicalgoods_template_deletes` (ids of seed items the user deleted, i.e. a tombstone list, since seed templates can't be truly removed from the constant), `physicalgoods_template_cats` (user-created category names not implied by any seed item). Each has a `load*`/`persist*` pair identical in shape to the goods pattern.

### 6.2 Template Bank composition logic
- `getAllTemplateItems(sectionId)` — walks `TEMPLATE_BANK[sectionId]` groups, skips any item whose id is in `customTemplateDeletes[sectionId]`, applies any `customTemplateEdits[sectionId][id]` override via `Object.assign`, then appends `customTemplateAdds[sectionId]` items (tagged `custom:true`, skipping deleted ones too, category defaults to whatever the add specified or falls through to edits).
- `getCategoryList(sectionId)` — union of every effective item's `cat` plus any `customCategories[sectionId]` entries (so an empty, newly-created category still shows up even with zero templates), falling back to `['General']` if the set would otherwise be empty.
- `getTemplateGroups(sectionId)` — maps each category name to `{cat, items: [...]}` by filtering `getAllTemplateItems()`.
- `renameCategory(sectionId, oldName, newName)` — validates non-empty and non-duplicate, then rewrites the `cat` field via `customTemplateEdits` for every seed item currently in `oldName` and directly mutates `cat` on any matching custom-added item, plus renames the entry in `customCategories` if present. Persists all three template stores.
- `deleteCategory(sectionId, name)` — refuses to delete `'General'`; otherwise reassigns every member item's effective category to `'General'` (same edit/mutate split as rename) and removes the name from `customCategories`.
- `addCategory(sectionId, name)` — validates non-empty/non-duplicate, pushes into `customCategories[sectionId]`.
- `templateMatches(item, q)` — case-insensitive substring match against `title`, `subject`, and `text`.
- `findTemplateById(groups, id)` — linear search across the currently computed groups (used for delete confirmation labels and for "Use this template").

### 6.3 Step completion / progress logic (`stepStatus(id)`)
| Step | `'done'` when | `'progress'` when | else |
|---|---|---|---|
| `catalog` | `plan.good` is set | — | `pending` |
| `cost` | `plan.costTier` is set | — | `pending` |
| `research` | `plan.research.opportunity.angle` non-empty (trimmed) | `findingsCount() > 0` | `pending` |
| `checklist` | all `PACKAGE_CHECKLIST.length` items checked | 1+ but not all checked | `pending` |
| `send` | `plan.sendMethod` is set | — | `pending` |
| `followup` | all message sections + follow-up-emails-as-one-unit are filled (`total = MESSAGE_SECTIONS.filter(non-followup).length + 1`) | some but not all filled | `pending` |

`findingsCount()` sums the lengths of every array under `plan.research.strategic/business/personal`.

### 6.4 Cost-tier scoring (`scoreQuiz`, `topScoreId`)
See §4.5 — straightforward additive point scoring per tier with first-wins tie-breaking in `['low','mid','high']` order.

### 6.5 Plan-to-text export (`planText()`)
Builds a full plain-text dump of the entire plan (title "PHYSICAL GOODS PLAN") for clipboard export via the sidebar's **Copy Plan** button → `copyText(planText())` → `navigator.clipboard.writeText()` with toast feedback ("Copied"/"Copy failed"). Sections emitted in order: Good, Cost Tier, RESEARCH (grouped by lens, only lenses/prompts with at least one finding, each finding rendered as `- {text} ({source, confidence, date})`), OUTREACH ANGLE, Package Checklist (as `[x]`/`[ ]` lines), Send Method + Send Notes, each non-followup message section (label + optional Subject line + body, falling back to `(none yet)`), and FOLLOW-UP EMAILS (all 4 slots, each with Subject + body, falling back to `(none yet)`).

### 6.6 Misc helpers
- `esc(s)` / `escAttr(s)` — manual HTML-escaping (amp/lt/gt, plus quote-escaping for attribute contexts) used everywhere strings are interpolated into template literals — the app has no templating engine, so this is the app's entire XSS/HTML-injection defense.
- `tierById(id)` — looks up a `COST_TIERS` entry by id.
- `checklistKey(item)` — slugifies a checklist item's heading into a storage key.
- `promptById(id)` — looks up a `RESEARCH_PROMPTS` entry by id.
- `newFindingId()` — generates a pseudo-unique id (`'f' + timestamp36 + random36`).
- `sourceGroupsHtml()` — renders the "Where to look" tip + source-group chip cards.

---

## 7. `plan` — The Central State Object

`plan` is the single mutable object representing the in-progress Goods Plan for one prospect, persisted whole to `localStorage['physicalgoods_plan']` after (almost) every mutation via `persistPlan()`. Shape (from `defaultPlan()`):

```js
{
  good: null,                 // {id, name, tier, costRange} snapshot, or null
  costTier: null,             // 'low' | 'mid' | 'high' | null
  costAnswers: {},            // { [questionId]: optionIndex | textString }
  research: {
    strategic: { priorities6to12: [], recentLaunches: [], growthSignals: [] },
    business:  { workingWell: [], customerSignal: [], contrarianBelief: [] },
    personal:  { obsessions: [], recurringStory: [], frustrations: [], trueCares: [] },
    opportunity: { angle: '' },
  },
  checklist: {},               // { [checklistKey]: true|false }
  sendMethod: null,            // 'usps' | 'fedex' | 'courier' | 'other' | null
  sendNotes: '',
  beforeLanding: '', insideMessage: '', beforeLandingSubject: '', publicPosting: '',
  followupEmails: [
    {subject:'', body:''}, {subject:'', body:''}, {subject:'', body:''}, {subject:'', body:''}
  ],
}
```

Each research finding pushed into a `research.<lens>.<key>` array has shape `{id, text, source, date, confidence, addedAt}` where `confidence` is `'low'|'medium'|'high'` (default `'medium'`) and `addedAt` is `Date.now()`.

### Other localStorage keys
| Key | Contents |
|---|---|
| `physicalgoods_plan` | the `plan` object (§7) |
| `physicalgoods_custom_goods` | `{added:[], removed:[], edited:{}}` — user catalog customizations |
| `physicalgoods_template_edits` | `{ [sectionId]: { [templateId]: {title, subject, text, cat} } }` |
| `physicalgoods_template_adds` | `{ [sectionId]: [ {id, title, subject, text, cat} ] }` |
| `physicalgoods_template_deletes` | `{ [sectionId]: [templateId, ...] }` — tombstones for seed templates |
| `physicalgoods_template_cats` | `{ [sectionId]: [categoryName, ...] }` — user-created empty/extra categories |

### Transient (non-persisted) module-level state variables
`activeStep`, `goodsModal`, `editingGoodId`, `templateModalSection`, `templateCatManageOpen`, `templateCatEditing`, `templateEditingId`, `followupModalIdx`, `templateModalCat`, `templateModalSearch`, `optionalExpanded` (a map of message-section-id → expanded boolean for the collapsible optional cards), `addingFindingFor` (which research prompt currently has its add-finding form open), `modalFullscreen` (shared fullscreen toggle state for whichever modal is open), `_confirmResolve` (the pending Promise resolver for the active confirm dialog), `_toastTimer` (on `window`, the pending toast auto-hide timeout handle).

---

## 8. Styling System

### 8.1 Design tokens (CSS custom properties, `:root`)
| Token | Value | Purpose |
|---|---|---|
| `--paper` | `#FFFFFF` | Base page background |
| `--paper-raised` | `#FFFFFF` | Card/surface background (same as paper — relies on border/shadow for separation) |
| `--paper-tab` | `#FFFFFF` | Sidebar background |
| `--ink` | `#14181B` | Primary text |
| `--ink-soft` | `#5B6560` | Secondary text |
| `--ink-faint` | `#757E78` | Tertiary/label text |
| `--stamp` | `#1E6B45` | Primary brand accent (deep green) — focus rings, active nav, primary buttons |
| `--stamp-ink` | `#FFFFFF` | Text-on-stamp color |
| `--mimeo` | `#2F8F5B` | Secondary accent green (selection highlight, active chips) |
| `--mimeo-ink` | `#E6F4EC` | Pale green tint (active-chip text / tinted backgrounds) |
| `--line` | `#E4E9E6` | Default border |
| `--line-strong` | `#CCD5D0` | Emphasized border |
| `--good` | `#2F8F5B` | Success/progress green (progress bar fill, checked checkbox, in-progress step outline) |
| `--warn` | `#B4691A` | Warning/danger amber-orange (delete actions, optional-section accents) |
| `--tier-mid-bg` | `#F1EBDC` | Mid-cost tier badge background |
| `--tier-mid-ink` | `#8A6D3B` | Mid-cost tier badge text |
| `--shadow` | `0 1px 0 rgba(20,24,27,.03), 0 8px 20px -12px rgba(20,24,27,.14)` | Default card elevation |
| `--shadow-hover` | `0 1px 0 rgba(20,24,27,.03), 0 14px 30px -14px rgba(20,24,27,.22)` | Hover elevation |
| `--radius` | `8px` | Default corner radius |
| `--sidebar-w` | `372px` | Rail width |
| `--font-display` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Headings/labels/buttons |
| `--font-body` | same stack as display | Body text/inputs |
| `--font-mono` | `ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace` | Cost figures, character counts |
| `--ease` | `cubic-bezier(.2,.7,.3,1)` | Standard animation easing |
| `--dur-fast` | `.12s` | Fast transition duration |
| `--dur-base` | `.18s` | Base transition duration |

Additional literal colors used inline outside the token system (not promoted to variables): `#231F2E` (topbar accent bar), `#FBEEE0` / `#E0A868` (optional-section warm tint + dashed border), `#FAFBFA` (table row hover), `#F7F8F7` (button hover background).

### 8.2 Typography
- Base body font-size `14.5px`, line-height `1.5`, font stack = system UI stack (no external/custom font loaded).
- `.eyebrow` / `.ph-eyebrow` / `.modal-eyebrow` / group titles all share a pattern: `font-display`, `font-weight:700`, `text-transform:uppercase`, `letter-spacing:.04–.08em`, small size (10–12px), muted or accent color — this uppercase-eyebrow convention is the app's primary hierarchy signal above headings.
- Page `<h1>` (`.page-header h1`): 23px, weight 800, `letter-spacing:-.01em`, `text-wrap:balance`.
- Modal `<h2>`: 20px, weight 800.
- Buttons and nav labels use `font-display` at 11–13px, weight 700, pill-shaped (`border-radius:999px`) for `.chip`/`.btn`, rounded-rect for other surfaces.

### 8.3 Component style patterns
- **Pill buttons everywhere**: chips, primary/ghost/danger buttons, template-bank tags, and tier badges all use `border-radius:999px`, reinforcing a soft, rounded, "form/stamp" visual identity (consistent with variable names like `--stamp`, `--mimeo` — suggesting a deliberate "vintage mimeograph/rubber-stamp office supply" design metaphor threaded through naming even though the literal visuals are a fairly clean modern SaaS look).
- **Card elevation model**: every raised surface uses the same two-tier `--shadow`/`--shadow-hover` pair plus a `border-color` shift on hover, giving consistent depth language across `.card`, `.size-card`, `.tpl-card`, `.source-card`, `.msg-card`.
- **Tier badges** (`.tier-badge`): mono font, uppercase, pill, three color variants keyed to cost tier (`tier-low` = green tint, `tier-mid` = tan/brown tint, `tier-high` = orange tint) — also reused for research-finding **confidence badges** via `CONFIDENCE_BADGE` mapping (`low→tier-high`, `medium→tier-mid`, `high→tier-low` — note the intentional inversion: a *low-confidence* finding borrows the *high-cost-tier* (orange/warning) badge color, and a *high-confidence* finding borrows the *low-cost-tier* (green) badge color, i.e. green = good/certain, orange = caution/uncertain, independent of the tier semantics the classes were originally named for).
- **Optional message cards**: distinguished throughout via a warm accent (`--warn`/`#E0A868`) instead of the stamp/mimeo green — dashed borders, warm-tinted numbers/tags — creating a consistent "this is optional, treated differently" visual language distinct from required steps.
- **Custom checkbox** (`.check-item input[type=checkbox]`): fully re-skinned via `appearance:none` + a manually drawn checkmark (`::after` with rotated border) rather than relying on native OS checkbox styling.
- **Scrollbars**: custom-styled webkit scrollbars app-wide (`10px`, rounded thumb, transparent track) for visual consistency across the many independently-scrolling regions (rail, content, modal body).

---

## 9. Copy/Content Inventory (verbatim, notable strategic microcopy)

- Page eyebrow taglines follow a consistent voice: direct, second-person, faintly witty ("What has to be true about the box before it ships.", "Carrier, packaging, and timing guidance, plus the method for this send.").
- Research step framing treats research as building toward one single "Outreach Angle" — explicit hint: *"What's the absolute best thing worth saying to this company given all of the above?"*
- The "Where to look" tip explicitly instructs a recency-first research methodology (§4.6).
- The single seeded before-landing template ("Get Ready For This") is written in a hype/urgency voice with a self-deprecating joke ("5 inches of height (that I absolutely need)") — notably different in tone from the more consultative, ROI-driven note copy embedded in the goods catalog descriptions. This suggests two different voice registers were used by whoever authored the seed content: catalog notes are consultative/curiosity-driven ("Would love 15 minutes..."), while the one template-bank example is closer to hype-copywriting.
- Nearly every catalog item's `desc` field embeds a **ready-to-use note script** in quotation marks ending in a 15-minute meeting ask — this is the tool's core mechanic: the physical good's description doubles as message inspiration, reinforcing that the "gift" and the "ask" must be tightly coupled in a single coherent narrative (metaphor of the object → specific ask).
- Validation/system toasts are terse and imperative: "Give it a name first", "Add some finding text first", "Give the category a name first", "That category already exists", "General is the default category and can't be deleted".
- Empty-state copy is encouraging rather than clinical: "No templates yet" / "Add some to the **{section}** bank and they'll show up here, ready to pick and drop straight into your plan."
- Collapsed optional-message hint copy explicitly frames skipping as valid: *"Skip this if it doesn't apply - click to add it."*

---

## 10. Notable UX Patterns & Edge Cases

- **Wizard step-3 numbering inconsistency**: the sidebar/`STEPS` array numbers Goods Catalog as step 3 (`num:3`), and `renderCatalogStep()`'s page header also literally says "Step 3 of 6" — consistent. However the Messaging step's sub-copy says "three moments of contact" while displaying four nodes in the flow diagram (Before Landing / Inside / Public Posting / Follow-Up) — a minor copy/reality mismatch worth flagging if editing that copy later.
- **Currency inconsistency in the seed catalog**: some goods are priced in `$` and others in `£` with no currency field or normalization (see §4.4) — likely an authoring oversight rather than intentional multi-currency support, since `COST_TIERS` ranges are all `$`-denominated and the quiz/tier logic has no currency awareness.
- **`whenToUse` / `examples` fields are fully wired in the UI (rendering an italic "when to use" line and a bulleted examples list) but are seeded empty on every single catalog item** — a clear extension point that was scaffolded but never populated with content.
- **Soft-delete vs hard-delete asymmetry**: deleting a *seed* good only blacklists its id (`customGoods.removed`), meaning the underlying `SEED_GOODS` constant is untouched and a `localStorage.clear()` would "resurrect" all previously deleted seed goods — whereas deleting a *custom* (user-added) good is a true removal from the `added` array. This distinction is invisible to the end user but material for anyone debugging "deleted item came back" reports.
- **Template deletes are tombstones, not removals**: same pattern as goods — `customTemplateDeletes[sectionId]` is a blacklist array checked everywhere `getAllTemplateItems`/groups are computed, so seed templates are never actually deleted from `TEMPLATE_BANK`.
- **Category deletion is non-destructive to content**: deleting a template category doesn't delete its templates, it reassigns them to `General` — avoids silent data loss but means "delete category" and "delete templates in category" are two different, unlabeled-as-such operations a user might conflate.
- **Optional-section collapse defaults to collapsed on every fresh render** (`optionalExpanded` is a plain in-memory object, not persisted) — so navigating away and back to the Messaging step, or reloading the page, always re-collapses Before Landing / Public Posting even if they contain saved content (the "filled" hint text at least surfaces that there's saved content without expanding).
- **Modal reuse pattern**: a single pair of DOM nodes (`#modalOverlay` / `#modalBox`) is reused for all three modal types (Goods Catalog, Template Bank, Follow-up email) by fully replacing `innerHTML` and re-wiring listeners each render — there is only ever one modal open at a time, and `closeGoodsModal()` (despite its goods-specific name) is the universal close handler for all of them, resetting every modal-related state variable regardless of which modal was open.
- **Search input caret preservation**: the template search box explicitly re-focuses itself and calls `setSelectionRange` after each re-render triggered by typing, because the naive `innerHTML` re-render approach would otherwise reset cursor position to the end (or lose focus) on every keystroke — a manual workaround necessitated by the app's "re-render everything via innerHTML" architecture rather than a virtual-DOM diffing approach.
- **No backend / no multi-user awareness**: "Signed in as Dan" and "Sign out" in the top bar are static decoration; there is no auth, and all data is local to the browser profile (a page reload on a different device/browser starts from `defaultPlan()`).
- **XSS-safety by convention only**: since the whole app is built by string-concatenating into `innerHTML`, every single interpolation point must remember to call `esc()`/`escAttr()` — this is manually applied consistently throughout the reviewed code, but there's no structural guarantee (e.g. no templating library) preventing a future edit from forgetting to escape a new field.
- **Full re-render on nearly every mutation**: most mutating handlers call the whole-page `render()` (nav + progress + step content + plan panel + mobile topbar) rather than patching just the changed DOM node, trading performance headroom for implementation simplicity — acceptable given the modest data volumes involved (27 goods, ~11 research prompts, a handful of templates) but something to note if the catalog/template bank grows substantially.
- **Keyboard support is uneven**: quiz options and collapsible optional-message headers are explicitly keyboard-operable (`tabindex`, `role`, Enter/Space), but many other interactive elements (size cards, template cards' inline icon buttons, chip filters) are plain `<button>`s that get native keyboard support "for free" rather than through explicit ARIA wiring — functional, but accessibility semantics (e.g. `aria-checked` on quiz options, `role="radiogroup"`) were only added where the custom-styled control most obviously needed it.

---

## 11. Function Reference Index (quick lookup)

Grouped by concern; see §6 for detailed behavior of the most important ones.

**Persistence**: `defaultPlan`, `loadPlan`, `persistPlan`, `loadCustomGoods`, `persistCustomGoods`, `loadCustomTemplateEdits`, `persistCustomTemplateEdits`, `loadCustomTemplateAdds`, `persistCustomTemplateAdds`, `loadCustomTemplateDeletes`, `persistCustomTemplateDeletes`, `loadCustomCategories`, `persistCustomCategories`.

**Goods catalog**: `getGoods`, `addGood`, `deleteGood`, `editGood`, `slugify`, `goodRowHtml`, `editGoodRowHtml`, `openGoodsModal`, `closeGoodsModal`, `renderGoodsModal`, `addGoodFormHtml`, `wireAddGoodForms`, `renderCatalogStep`.

**Template bank**: `getAllTemplateItems`, `getCategoryList`, `getTemplateGroups`, `renameCategory`, `deleteCategory`, `addCategory`, `templateMatches`, `findTemplateById`, `templateEditFormHtml`, `openTemplateModal`, `renderTemplateModal`.

**Quiz engine**: `scoreQuiz`, `topScoreId`, `quizQuestionsHtml`, `wireQuizOptions`, `renderCostStep`.

**Research**: `findingRowHtml`, `findingFormHtml`, `researchCardHtml`, `renderResearchStep`, `findingsCount`, `newFindingId`, `promptById`, `sourceGroupsHtml`.

**Checklist / Send**: `renderChecklistStep`, `checklistKey`, `renderSendStep`.

**Messaging / follow-up**: `msgCardHtml`, `msgFlowStepHtml`, `renderMsgFlowHtml`, `renderFollowupStep`, `renderFollowupEmailsHtml`, `openFollowupEmailModal`, `renderFollowupEmailModal`.

**Nav / shell**: `stepStatus`, `doneStepCount`, `renderNav`, `renderProgress`, `setActiveStep`, `pageHeaderHtml`, `stepNavHtml`, `wireStepNav`, `renderMobileTopbar`, `render`.

**Plan panel / export**: `renderPlanPanel`, `planSectionHtml`, `planText`.

**Shared UI utilities**: `esc`, `escAttr`, `toast`, `showConfirm`, `closeConfirm`, `copyText`, `tierById`, `fullscreenBtnHtml`, `wireFullscreenBtn`.
