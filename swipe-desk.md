# Swipe Desk / "Cold Email Bank" — Full Documentation

> File: `outreach-work/swipe-desk.html` (single-file HTML/CSS/JS app, ~670 KB, 4,576 lines)
> Page `<title>`: **Cold Email Bank**. App shell logo mark: **"CB"** / "Cold Email Bank — Writing Workbench".
> Sibling tools referenced by the shared "Outreach Tools" back-link (`index.html`): `physical-goods.html`, `strategy-doc.html`, `vsl-loom.html`.

---

## 1. Overview

**Swipe Desk** (internally titled "Cold Email Bank") is a self-contained, client-side reference-and-drafting workbench for writing B2B cold email outreach. It is one tool in an "Outreach Tools" suite (a topbar back-link reads "← Outreach Tools" and points at a shared `index.html`), sitting alongside tools for physical-goods offers, strategy docs, and Loom-based VSLs.

Its purpose is to be the single place a salesperson/agency operator goes to:
1. **Browse a massive, curated library** of cold-email templates, real sent examples, structural frameworks, swipe-file lines (subject lines, openers, body lines, CTAs, P.S. lines), power-word vocabulary, phrases to avoid, and personalization angles — all sourced and attributed to named cold-email practitioners/creators (Frank Brothers / "Penn Frank", Eric Nowoslawski, Matt Lucero, Christian Bonnier, and the Instantly and Smartlead brands/tools).
2. **Study distilled "rules & principles"** — ~431 individual lessons, each attributed to a person, a theme category, and a named source document/video, organized so the same theme (e.g. "Subject Lines") can be compared across all six sources side by side.
3. **Run pre-send quality checks** — both a fully automated 12-point checker (regex/word-count based) and ~16 human checklists (folded in from the Rules content) with persistent checkboxes.
4. **Assemble an actual email draft (or multi-email sequence)** in a persistent right-hand rail by clicking "+" buttons throughout the library, edit it, save/reload named sequences, and copy the whole thing to clipboard.
5. **Jump to source resources** — 11 linked Google Docs/PDFs and 6 YouTube channel links for the people the content is attributed to.

It is built for one named user ("Signed in as Dan" in the topbar, with a non-functional "Sign out" button) — this is a personal/internal productivity tool, not a multi-tenant SaaS product, though it does sync state to a shared Firebase Realtime Database so drafts/checks persist across sessions/devices.

---

## 2. App Shell & Navigation

### Layout
- Fixed **site topbar** (4px accent bar `#231F2E` + a bar with back-link, centered `<h1>Cold Email Bank</h1>`, and a "Signed in as Dan / Sign out" block).
- Below that, a CSS-grid **app shell** (`#app`) with two areas: `nav#rail` (sidebar, fixed width `--sidebar-w: 380px`) and `main#content-col` (flexible content pane, `#content`).
- **Responsive collapse** at `max-width: 980px`: the grid drops to a single `main` column and `nav#rail` becomes a fixed, off-canvas drawer (`position:fixed`, `transform:translateX(-100%)`, slides in via `.open` class) toggled by a hamburger-style `#railOpenBtn` in a `.mobile-topbar` and a `#railCloseBtn` inside the rail. Field grids and page-header padding also collapse at `max-width: 640px`.

### Sidebar (`nav#rail`) — top to bottom
1. **Logo block** — 28×28 rounded "CB" mark (`--stamp` green background) + "Cold Email Bank / Writing Workbench" label, plus the mobile-only close button.
2. **Sidebar search box** (`#globalSearch`) — a single search input shared across the *current tab only*; placeholder text changes per tab (see `TAB_SEARCH_PLACEHOLDER`), and the typed term is stored per-tab in the `searchTerms` object so switching tabs doesn't lose your other searches.
3. **`.rail-scroll`** — one continuously-scrolling column containing:
   - **`#navGroups`** — the tab navigation, grouped under two `nav-group-label`s: **"Library"** (Templates, Cold Email Bank) and **"Workspace"** (Rules & Principles, Pre-Send Checks, Resources). Each nav item shows a live item-count badge (`.count`) computed by each tab's `hint()` function.
   - A **rail divider** ("Draft Sheet" eyebrow + a "Clear" pill button `#clearDraftBtn`).
   - **`#dpBody`** — the persistent **Draft Sheet** panel (see §3.4).
4. **Sidebar footer** — live word count (`#draftWc`) + a primary "Copy Draft" button (`#copyDraftBtn`) that copies the entire sequence to the clipboard from anywhere in the app.

### Tabs (`TABS` array — drives the nav + routing)
| id | Label | Group | Item-count badge source |
|---|---|---|---|
| `templates` | Templates | Library | `TEMPLATES.length + REAL_EXAMPLES.length + FRAMEWORKS.length` |
| `swipe` | Cold Email Bank | Library | sum of all `SWIPE` group item counts |
| `rules-principles` | Rules & Principles | Workspace | `RULES_LESSONS.length` |
| `checklist` | Pre-Send Checks | Workspace | sum of all `CHECKLISTS` item counts |
| `resources` | Resources | Workspace | `RESOURCES.length` |

Tab switching is pure client-side state (`activeTab`) with no URL routing/hash — a full `renderAll()` re-render swaps `#content` and re-renders the rail highlight.

### Search & filter pattern (used everywhere)
- Every tab has a **landing view** (a grid of category cards, `.cat-grid`/`.cat-card`, each showing a live count and description) that opens a **modal** (`openModal()`) when clicked, drilling into that category.
- Typing in the sidebar's `#globalSearch` bypasses the landing/category view entirely and instead flat-searches **across all of that tab's categories at once**, rendering matches grouped by category inline in the main content pane (no modal).
- Inside an open modal there's a second, independent search box (`#modalSearch`) that searches only within that modal's current section/category.
- The generic `matches(term, ...fields)` helper does a case-insensitive substring test across an arbitrary list of fields, and returns `true` for an empty term (i.e., "no search" = "show everything").

### Categorization / attribution model
Nearly every content type in the app is tagged by **source person/brand** via a `PERSON_META` map (initials, accent color, tint):

| Person / Brand | Initials | Accent color |
|---|---|---|
| Frank Brothers | FB | `#1E6B45` (green) |
| Eric Nowoslawski | EN | `#2A6F97` (blue) |
| Matt Lucero | ML | `#B4691A` (orange) |
| Christian Bonnier | CB | `#7B4FA0` (purple) |
| Instantly | IN | `#C6362F` (red) |
| Smartlead | SL | `#0F8B8D` (teal) |

Category grids are wrapped per-person in a `.source-block` (colored left border + circular initials avatar), so the Templates and Cold Email Bank landing pages read as a stack of "one card-grid per person," each showing its own subtotal.

### Mobile behavior
- Rail becomes a slide-in drawer (see above); opening any nav item or inserting a swipe line into the draft auto-closes the drawer on narrow viewports (`window.innerWidth <= 980`).
- Modal overlays go edge-to-edge (`border-radius:0`, full height) under 720px.

---

## 3. Full Workflow Walkthrough

### 3.1 Templates tab (`renderTemplates` / `TABS[0]`)
Landing view: one `.source-block` per person, each a `.cat-grid` of category cards:

| Source | Categories offered | Counts |
|---|---|---|
| **Frank Brothers** | Message Templates (35), Real Examples (16), Structural Frameworks (20) | 71 total |
| **Eric Nowoslawski** | Lead Magnet Frameworks (27), Message Templates (18), Follow-Up Templates (4), Real Campaign Examples (14), Problem Sniffing Examples (2) | 65 total |
| **Matt Lucero** | Message Templates (9), Structural Frameworks (11) | 20 total |
| **Christian Bonnier** | Message Templates (4), Structural Frameworks (8) | 12 total |
| **Instantly** | Message Templates (6), Structural Frameworks (6) | 12 total |
| **Smartlead** | Message Templates (3), Structural Frameworks (5) | 8 total |

Clicking a card opens a full-screen-capable modal (`openTemplatesModal(key)`) via the `TEMPLATES_MODAL_PERSON` lookup table, which sets the modal eyebrow to the right person and renders the matching array through `templateCard`, `exampleCard`, or `frameworkCard` (see §5).

Global search on this tab (`renderTemplates` with a non-empty term) flat-searches **only** the core Frank Brothers `TEMPLATES` / `REAL_EXAMPLES` / `FRAMEWORKS` arrays (not the Eric/Matt/Christian/Instantly/Smartlead sub-banks) grouped by `TEMPLATE_GROUP_ORDER`.

#### Card types
- **Template card** (fillable): shows Template text (with `{{placeholders}}` highlighted via `<mark>`), an optional Example, "Why it works" bullets (`theory`), "When to use it" bullets (`when`), a tip callout, and a **live fill-in form** — one text input per unique `{{placeholder}}` found in the template (via `extractFields()`), with a live preview (`.filled-out`) that updates on every keystroke. Buttons: "+ Add Filled Version to Draft", "+ Add Example As-Is" (if an example differs from the template), and "Show AI Prompt" (toggles a monospace `.prompt-box` containing a ready-made LLM prompt for generating a version of that template).
- **Example card**: a real, already-written multi-line email (`body: [...]` array of paragraphs) plus a "Why it works" tip. One button: "+ Add to Draft" (adds the whole example verbatim).
- **Framework card**: a named structural blueprint (`structure` text describing the shape/sequence of moves) with an optional worked `example`; "+ Add to Draft" only appears if an example is present.

All cards are **accordion-style** (`.card` / `.card-head[data-toggle]` / `.card-body` hidden until `.open`), toggled by `wireCardToggles()`.

### 3.2 Cold Email Bank tab (`renderSwipe` / `TABS[1]`)
This is the core "swipe file" — atomic lines (not full templates) organized into 5 canonical categories, each broken into person-specific and thematic sub-banks:

| Canonical category | What it holds |
|---|---|
| Subject Lines | Ready subject-line formulas, one per person/brand |
| Opening Lines | First-email openers + follow-up openers (merged into one category with a `First Email` / `Follow-Ups` section split) |
| Body Lines | Authority, metaphors, timing, hedges, humor, industry-flavored lines, transitions — plus the full **Personalization Angles table** (95 rows) folded in here |
| Calls to Action (CTA) | The CTA phrase bank **plus** the 4 named `CTA_APPROACHES` frameworks |
| P.S. Statements | Sign-off/postscript lines |

Landing view mirrors the Templates tab: one `.source-block` per person (Frank Brothers, Eric Nowoslawski, Matt Lucero, Christian Bonnier, Instantly, Smartlead), each a grid of category cards including a **Power Words** card per person (Frank Brothers' is 155 words; the other five each have their own smaller vocabulary lists — see §4.5). Category cards open `openSwipeModal(cat)`, which if the category has multiple sub-sections (e.g. Opening Lines → First Email vs Follow-Ups) shows a `.chiprow` of section-switcher chips inside the modal.

Every line is rendered as a `.snip` card (text + optional `<small>` note + a circular "+" add button); subject-line categories wire their add button to set the *subject* field of the active draft slot instead of appending to the body (`snipGridHtml(items, 'subject')`).

### 3.3 Rules & Principles tab (`renderRulesPrinciples` / `TABS[2]`)
Landing view: a flat `.cat-grid` of the **15** `RULES_CATEGORY_ORDER` theme categories (not grouped by person — this tab deliberately organizes by *theme first*, so each modal then subdivides by person). See §4.6 for the full category list and the ~431-lesson taxonomy.

Clicking a category opens `openRulesModal(key)`, which shows a chip-row of only the people who actually have lessons in that category (`RULES_PERSON_ORDER` filtered), and renders each person's lessons alphabetically by title as a `.rule-card` (title + source citation + body + optional worked example).

Global search on this tab searches across `title`, `body`, `example`, and `source` for every lesson in every category simultaneously, still grouped by category → person.

### 3.4 Pre-Send Checks tab (`renderChecklist` / `TABS[3]`)
Two parts, always visible together whenever you land on the tab (not gated behind search):
1. **"Check An Email" — the automated checker** (`emailCheckerHtml` / `wireEmailChecker`): a subject input + body textarea (with a "Load Active Email From Draft" button that pulls the currently-focused draft slot), and a "Run Checks" button that runs all 12 `AUTO_CHECKS` (see §6) and renders a pass/fail list with `PASS` / `CHECK THIS` pill badges and a `"N / 12 automated checks passed"` summary banner.
2. **The manual checklist library** — a `.cat-grid` of `CHECKLIST_BUCKETS` (6 buckets; see §4.7), each opening a modal listing one or more `CHECKLISTS` entries as checkable `.check-item` rows with a live progress bar (`X / Y done`). Checkbox state persists to `localStorage` (`swipedesk_checks`) and mirrors to Firebase, keyed by list id + item index.

### 3.5 Resources tab (`renderResources` / `TABS[4]`)
Two `.resource-grid` sections: **"Guides & Playbooks"** (11 external Google Drive doc links) and **"YouTube Channels"** (6 channel links, one per named source person/brand). Each resource card is a full-card `<a target="_blank">` with a doc/YouTube icon and an arrow that shifts on hover.

### 3.6 The Draft Sheet (persistent, lives in the rail on every tab)
The Draft Sheet is not a tab — it's a permanently-visible panel in the sidebar (`renderDraftPanel` → `#dpBody`), because assembling a draft is the cross-cutting action every other tab feeds into.

- **State model**: `sequence` — an array of `{subject, body}` "email slots." Slot 0 is always "Email 1"; slots 1+ are labelled "Follow-Up 2", "Follow-Up 3", etc. (`slotLabel(i)`).
- **`activeSlot`** (a module-level int) tracks which slot last had focus; every "+ Add to Draft" button anywhere in the app inserts into `sequence[activeSlot]` via `insertToDraft(text, target)` — `target==='subject'` overwrites the subject field, otherwise the text is appended to the body with a blank-line separator if the body already has content.
- Each slot renders as an `.email-slot` card with a subject `<input>` and a body `<textarea>`; clicking either sets `activeSlot`. A "Remove" link appears on any slot once there's more than one.
- **"+ Add Follow-Up Email"** pushes a new empty slot and focuses its body textarea.
- **"Save Sequence"/"Save Email"** prompts (native `prompt()`) for a name, defaulting to the first slot's subject or "Sequence – <date>", and appends a deep-cloned snapshot to a **Saved list** (`swipedesk_saved_sequences`) rendered below with Load/Delete actions per saved item.
- **"Clear"** (top of the Draft Sheet section) opens the custom confirm dialog (see §5) before resetting `sequence` to a single empty slot.
- **Copy Draft** (both the sidebar footer button and every page header's "Copy Draft" button) calls `fullSequenceText()`, which joins all slots as `Subject: ...\n\n<body>` blocks separated by `\n\n-----\n\n`, and copies via `navigator.clipboard.writeText`, showing a small `.toast` ("Copied").
- **Word count** (`updateWc`) sums words across all slot bodies and displays `"N words"` or `"N words across M emails"`.

#### `localStorage` keys (all namespaced `swipedesk_*`)
| Key | Holds | Legacy fallback |
|---|---|---|
| `swipedesk_sequence` | the `sequence` array of `{subject, body}` | falls back to reading the older single-string key `swipedesk_draft` as slot 0's body if present |
| `swipedesk_saved_sequences` | array of `{id, name, savedAt, emails}` saved drafts | — |
| `swipedesk_checks` | `{ [listId]: { [itemIndex]: boolean } }` checklist tick state | — |

#### Firebase Realtime Database sync
A separate `<script type="module">` at the bottom of the file initializes Firebase (project `cold-email-app-71ce3`, hardcoded `apiKey` visible client-side) and:
- Exposes `window.fbSet(path, value)`, called after every `persistSequence()`, `persistSavedSequences()`, and `saveChecks()` to mirror local state to `swipedesk/{sequence|savedSequences|checks}` in the RTDB.
- On load, `hydrate()` fetches each of those three paths once and, if present, overwrites local state via `applyRemoteSequence` / `applyRemoteSavedSequences` / `applyRemoteChecks` and re-renders — i.e., **last-write-wins cross-device sync**, no realtime listeners/merge logic.

---

## 4. Data Model

All content lives as plain JS array/object literals at the top of the main `<script>` block. This section documents every top-level constant.

### 4.1 `TEMPLATES` — 35 fill-in-the-blank templates (Frank Brothers / "1M Frank eBook")
Fields per item: `id, group, name, desc, template, example, theory[], when[], tip, prompt`. Groups: **"The $1M Templates"** (29 items), **"Scenario Templates"** (3 items), **"WhatsApp Nurture"** (5 items — these use a lighter shape: no `prompt`, empty/short `theory`).

| # | Name | Group | Description (verbatim) |
|---|---|---|---|
| 1 | Poke the Bear | The $1M Templates | A single, powerful question that forces a prospect to confront a hidden problem. |
| 2 | Storytelling | The $1M Templates | Paint a vivid, emotive picture of what could be. |
| 3 | Cryptic Idea | The $1M Templates | Drop a teaser that's too good to ignore. |
| 4 | Creative Idea | The $1M Templates | Position yourself as a strategic partner by offering fresh ideas. |
| 5 | Classic Twist | The $1M Templates | Take what works, ditch what doesn't, add some spice. |
| 6 | Classic Twist Mini | The $1M Templates | A slimmed-down version of the Classic Twist. |
| 7 | ABC CTA – Value Bomb | The $1M Templates | Give them options, gamify it, and get insane engagement. |
| 8 | ABC CTA – Qualification | The $1M Templates | A choose-your-adventure qualification message. |
| 9 | Unhinged | The $1M Templates | Time to break every rule in the professional playbook. |
| 10 | Direct Report | The $1M Templates | Target the team, win the leader. |
| 11 | Short but Sweet | The $1M Templates | Brevity that sparks curiosity and engagement. |
| 12 | Lead Magnet | The $1M Templates | Lead with value, then ask for engagement. |
| 13 | Genius or Terrible | The $1M Templates | A bold, curiosity-driven message that categorises prospects with a minimalist CTA. |
| 14 | The Internal Nudge | The $1M Templates | Leverage internal dynamics to drive urgency. |
| 15 | Subject Line Message | The $1M Templates | Let the subject line do the work. |
| 16 | Problem Potion | The $1M Templates | Multiple, specific pain points side by side. |
| 17 | Direct Pitch | The $1M Templates | A short, bold outreach that cuts straight to the chase. |
| 18 | Mind-Benders – The Magic Trick | The $1M Templates | Tease a surprising insight that makes them curious. |
| 19 | Mind-Benders – The Conspiracy | The $1M Templates | Playfully frame an industry truth as a conspiracy. |
| 20 | Mind-Benders – One Sentence Bomb | The $1M Templates | Explode a belief they have in a single line. |
| 21 | Permission-Based | The $1M Templates | Ask for explicit permission to pitch, then vanish if they don't respond. |
| 22 | Industry Insight | The $1M Templates | Real-world data to establish credibility, then offer a tailored resource. |
| 23 | Calibration Test | The $1M Templates | Gauge where a prospect stands without triggering resistance. |
| 24 | Acceptance Speech | The $1M Templates | Casts the prospect as the future winner of an industry accolade. |
| 25 | The Intelligence Play | The $1M Templates | Leverage the prospect's education and career achievements to nudge engagement. |
| 26 | The Assumption Play | The $1M Templates | Make an educated guess about how the company handles a problem, forcing a confirm or correct. |
| 27 | Bonus Template | The $1M Templates | A highly personalised, pattern-disrupting message. |
| 28 | Handling Rejection | Scenario Templates | When someone gives you a firm no, go for the referral. |
| 29 | OOO Email | Scenario Templates | Leverage absence to create a warm entry point. |
| 30 | Executive Engagement | Scenario Templates | Leverage leadership to increase response rates. |
| 31 | Post-Email Reply – Keep Momentum Alive | WhatsApp Nurture | Use after a positive cold email reply (warm contacts only). |
| 32 | Pre-Meeting Reminder – Smooth and Helpful | WhatsApp Nurture | Send 15–30 minutes before the call. |
| 33 | Post-Meeting Follow-Up – Warm Relationship Builder | WhatsApp Nurture | Send after a great sales conversation. |
| 34 | Multi-Threading / Intro Follow-Up – Light & Polite | WhatsApp Nurture | Use when passed to a new stakeholder. |
| 35 | Ghost Follow-Up – Self-Aware Nudge | WhatsApp Nurture | Use when someone goes cold after replying once. |

Example verbatim template text (`poke-bear`): `"{{FirstName}} - ever considered the impact of {{specific problem}} from {{current solution/situation}} causing {{negative outcome}}?"` — worked example: `"Penn - ever considered the impact of all the leads you might be missing from Smartlead failing to tag them?"`.

Every non-WhatsApp template also ships a ready-made **AI prompt** (`prompt` field) for generating a new instance of that template shape.

### 4.2 `REAL_EXAMPLES` — 16 real, already-sent emails (reference only, no fill-in fields)
Fields: `id, group, name, why, body[]` (array of paragraph strings, joined with `\n` for display).

| Group bucket (`bucketExampleGroup`) | Items |
|---|---|
| **3-Step Sequence** (3) | `seq-email1` Storytelling Open, `seq-email2` Continuity + Expanded Proof, `seq-email3` Low-Pressure Close — a Marel/food-processing 3-email arc |
| **Enterprise Wins** (10) | Disney, Apple, Google, Monzo, Virgin Media, Stripe, Jet2, Vodafone, Spotify, Huawei — each a real-style cold email to a Fortune-500-scale company, with a `why` line naming its persuasion techniques |
| **Humor Templates** (3) | Product Launch Tie-In, Self-Deprecating Honesty, Oddly Specific Promise — all addressed to "HubSpot" as the target brand |

Sample verbatim (Stripe): *"Hey Peter, I'm Sam, founder of Writesonic (YC S21). I looked into how Stripe appears when customers ask ChatGPT for payment solutions suggestions... We just rolled out AI visibility tracking... Would love to share a quick Loom video audit showing Stripe's AI visibility... Want me to send it over?"*

### 4.3 `FRAMEWORKS` — 20 structural blueprints (Frank Brothers)
Fields: `id, name, structure`, optional `example`. Numbered 1–20, e.g.: *1. Curiosity Before the Pitch*, *2. Essential Cold Outreach Sequence*, *3. Value-First Outreach*, *4. Third-Party Insight Outreach* (has example), *5. Engaging Follow-Up Sequence*, *6. Data-Driven Outreach Framework* (has example), *7. Competitive Advantage Outreach*, *8. Insight Validation Outreach Framework*, *9. Challenge-Based Outreach*, *10. Sales-Focused Software Pitch* (has example), *11. Feedback-Driven Outreach*, *12. Innovation Inquiry Email*, *13. Priority Check Outreach*, *14. Revenue Impact Outreach*, *15. Outcome-Driven Lead Magnet Outreach* (has example), *16. Industry Trends Framework*, *17. Problem-Solution-Outcome Framework*, *18. Quick Win Idea*, *19. Finding the Right Contact*, *20. Solving Pains*.

### 4.4 `SWIPE` — the Cold Email Bank line library (88 groups, 589 individual lines)
Each group: `{cat, sub, intro?, items:[{t, note?}]}`. `cat` is one of 20 raw category keys that `SWIPE_CATEGORY_MAP` folds into the 5 canonical categories (Subject Lines, Opening Lines, Body Lines, CTA, P.S. Statements) shown in the UI, plus person-prefixed variants (`Eric Subject Lines`, `Eric CTA`, `Matt Lucero - *`, `Christian Bonnier - *`, `Instantly - *`, `Smartlead - *`).

Representative sub-banks (not exhaustive — 88 groups total):
- **Subject Lines**: Directly-Provided Bank, The Unsexy Line (make it look internal), The Sexy Line (over-the-top intrigue).
- **Opening Lines**: Milestone, Cheesy First Lines, Name, Numbers, Not What You Think, Pain, Ridiculous, Note, Storyteller, Open Loop, Humor Openers, First-Email Openers (Phrasebook), Quick Opening Phrases, Softeners & Disclaimers, Casual Closes.
- **Body Lines**: Authority Build, Buyer Metaphors, Current Timing, Hedge Your Bets, Lazy Language, Parenthetical Asides/Brackets, Humor Mid-Message, Industry-Flavoured Lines, Transitions.
- **Calls to Action**: CTA Bank, Sound Human & Disarming (Phrasebook), Prime the Ask (Phrasebook), Softeners & Disclaimers, Casual Closes, plus **per-source-document banks**: *Frank Collective Outbound Lessons Doc.pdf*, *1M Frank eBook.pdf*, *Unlocking Enterprise (2).pdf*, *55 Cold Email Copywriting Cheat Codes.pdf*, *Making Cold Outreach Funny (1).pdf*, *Inbox Engineering (1).pdf*, *The Ultimate 3-Step Cold Email Sequence (1).pdf*, *Whatsapp Outreach.pdf*, *How to Get a Meeting with Anyone (Redesigned).pdf*, *contact-marketing-every-idea.pdf*.
- **Follow-Ups & Hedges**: Final Email Openers, No-Response/Hedging Phrase Bank, 9 Creative Follow-Up Angles, Engagement Hooks.
- **P.S. Statements**: per-source banks (Frank Collective Outbound Lessons Doc, 1M Frank eBook, Unlocking Enterprise, Ultimate Guide to Clay, How to Get a Meeting with Anyone).
- **Eric Subject Lines / Eric CTA**: Eric Nowoslawski Bank; CTA To Another Stakeholder, Low Friction CTAs, Lead Magnet/Free Service CTAs, Curiosity-Based CTAs, Social Proof CTA, Ideas Hedge CTA.
- **Matt Lucero – Subject/Opening/Body/CTA/P.S.**: Coworker-Style Subject Lines; Personalized Observation + Question, Rhetorical Question Openers, Community & Location Openers; Value Prop/Proof; Low-Friction CTAs, One-Liner Direct Ask; Objection/Proof Reinforcement.
- **Christian Bonnier – Subject/Opening/Body/CTA**: Vague & Coworker-Style, State the Guarantee; Bare Observation Openers, Trojan Horse Openers; Proof & Guarantee; Mind If I Share, Deliverable & List CTAs.
- **Instantly – Subject/Opening/Body/CTA/P.S.**: Coworker-Style/Low-Key, Curiosity/Calendar-Invite Style; Specific Observation Openers, One-Liner Curiosity Openers; Value Prop Formula, Problem-Awareness Lines, Three Ideas Format; Value-First (Not a Call) CTAs, Scarcity/Reply-Trigger CTAs, Breakup/Multiple-Choice CTA; Guarantee/Risk-Reversal PS.
- **Smartlead – Subject/Opening/Body/CTA**: Colleague-Style; Shared-Experience/Resonance Openers; Problem + Mechanism + Relevance (3-Part Body); Soft CTA (No Call Ask).

Sample verbatim lines: *"Penn - I paid GBP 0.62 to send this email."*; *"John - choose your adventure: If you're happy with your sales pipeline → Delete this message..."*; *"If this is annoying, reply with 'stop' and I will go touch grass."* (labelled "Reverse-CTA").

### 4.5 Power-word vocabularies (6 separate constants)
| Constant | Owner | Categories | Total words |
|---|---|---|---|
| `POWER_WORDS` | Frank Brothers | Adjectives, Nouns, Verbs, Adverbs | 155 (`{w, m}` word + meaning pairs) |
| `MATT_POWER_WORDS` | Matt Lucero | single category "Matt Lucero's Go-To Words & Phrases" | 21 |
| `CHRISTIAN_POWER_WORDS` | Christian Bonnier | single category | 13 |
| `INSTANTLY_POWER_WORDS` | Instantly | "Recurring Framing Phrases & Devices" | 9 |
| `SMARTLEAD_POWER_WORDS` | Smartlead | "Recurring Framing Phrases & Devices" | 6 |

Sample `POWER_WORDS` entries: adjectives `nifty→effective`, `bonkers→impressive`, `wonky→problematic`; nouns `secret-sauce→strategy`, `bodge job→poor work`; verbs `crushing→succeeding`, `nerding out→deeply analyzing`; adverbs `insanely→extremely`, `bloody→very`.

Sample jargon-glossary entries (the other 4 banks are more "named concept" glossaries than slang lists): Matt Lucero's `north star`="the metric or goal that matters most"; Christian Bonnier's `Trojan Horse`="posing as a customer or consumer of the brand to get attention, rather than pitching as a vendor"; Instantly's `them-first rule`="their situation gets mentioned in a line before yours does"; Smartlead's `resonance campaign`="contact-level segmentation using shared-experience filters... so one opening line is true for everyone on the list".

### 4.6 `AVOID_PHRASES` — 9 categories, 76 banned phrases (used by both the swipe file's "Phrases to Avoid" checklist and the automated checker)
| Category | Example phrases |
|---|---|
| Generic Openers | "Hope you're well", "Just checking in", "I wanted to reach out" |
| Overused Adjectives | "Impressive", "Cutting-edge", "Best-in-class", "Robust", "Seamless" |
| Tired Business Jargon | "Leverage", "Synergy", "Circle back", "Touch base", "Low-hanging fruit" |
| Desperate Follow-ups | "Just following up", "Bumping this to the top", "Friendly reminder" |
| Cliche Social Proof | "Trusted by", "Fortune 500", "Industry leaders" |
| Pushy Sales Language | "Limited time offer", "Act now", "Once-in-a-lifetime" |
| Vague Claims | "10x your results", "Skyrocket your growth", "Guaranteed success" |
| Overused Trigger Phrases | "Saw you're hiring", "Noticed your recent funding" |
| Meeting Requests | "Jump on a quick call", "Grab 15 minutes", "Hop on a call" |

### 4.7 `CTA_APPROACHES` — 4 named CTA strategy frameworks (each with `examples[]`, `why[]`, `when[]`, optional `tip`)
1. **The No-Brainer** — "Mind if I send over a one-pager?"
2. **The Lead Magnet** — give before you ask.
3. **The Choice** — A/B/C letter-reply CTAs.
4. **The Disarming Question** — "Am I even barking up the right tree?"

### 4.8 `RULES` — 13 top-level rule/principle sections (Frank Brothers)
1. 13 Rules of Engagement – Penn Frank (Relevance, Curiosity, Social Proof, Authority Bias, FOMO/Loss Aversion, Reciprocity, Clarity, Urgency, Ego, Pattern Interrupt, Simplicity Bias, Narrative Transportation Bias, Autonomy Bias)
2. 4 Elements of the Buyer's Brain – Penn Frank (Skepticism = default mode, Attention economics, The trust paradox, Information processing patterns)
3. 3 Tactical Concepts – Penn Frank (Message Market Fit, Sequence momentum, Forget the rules)
4. Master Rules – Formatting, Structure & Word Economy (11 bullet rules)
5. Master Rules – Deliverability & Send Formatting (5 bullet rules)
6. Master Rules – Personalization (7 bullet rules)
7. Master Rules – Tone & Language (12 bullet rules)
8. Master Rules – Message Focus & Positioning (9 bullet rules)
9. Master Rules – Flow, Signals & Triggers (8 bullet rules)
10. Follow-Up Principles (incl. "The 3D Formula": Different, Disarming, Direct; "2–3 is the sweet spot")
11. Enterprise Outreach – 5 Principles (Lead with goodwill, Executive engagement, Optimise for forwardability, Stack social proof, Own your tone)
12. Humor in Cold Email (Anatomy of a funny email, 7 Humour Moves, 5 Humor Safety Rules, What to avoid, Testing & scoring)
13. Using AI to Draft & Polish Copy (the PORT framework: Perspective, Objective, Rules, Text)

Every section here is *also* auto-appended into `CHECKLISTS` at load time (see §4.9), so nothing in this tab is reference-only.

### 4.9 `PERSONALIZATION` — 95 personalization angles (Penn Frank / general)
Fields: `{angle, phrase, source}`. Roughly the first ~55 entries are tagged by data-source shorthand (e.g. `h2 - Account - LinkedIn/Website`, `h2 - Persona - LinkedIn`, `h2 - Company - E-commerce`), covering angles like Company Mission Summary, Phone Number, Local Restaurant, Title + Time in Role, Team Growth, Mutual Connection Reference, Previous Company, Funding Round, Technology Used, Google Ratings, Competitor Reference, IPO, Glassdoor Reviews. The remaining ~40 are tagged `source:'Penn Frank'` and are more example-phrase-driven (AI Tool Adoption, Average Order Value, Award or Recognition, Buyer Intent Signal, CRM Migration/Tech Switch, Funding Round Announcement, Job Description Keyword Search, LinkedIn Recommendation, Media Feature, Web Traffic Estimate, and a closing meta-entry **"Personalisation Stacking (Pro Tip)"** describing how to layer multiple data points into one sentence).

### 4.10 `CHECKLISTS` — 16 checkable lists, ~most content folded in programmatically
Base lists defined directly: `presend` ("Before You Hit Send", 7 items) and `humorcheck` ("Using Humour? Quick Check", 5 items). At load time, JS code (`RULES.forEach(...)`) auto-generates one additional checklist per `RULES` section (13 more lists, ids like `rule-13-rules-of-engagement-penn-frank`), and one more list is pushed for **`avoid-phrases`** ("Phrases to Avoid," rendered as 9 checkable category rows, each showing its phrase list as chips) — bringing the total to 16 lists. `CHECKLIST_BUCKETS` (6 buckets) is the UI-facing grouping of those 16 lists: Before You Send, Phrases to Avoid, Psychology & Principles, Master Rules, Follow-Up & Enterprise, Humor & AI.

### 4.11 `RULES_LESSONS` — 431 attributed lessons, the largest single dataset in the app
Fields: `{p (person), cat (category), src (source doc/video title), t (title), b (body), ex? (example)}`. Organized as a **person × category matrix** across **6 people** and **15 categories** (`RULES_CATEGORY_ORDER`):

| Category | Description (verbatim) |
|---|---|
| Mindset & Strategy | How each expert thinks about the channel itself. |
| Targeting & List Building | Building and validating the list before a single word gets written. |
| Personalization & Research | Turning research into openers that read as "this was written for me." |
| Subject Lines | What actually gets an email opened in the first place. |
| Copywriting & Message Structure | Templates, structures, and line-by-line rules for the body of the email. |
| Offers & Positioning | What you're actually offering, and how to frame it so it's easy to say yes to. |
| Calls to Action (CTA) | The ask itself. |
| Follow-Up Strategy | How many touches, how far apart, and what each one has to add. |
| Objection Handling & Replies | Turning a reply — or an objection — into a booked call. |
| Sales Calls & Closing | What happens once a meeting is actually on the calendar. |
| Deliverability & Sending Infrastructure | Domains, warm-up, and inbox health. |
| Volume, Testing & Metrics | Benchmarks, A/B testing discipline, reading numbers honestly. |
| Tools & AI | The stack and prompting techniques each expert uses at scale. |
| Humor & Tone | Sounding human, using humor safely, vocabulary. |
| Channel-Specific | WhatsApp, LinkedIn, phone. |

Contributing people and their approximate lesson coverage (Eric Nowoslawski and Matt Lucero and Frank Brothers cover essentially all 15 categories in depth; Christian Bonnier, Instantly, and Smartlead each cover a lighter subset, roughly 1–3 lessons per category):
- **Eric Nowoslawski** — sourced from named YouTube videos/posts such as *"Cold Email First Principles Thinking"*, *"I Tested 500,000 Cold Email, This Is The Best Campaign"*, *"I sent 10,000,000 cold emails, here's what works in 2025"*, *"Focus on Offers Made To Convert Cold Traffic"*, *"Outbound Copywriting: Chunking Up and Down"*, *"Cold Email Follow-Up Strategy for 2026 (Data-Backed)"*, *"Past Mistakes We Made w/ Email Personalizations"*, *"Top 10 Cold Email Tips That Give You an Unfair Advantage"*, *"How to Increase Meetings Booked Per Positive Response"*.
- **Matt Lucero** — sourced from *"START HERE: How to Run Cold Email for Any Business"*, *"How To Generate Leads With Cold Email in 2026 (FULL COURSE)"*, *"i sent 600,000 cold emails and learned this"*, and an unlabelled "Video 1/2 (batch 3)" pair.
- **Frank Brothers** — sourced from a long list of internal docs: *1M Frank eBook*, *Frank Collective Outbound Lessons Doc*, *55 Cold Email Copywriting Cheat Codes*, *Inbox Engineering*, *Inbox or Bust*, *Unlocking Enterprise*, *The Ultimate 3-Step Cold Email Sequence*, *The Secret to Close Outbound Sales Opportunities*, *Ultimate Guide to Clay*, *The Cold Outreach Phrasebook*, *Making Cold Outreach Funny*, *Whatsapp Outreach*, *How to Get a Meeting with Anyone*, *14 Lessons to $1m ARR*, *24 Business Learnings in 24 Months*.
- **Christian Bonnier** — *The $1M Cold Email Template*, *Nuance > Rules*, *Cold Email Teardown Series*, *Cold Email Masterclass Presentation*, *Two-Sentence Cold Email Scripts*, *The Two-to-One Rule*, *One-Two Punch Strategy*, *Tangible Lead Magnets ($0 to $100K in 90 Days)*, *Best CTA of 2025*.
- **Instantly** (brand-voice, not a person) — *Trust recession / value-first outreach*, *10-year cold email tactics overview*, *"Hidden trust breaker" copywriting video*, *Winning campaign framework*, *Value-ladder follow-up system video*, *5-years-in-cold-email video*.
- **Smartlead** (brand-voice) — *"4 things that decide if cold email works" video*, *2026 cold email setup video*, *"What actually works now" video*, segmentation-tactics videos.

Representative lessons (verbatim titles, one per category, to illustrate the granularity — the full 431 are addressable only in-app via the category/person drill-down, since the source text runs to tens of thousands of words):
- *Mindset & Strategy* (Eric): "Test everything, trust nothing labeled 'best practice'" — video is a data-backed case that a lower-deliverability tactic (e.g. video) can still be the right call if reply rate more than compensates.
- *Targeting & List Building* (Matt Lucero): "A good list beats a good script."
- *Personalization & Research* (Frank Brothers): "Front-load personalization into the opener – it doubles as preview text."
- *Subject Lines* (Frank Brothers): "The 'unsexy' vs. 'sexy' extremes both beat the safe middle."
- *Copywriting & Message Structure* (Matt Lucero): "The four-part cold email framework."
- *Offers & Positioning* (Christian Bonnier): "A no-brainer offer = a tangible benefit stated in business terms, plus a guarantee."
- *Calls to Action (CTA)* (Frank Brothers): "The No-Brainer CTA and the Lead Magnet CTA."
- *Follow-Up Strategy* (Eric): "Cap sequences at 2 emails, 3 at most – the data says so."
- *Objection Handling & Replies* (Matt Lucero): "The three-step reply framework: answer, bridge, propose times."
- *Sales Calls & Closing* (Frank Brothers): "The five-step close system, and the psychology behind why proof works."
- *Deliverability & Sending Infrastructure* (Christian Bonnier): "Never send from your main business domain – use disposable burner domains."
- *Volume, Testing & Metrics* (Smartlead): "Treat the first 2-3 campaigns as learning campaigns."
- *Tools & AI* (Frank Brothers): "What Clay does, and why prompting is now the highest-leverage skill."
- *Humor & Tone* (Frank Brothers): "'Radically human' tone, self-deprecating asides, and humbling disclaimers."
- *Channel-Specific* (Frank Brothers): "Use WhatsApp for nurturing, never for cold prospecting."

### 4.12 Person-specific secondary template banks (used only inside the Templates tab modals)
- **`ERIC_TEMPLATES`** (27) — "Lead Magnet Frameworks": e.g. Resource Give Away, Scraped Data, LinkedIn Engagement List (Best Performer), Free Inbox Setup, Free Copywriting Session, Ungated Tech Lead Magnet, Service Lead Magnet, Founder Story Lead Magnet, Industry Founder Example, Proprietary Data Lead Magnet, Google Ads Example, Customer Strategy Lead Magnet, Financial Planning Example, Gym Example, Audit Lead Magnet, Competitor Analysis, Personal Strategy Session, Checklist Lead Magnet, Industry Benchmarking, Future Trend Analysis, Testing Lead Magnets Before Building Them, Lead Magnet (Framework), 5,000 ICP Leads, Lookalike Company Lists, Automated Clearbit Workflows, Existing Assets (Recruiting Example), Already-Found Leads Offer.
- **`ERIC_MESSAGE_TEMPLATES`** (18) — Internal Discussions, "Here Goes Nothing" Email, Shortest Email Framework, Oren Klaff Pattern Interrupt, Quick Outcome Email, Quick Case Study Email, Founder's Story Framework, Feedback Email, Why You Why Now (John Barrows), Problem Sniffing, Show & Tell, Super Short Email, Pattern Interrupt, Case Study First, Research-Led, Poke the Bear, Value First, Relevant Social Proof Line.
- **`ERIC_FOLLOWUP_TEMPLATES`** (4) — Bullet Follow-Up, "Rolled the Dice" Follow-Up, Follow-Up (Framework), Breakup.
- **`ERIC_CAMPAIGN_SECTIONS`** (4 named campaigns) / **`ERIC_CAMPAIGN_EXAMPLES`** (14 emails) — Tapo (LinkedIn Scheduling Tool) [4 emails], Agency Campaign [4 emails], Clearbit Campaign [1], Optivo — Intent Data [1], AI-Generated Creative Ideas Campaign [4 emails].
- **`ERIC_PROBLEM_SNIFFING_EXAMPLES`** (2) — Car Park Repair Example, SaaS CSV Import Example (OneSchema).
- **`MATT_TEMPLATES`** (9) — 3-Part Cold Email Framework, Call-Out Industry, One-Liner, Rhetorical Question, Community-Focus, General Case Study, Specific Case Study, Location-Based, Revenue vs. Time-Savings Value Framework.
- **`MATT_FRAMEWORKS`** (11) — 3-Part Cold Email Framework, Last 10 Customers Research Method, (one further framework), Ground Rules for Cold Email Copy, Follow-Up Cadence by Market Size, Interested-Lead Reply Framework, Multi-Channel Squeeze, CTA Decision Tree, Objection-Handling Rewrite Pass, Loom Video CTA Structure, 5 Copywriting Principles for Scale.
- **`CHRISTIAN_TEMPLATES`** (4) — Two-Sentence Loom Video Pitch, Trojan Horse Opener, One-Two Punch (Jab + Right Hook), "Two Things" Template.
- **`CHRISTIAN_FRAMEWORKS`** (8, incl. sub-entries) — The $1M Cold Email Template, No-Brainer Offer Framework, Trojan Horse Strategy, One-Two Punch Sequence, Loom Video Pitch Structure, (one more), Deliverability Setup, (one more).
- **`INSTANTLY_TEMPLATES`** (6) — Value Prop + Case Study Opener, Social Proof Follow-Up, Detailed Case Study Follow-Up, Multiple-Choice Breakup Email, Free-Fix Offer Email, Three Ideas Email.
- **`INSTANTLY_FRAMEWORKS`** (6, incl. sub-entries) — Value-Ladder Follow-Up System, (one more), Positive Reply Protocol, 6-Step Copywriting Structure, (two more).
- **`SMARTLEAD_TEMPLATES`** (3) — Email 1 (Heavy-Lift Opener), Email 3 (New Thread, Free Value), Resonance Campaign Opener.
- **`SMARTLEAD_FRAMEWORKS`** (5) — 3-Email Max Sequence, (one more), 4 Things That Decide If Cold Email Works, 4-Pillar Boring System, ABM List-Building Flow.

### 4.13 App/state constants
- `ICONS` / `SEARCH_ICON` — inline SVG icon strings keyed by tab id (`templates, bank, rules, checklist, resources`).
- `TABS`, `TAB_SEARCH_PLACEHOLDER` — see §2.
- `RESOURCES` (11 items: title + Google Drive URL) and `RESOURCE_CHANNELS` (6 items: name + YouTube URL) — see §3.5.
- `sequence`, `activeSlot`, `activeTab`, `searchTerms` — the live app state (see §3.6 and §2).
- `checkerState = {subject, body, results}` — transient state for the automated checker (not persisted across reloads).
- `modalConfig`, `modalFullscreen` — the currently-open modal's config object and its full-screen toggle flag.

---

## 5. UI Components

| Component | CSS class(es) | Behavior |
|---|---|---|
| **Card (accordion)** | `.card`, `.card-head[data-toggle]`, `.card-body`, `.caret` | Click header to toggle `.open`; caret rotates 45° (turns "+" into "×"-like) when open. |
| **Snippet chip / line** | `.snip`, `.snip .txt`, `.snip button.add` | One-line swipe items with a circular "+" that inserts into the active draft slot (or sets subject for subject-line categories). |
| **Word chip** | `.word-chip` | Power-word entries showing word (bold) + meaning (faint); clicking the chip body copies the word to clipboard directly (`copyText`), clicking its "+" button inserts into the draft instead. |
| **Avoid-phrase chip** | `.avoid-chip` | Static red-X-prefixed pill, non-interactive (reference only). |
| **Category card** | `.cat-card` | Icon + count badge + title + description; click opens the matching modal. |
| **Source block** | `.source-block` | Colored-left-border wrapper grouping a person's category cards, with a circular initials avatar and accent color pulled from `PERSON_META`. |
| **Person subhead** | `.person-subhead` | Used inside Rules & Principles modals to introduce each person's lesson block. |
| **Modal** | `.modal-overlay`, `.modal-box`, `.modal-head`, `.modal-scroll` | Generic modal shell driven entirely by the `openModal(config)` / `renderModal()` pair; supports an optional section chip-row, an optional in-modal search box, and a full-screen toggle button (`toggleModalFullscreen`) that widens the modal to fill the viewport (`.modal-box.fullscreen`, max-width driven by `calc(50% - 420px)` gutters). Escape key or overlay-background click closes it. |
| **Confirm dialog** | `.confirm-overlay`, `.confirm-box` | Custom replacement for native `confirm()`, built as a Promise (`showConfirm(title, opts)`); supports a `detail` sub-line, custom button labels, and a `danger` variant (red accent + "danger" button style). Used for "Clear the whole draft?" and "Delete this saved item?". Escape=cancel, Enter=confirm. |
| **Toast** | `.toast` / `.toast.show` | Bottom-center transient notice (`toast(msg)`), auto-hides after 1.6s. Used for "Copied", "Copy failed", "Saved", "Loaded '<name>'", and draft-insert confirmations like "Added to Email 1". |
| **Progress bar** | `.progress-bar`, `.progress-bar .fill` | Green fill bar + "`X / Y done`" label, shown per-checklist when not searching. |
| **Chip row (modal section switcher)** | `.chiprow`, `.chip`, `.chip-dot` | Horizontal pill tabs inside a modal for switching between sections (e.g. person filters in Rules & Principles, or First Email/Follow-Ups in Opening Lines); an optional colored dot per chip via `sectionAccent`. |
| **Draft email slot** | `.email-slot`, `.es-subject`, `.es-body`, `.es-remove` | See §3.6. |
| **Saved sequence item** | `.saved-seq-item` | Shows name, "N emails – date saved", each slot's subject line, and Load/Delete buttons. |
| **Fill-in template form** | `.tpl-form`, `.field-grid`, `.field`, `.live-fill` | Auto-generated one-input-per-`{{placeholder}}` form with a live, highlighted preview pane. |
| **Reference table** | `table.ref-table`, `.table-wrap` | Used for the Personalization Angles table (Angle / Example Phrase / add-button columns), horizontally scrollable. |
| **Resource card** | `.resource-card`, `.resource-card-icon.doc/.yt` | External link card with doc or YouTube icon and hover-shift arrow. |
| **Automated checker result row** | `.check-item` + inline PASS/CHECK THIS badge | Green "PASS" pill or red "CHECK THIS" pill, generated by `renderCheckerResults`. |

---

## 6. Business Logic / Key Functions

### Draft/sequence management
- `loadSequence()` / `persistSequence()` — read/write `swipedesk_sequence`, with legacy single-draft fallback; every persist also calls `window.fbSet('sequence', sequence)`.
- `insertToDraft(text, target)` — the universal "add to draft" entry point used by every "+" button in the app; appends or overwrites depending on `target`, opens the mobile rail if needed, and toasts.
- `fullSequenceText()` — serializes the whole sequence to a copy-paste-ready plain-text block, joining multiple emails with `-----` separators.
- `updateWc()` — recomputes and displays total word count across all slots.
- `renderDraftPanel()` — full re-render of the Draft Sheet, including the Saved list; wires all input/remove/save/load/delete handlers each render (no persistent DOM diffing).

### Search/filter
- `matches(term, ...fields)` — global case-insensitive substring matcher; empty term always matches.
- Each tab's `render*()` function branches on whether `searchTerms[tab]` is set: non-empty → flat cross-category search rendered inline; empty → category-grid landing page.

### Template rendering
- `templateCard`, `exampleCard`, `frameworkCard` — HTML builders for the three Templates-tab card shapes (see §3.1).
- `extractFields(tpl)` — regex-extracts every unique `{{...}}` token from a template string, in order of first appearance, to drive the auto-generated fill-in form.
- `wireTemplateForms()` — for each `.tpl-form`, builds the input grid, live-updates a highlighted preview on every keystroke (via `highlightPlaceholders`), and wires the "Add Filled Version"/"Add Example As-Is"/"Show AI Prompt" buttons.
- `highlightPlaceholders(s)` — escapes HTML then wraps any remaining `{{...}}` in `<mark>`.

### Modal system
- `openModal(config)` / `renderModal()` / `closeModal()` / `toggleModalFullscreen()` — the single generic modal engine used by every "open category" action across all 5 tabs (`openTemplatesModal`, `openSwipeModal`, `openRulesModal`, `openWordsModal`, `openChecklistModal` all just call `openModal` with different `renderBody`/`sections`/`eyebrow` config).

### Rules & Principles
- `rulesByCategory(cat, term)` — filters `RULES_LESSONS` by category + search term.
- `rulesGroupedHtml(items)` — re-groups a filtered lesson list by `RULES_PERSON_ORDER`, alphabetizing titles within each person (`alphaByTitle`).

### Swipe file / power words
- `buildSwipeCategories()` — one-time transform of the flat `SWIPE` array into a `{category: {sections: {sectionKey: [groups]}}}` tree, consumed by both the landing counts and `openSwipeModal`.
- `personForCategoryKey` / `typeForCategoryKey` — parse a raw category key like `"Matt Lucero - CTA"` into its owning person and its canonical type, driving both the source-pill and the modal eyebrow.
- `powerWordsBodyHtmlFor(arr, term)` — generic renderer reused for all 5 power-word banks.

### Automated pre-send checker (`AUTO_CHECKS`, 12 rules — each `{label, run(subj, body) => {pass, detail}}`)
1. **No em dashes** — regex-detects the Unicode em dash `—`.
2. **No exclamation marks** — counts `!` across subject+body, must be 0.
3. **One question mark max in the body**.
4. **Subject never uses "Re:" or "Fwd:"**.
5. **Subject line is 6 words or fewer** (fails with no subject entered).
6. **No unfilled placeholders left** — detects any remaining `{{...}}`.
7. **No banned phrases from the 76 Phrases to Avoid** — checks the full `AVOID_PHRASES` list (all 9 categories) via substring match, reports every hit with its category.
8. **Doesn't mention your own company or product** — checks for literal strings "our company", "our product", "we're a", "we are a", "our service", "our solution".
9. **Body stays reasonably short** — word count must be >0 and ≤150.
10. **Paragraphs stay to about two lines** — flags any paragraph (split on blank lines) longer than 220 characters.
11. **No memes or gifs mentioned** — detects `.gif` or the word "meme".
12. **Never asks "should/do you want me to send it over"** — detects that exact banned phrasing.
13. *(labelled 12th check in-app, listed last)* **Sounds human, not AI-polished** — passes if the body contains at least one of: `basically, a bit, kinda, thing, honestly, pretty, stuff, tentatively assuming, grain of salt`.

`renderCheckerResults` tallies `passed/total` and renders each check as a pass/fail row; `wireEmailChecker` wires the "Load Active Email From Draft" and "Run Checks" buttons and persists live edits into `checkerState` (not to `localStorage` — resets on reload).

### Checklists
- `CHECKLISTS.push(...)` **auto-generation code** (runs once at load): converts every `RULES` section into a checklist (one checkbox per rule item) and converts `AVOID_PHRASES` into one more checklist (one checkbox per category, each showing its phrase chips) — meaning the "13 Rules of Engagement," "Master Rules," etc. become tickable, not just readable.
- `checklistListHtml(list, term, state)` — renders one checklist's items with checkbox state + a progress bar (progress bar suppressed while actively searching).
- `wireChecklistCheckboxes(box, afterChange)` — on any checkbox change, updates `swipedesk_checks` (`saveChecks`) and calls back to re-render (so progress bars update live).

### Firebase sync
- `window.fbSet(path, value)` — best-effort push to `swipedesk/{path}` in Firebase RTDB (errors only logged to console, never surfaced to the user).
- `hydrate(path, applyFn)` — one-shot read-and-apply on page load for `sequence`, `savedSequences`, and `checks`.

---

## 7. Styling System

### Design tokens (`:root` CSS custom properties)
| Token | Value | Use |
|---|---|---|
| `--paper` / `--paper-raised` / `--paper-tab` | `#FFFFFF` (all three) | Background surfaces — a flat white theme despite the naming implying tiered elevation |
| `--ink` | `#14181B` | Primary text |
| `--ink-soft` | `#5B6560` | Secondary/body text |
| `--ink-faint` | `#8A938D` | Tertiary/meta text, placeholders |
| `--stamp` | `#1E6B45` | Primary brand green (Frank Brothers accent, active nav, links) |
| `--stamp-ink` | `#FFFFFF` | Text-on-stamp |
| `--mimeo` | `#2F8F5B` | Secondary green (accent bars, "add" buttons, tips) |
| `--mimeo-ink` | `#E6F4EC` | Pale green tint (active nav bg, tip bg, done-checklist bg) |
| `--line` / `--line-strong` | `#E4E9E6` / `#CCD5D0` | Borders |
| `--good` | `#2F8F5B` | Progress-bar fill, checkbox accent |
| `--warn` | `#B4691A` | Danger/warn actions (clear draft, delete, confirm-dialog accent) |
| `--shadow` | `0 1px 0 rgba(20,24,27,.03), 0 8px 20px -12px rgba(20,24,27,.14)` | Card elevation |
| `--radius` | `8px` | Standard corner radius |
| `--sidebar-w` | `380px` | Rail width (collapses to `340px` fixed-drawer at ≤980px) |
| `--font-display` / `--font-body` | both `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Identical system-font stack used for both roles |
| `--font-mono` | `ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace` | Used for template text, subject/body drafts, prompt boxes, code-like meta text |

Per-component **local accent overrides** (`--accent` / `--accent-tint` CSS custom properties set inline per element) let `.source-block`, `.rule-card` context, `.modal-box`, and `.person-subhead` each recolor to the relevant person's brand color from `PERSON_META` without any extra utility classes.

### Typography
- Base body: 14.5px / 1.5 line-height, `-webkit-font-smoothing: antialiased`.
- Headings (`h1`, card titles, modal titles) use `--font-display` at weight 700–800 with tight/negative letter-spacing (`-.01em`) for a condensed, editorial feel; `text-wrap: balance` on `<h1>` elements.
- Eyebrows/labels use the classic "tiny uppercase kicker" pattern: 10.5–11px, weight 700, `letter-spacing:.06–.08em`, uppercase, `--ink-faint` or accent color.
- Template/example/draft text is always monospace (`--font-mono`) at 12–13px, distinguishing "content you'd paste into an email" from "UI chrome."

### Layout patterns
- CSS Grid app shell (`grid-template-areas: "rail main"`), collapsing to a single-column mobile drawer pattern below.
- `.cat-grid` / `.snip-grid` / `.resource-grid` all use `repeat(auto-fill, minmax(Npx, 1fr))` responsive grids (230px/260px/270px minimums respectively) — no JS-driven breakpoints, pure CSS auto-fill.
- Sticky page header (`.page-header{position:sticky; top:0}`) so the title/search/copy-draft button stay visible while scrolling long lists.
- Custom scrollbar styling (`::-webkit-scrollbar`) — thin (10px), rounded thumb in `--line-strong`, transparent track.

### Component style patterns
- **Accordion cards** use a rotating "+"→"×" caret (`transform: rotate(45deg)` on `.open`) instead of a chevron.
- **Pills everywhere**: nav counts, chips, source pills, category-count badges, and CTA buttons all favor `border-radius:999px` fully-rounded pill shapes over rectangular badges.
- **Left-border accent bars** (`border-left: 3-4px solid`) mark template text blocks, tips, and source blocks — a consistent "this is a highlighted/quoted block" signal throughout.
- **Selection color** is globally overridden (`::selection{background:var(--mimeo); color:var(--mimeo-ink)}`) to match brand green rather than default blue.

---

## 8. Copy/Content Inventory (verbatim highlights by category)

### Subject lines
- "this took 758 hours" / "best thing you have ever seen" / "you will LOVE me" / "do you like surprises?"
- The "Unsexy Line" internal-style: "[FirstName], quick idea" / "[FirstName], this morning" / "Sales team update" / "Q1 planning" / "Regarding pipeline"
- Instantly's coworker-style: "Thoughts [First Name]" / "Q4 forecasting" / "Austin" / "Strange question, [First Name]"
- Smartlead's colleague-style: "Quick question about [Company Name]" / "From admissions to enrollment"

### Opening lines
- Storyteller: "Picture this {{name}}..." / "Imagine this {{name}}..."
- Cheesy: "I'm sure your inbox is busier than a bee in a flower shop, so I'll make this quick."
- Ridiculous: "open this or I'll tattoo your name on my bald head" / "If you don't open this I'm shaving my head"
- Christian Bonnier's Trojan Horse: "I was checking out {{company}}'s website and noticed a few things that might be costing you more {{specific job type}}."

### Body lines
- Lazy Language (deliberately unpolished): "nice", "basically", "a bit", "thing", "pretty", "stuff", "cool", "kinda wacky", "grain of salt"
- Industry-flavoured humor: "If compliance reads this, tell them I used only approved words." (Fintech) / "I checked this email for threats. Just one. My sense of humour." (Cybersecurity)
- Instantly's Three Ideas Format: "Had a few ideas on how you could attract more high-ticket clients: 1) revamp your ads to target only premium clients, 2) build authority through strategic content, 3) automate your lead generation."

### Calls to action
- "Mind if I share a quick video going over a custom software idea I had in mind for you?" (Christian Bonnier)
- "Would it be okay if I send it over? / Mind if I share it with you?" (rephrase-to-avoid-defensiveness, Frank Brothers)
- "Take your pick: A) 500 verified leads for your ICP... B) 3 juicy strategies... C) A killer, high-converting outreach template... Just reply with the letter." (ABC CTA)
- "If this is annoying, reply with 'stop' and I will go touch grass." (Reverse-CTA, humor doc)

### P.S. statements
- "P.S. (For context, we help brands like Adidas and OnRunning generate leads through cold outreach campaigns that actually make people feel something)."
- "P.S. With your FCA background, you probably know better than most how quickly regulatory landscapes shift – especially in digital banking." (Monzo enterprise example)
- "PS: Our clients only pay if we get them 10 new clients in 30 days." (Instantly)

### Full worked template (Poke the Bear, verbatim)
> Template: `{{FirstName}} - ever considered the impact of {{specific problem}} from {{current solution/situation}} causing {{negative outcome}}?`
> Example: `Penn - ever considered the impact of all the leads you might be missing from Smartlead failing to tag them?`

### Full worked "Enterprise" example (Vodafone, verbatim)
> "Hey Yogesh, Some days, it must feel like you're the only one in your busy Paddington office who truly sees it. Daniel in Sales, still at his desk late-stressing over another urgent proposal. Ornella in Delivery, taking more breaks, just trying to reset after tough calls. Pamela in Finance, triple-checking numbers at 9 PM before a deadline. You push for better mental health support because 'We connect for a better future' isn't just about connectivity—it's about people... Would love to share the one thing they did that finally got people talking? (2-min video)"

---

## 9. Notable UX Patterns / Edge Cases

- **Per-tab search isolation**: `searchTerms` is keyed by tab id, so switching tabs preserves each tab's independent search string; the sidebar search box's placeholder and value are swapped on every tab change.
- **No true routing** — there is no URL hash/query-string state; refreshing the page always lands on the `templates` tab with an empty search, though the Draft Sheet and checklist ticks persist via `localStorage`/Firebase.
- **Legacy migration**: `loadSequence()` transparently upgrades a pre-existing single-draft `swipedesk_draft` string into the new multi-slot `sequence` array format, so older saved state isn't lost by the sequence-based redesign.
- **Client-exposed Firebase credentials**: the `firebaseConfig` (including `apiKey`) is hardcoded in plaintext in the shipped HTML — acceptable only because this is a single-user internal tool with (presumably) database security rules doing the real access control, not the API key.
- **"Sign out" button is decorative** — no `addEventListener` is wired to `.signout` anywhere in the script; the topbar auth UI is static chrome.
- **Auto-generated checklists blur the reference/actionable line**: the entire Rules & Principles ruleset is mechanically duplicated into the Pre-Send Checks tab as checkboxes, so every "rule" doubles as a "thing you can literally tick off" — a deliberate design choice per the inline comment ("Fold every rule/principle section into checkable pre-send items too... it all becomes something you can tick off").
- **Automated checker never blocks sending** — there is no send/export action gated on checks passing; the checker is purely advisory (a pass/fail readout), and the same `checkerState` is not linked back to the actual Draft Sheet content unless the user clicks "Load Active Email From Draft."
- **Encoding via `encodeURIComponent` in `data-*` attributes**: template text, examples, and snippet text are all URI-encoded when stored in `data-` attributes (e.g. `data-template`, `data-text`) to safely survive HTML attribute escaping of quotes/newlines/backticks, then decoded on click — a common vanilla-JS workaround for embedding arbitrary rich text in DOM attributes.
- **Modal fullscreen mode** repositions horizontal padding using `max(24px, calc(50% - 420px))`, effectively capping fullscreen reading width at ~840px while still allowing the modal chrome to span 100% of the viewport.
- **Xss-safe rendering discipline**: nearly all dynamic text insertion goes through `esc()`/`escAttr()` before being placed in `innerHTML`, with the sole deliberate exception of `highlightPlaceholders()` output (which escapes first, then re-inserts a controlled `<mark>` wrapper only around already-escaped `{{...}}` matches).
- **WhatsApp templates are explicitly scoped to warm-only use** — multiple rules and the WhatsApp template group itself state WhatsApp should never be used for cold prospecting, only nurture after a positive email reply.
- **No backend for templates/rules content** — all ~600+ swipe lines, ~130 templates, and ~431 lessons are static JS literals shipped in the HTML; only the user's own draft/sequence/checklist state round-trips through Firebase.

---

## Appendix: Quantitative Summary

| Dataset | Count |
|---|---|
| `TEMPLATES` (Frank Brothers fill-in templates) | 35 |
| `REAL_EXAMPLES` | 16 |
| `FRAMEWORKS` | 20 |
| `SWIPE` groups / individual lines | 88 groups / 589 lines |
| `POWER_WORDS` (Frank Brothers) | 155 words |
| `MATT_POWER_WORDS` / `CHRISTIAN_POWER_WORDS` / `INSTANTLY_POWER_WORDS` / `SMARTLEAD_POWER_WORDS` | 21 / 13 / 9 / 6 |
| `AVOID_PHRASES` | 9 categories, 76 phrases |
| `CTA_APPROACHES` | 4 |
| `RULES` sections | 13 |
| `PERSONALIZATION` angles | 95 |
| `CHECKLISTS` (incl. auto-generated) | 16 lists |
| `RULES_LESSONS` | 431, across 6 people × 15 categories |
| `ERIC_TEMPLATES` / `ERIC_MESSAGE_TEMPLATES` / `ERIC_FOLLOWUP_TEMPLATES` / `ERIC_CAMPAIGN_EXAMPLES` / `ERIC_PROBLEM_SNIFFING_EXAMPLES` | 27 / 18 / 4 / 14 / 2 |
| `MATT_TEMPLATES` / `MATT_FRAMEWORKS` | 9 / 11 |
| `CHRISTIAN_TEMPLATES` / `CHRISTIAN_FRAMEWORKS` | 4 / 8 |
| `INSTANTLY_TEMPLATES` / `INSTANTLY_FRAMEWORKS` | 6 / 6 |
| `SMARTLEAD_TEMPLATES` / `SMARTLEAD_FRAMEWORKS` | 3 / 5 |
| `AUTO_CHECKS` (automated pre-send rules) | 12 |
| `RESOURCES` (docs) / `RESOURCE_CHANNELS` (YouTube) | 11 / 6 |
| **Grand total addressable "content items"** | **~1,600+** individual templates, examples, lines, words, rules, lessons, and angles |
