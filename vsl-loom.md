# VSL Loom — Documentation

Source file: `C:\Users\danja\Desktop\Claude\outreach-work\vsl-loom.html` (1,944 lines; single-file HTML/CSS/JS app)

---

## 1. Overview

**VSL Loom** ("Send Builder") is a single-page wizard tool for planning a personalized **Video Sales Letter (VSL)** — a short Loom video recorded and sent directly to one high-value prospect ("whale") as part of a cold-outreach campaign. It is one of several sibling tools inside a suite called **"Outreach Tools"** (the top bar links back to `index.html` labeled "← Outreach Tools"; siblings named in the brief include `physical-goods.html`, `strategy-doc.html`, `swipe-desk.html`).

The tool is not a video editor — it never touches actual video/audio. It is a **planning and scripting scaffold**: it structures research about a prospect, drafts (with optional AI help) a 7-beat spoken script for the Loom recording, tracks a production checklist for the actual filming/editing work (done outside the app), and manages the messaging (first DM/email + follow-up) used to deliver the Loom link, backed by a reusable template bank.

### Core philosophy: bespoke vs. batch (same-every-time) beats

The script's 7 beats are split into two categories, encoded via a `tag` field:

- **`bespoke`** — must be rewritten/re-shot for *this* specific whale every time (Hook, Problem You See). These are the only two beats the AI "Generate Script Draft" feature touches.
- **`same`** — recorded once per offer and reused unchanged across every send (Reason For Reaching Out, Who I Am, How You Can Solve It, Social Proof, CTA).

This bespoke/same split is the entire operating philosophy of the tool: it lets a single operator personalize *just enough* (a ~30-second bespoke segment) to feel individually made for the recipient, while batch-producing the rest of a 4–7 minute video once and splicing it in per-send — maximizing perceived personalization per unit of production effort.

The methodology is explicitly named in code/comments and the AI prompt as three "laws":
- **Attention Law** — nothing else matters until you've earned the whale's attention.
- **Individual Law** — you are researching and speaking to a human, not a job title.
- **Volume-Inverse Law** — fewer, sharper, hyper-specific sends beat generic mass outreach.

### Who it's for

A single operator/closer (the UI is signed in as "Dan") doing high-ticket B2B outreach to a small number of "whale" (7–8 figure) prospects, who personally researches each target, records/edits their own Looms, and sends the messaging manually (or via their own channel) — the tool is a private planning workspace, not a mass-send or CRM automation platform. There is no multi-user data; everything is local-browser state.

---

## 2. App shell & navigation

### Site chrome
- `.site-topbar-accent` — a 4px solid `#231F2E` bar across the very top (a brand accent shared across the Outreach Tools suite).
- `.site-topbar` — a flex bar containing:
  - Back link `← Outreach Tools` → `index.html`.
  - Centered `<h1>VSL Loom</h1>`.
  - Right-aligned "who" block: `Signed in as Dan` + a `Sign out` button (non-functional placeholder — no click handler wired for signout in the script).

### App grid
`#app` is a CSS grid with two areas: `rail` (sidebar, fixed width `--sidebar-w: 372px`) and `main` (content). Below 980px viewport width, the grid collapses to a single `main` column and the sidebar (`nav#rail`) becomes a fixed, off-canvas drawer (`transform:translateX(-100%)`) toggled by `.open`, triggered by a `Menu` button in a mobile-only top bar (`.mobile-topbar`) and closed via a `Close` button inside the rail (`#railCloseBtn`) or automatically whenever `setActiveStep()` runs on a narrow viewport.

### Sidebar (`nav#rail`) structure, top to bottom
1. **Logo block** (`.sidebar-logo`): a 28×28 rounded badge "VL", wordmark "VSL Loom" + sub-label "Send Builder", plus the mobile-only close button.
2. **Progress tracker** (`.sidebar-progress`): "Plan progress" label with an `X/4` counter (`#progressLabel`) and a thin progress bar (`#progressFill`) whose width is `doneCount/4 * 100%`.
3. **Scrollable rail body** (`.rail-scroll`), containing:
   - **Nav groups** (`#navGroups`) — single group labeled "Builder" listing the 4 wizard steps as clickable `step-item` rows, each showing a numbered circle (or a ✓ checkmark once "done"), a label, and status-based styling (`pending` / `progress` / `done` / `active`).
   - **Rail divider** — an "Loom Plan" eyebrow heading with a `Clear` button (`#clearPlanBtn`) that wipes the entire plan (with confirmation).
   - **Plan panel body** (`#ppBody`) — the "Loom Plan" tracker (see §5).
4. **Sidebar footer**: a full-width primary `Copy Plan` button (`#copyPlanBtn`) that copies a plain-text summary of the whole plan to the clipboard.

### The 4-step flow
Defined in the `STEPS` array:

| # | id | Label |
|---|----|-------|
| 1 | `research` | Research Fit |
| 2 | `script` | Script Builder |
| 3 | `record` | Record Loom |
| 4 | `messaging` | Messaging |

Navigation is non-linear — any step can be clicked directly in the sidebar at any time (no gating/locking based on completion). Each step page also has bottom "step-nav" Back/Next buttons (`stepNavHtml()`) that only render a "Previous"/"Next" button if one exists in sequence.

### Step status logic (`stepStatus(id)`)
Determines each step's sidebar indicator (`pending` / `progress` / `done`):
- **research**: `done` if both `prospect.name` and `prospect.problem` are filled; `progress` if any of name/niche/problem has content; else `pending`.
- **script**: counts how many of the 7 `SCRIPT_SECTIONS` have non-empty text in `plan.script`; `done` only if all 7 are filled, `progress` if 1–6 filled, `pending` if 0.
- **record**: counts checked items in `plan.production.checklist` against `PRODUCTION_CHECKLIST.length` (5); same 0/partial/all logic.
- **messaging**: `done` if both `firstMessage` and `followup` are non-empty; `progress` if either is non-empty; else `pending`.

### "Loom Plan" tracker panel (rail)
Rendered by `renderPlanPanel()` into `#ppBody`, five `plan-section` cards, each with a label, a "Change →" / "Set →" jump link (clicking jumps straight to the relevant step via `setActiveStep`), and a live value summary:
1. **Whale** — prospect name (+ niche as a sub-line) or "Not set yet".
2. **Script** — `X/7 beats written`.
3. **Production Checklist** — `X/5 checked`.
4. **First Message** — first 80 characters of the message (with `…` truncation) or "Not written yet".
5. **Follow-Up** — same truncation pattern for the follow-up body.

### Mobile behavior
- Below 980px: sidebar becomes a slide-in drawer; a `.mobile-topbar` appears showing the current step eyebrow (`Step X of 4`) and step name, updated by `renderMobileTopbar()`.
- Below 640px: `#content` and `.page-header` padding tighten (16px instead of 30px).
- Below 860px: the horizontal `msg-flow-track` (script beat visualization) collapses into a vertical stacked list with a dashed connecting line between steps instead of the horizontal dotted rail.
- Below 720px: modals go full-bleed (no border radius, fill the viewport).
- `prefers-reduced-motion: reduce` disables the page-header fade-in animation and modal open animations.

---

## 3. Full workflow walkthrough

### Step 1 — Research Fit

Page header: "Step 1 of 4 / Research Fit" (no subtitle text — `sub` argument passed as empty string).

**AI Setup callout** (`.callout.ai-setup`) — always shown first:
- Text: *"AI Setup. Paste your Anthropic API key to enable Generate Script Draft in Step 2. Stored only in this browser - never included in Copy Plan."*
- Password input `#rf-apikey` (placeholder `sk-ant-...`), a `Save Key` button, and a live status span reading either **"Key saved on this device"** (green/"set" class) or **"No key set - required to generate scripts"** (amber/"unset" class).
- The key is stored under its own localStorage key, `vslloom_api_key`, completely separate from the `plan` object — explicitly so it survives "Clear Plan" and is never included in "Copy Plan" text export.

**Prospect fields** (`.field-grid`, all plain `<input type=text>` except the two textareas below):

| Field | Input id | Label | Placeholder |
|---|---|---|---|
| Whale Name | `rf-name` | Whale Name | `e.g. Alex` |
| Industry / Market | `rf-niche` | Industry / Market | `e.g. B2B sales recruiting` |
| Company / Deal Size (optional) | `rf-channel` | Company / Deal Size (optional) | `e.g. Acme Recruiting - est. $30M ARR` |
| Landing Page (reference only) | `rf-landing` | Landing Page (reference only - not auto-fetched) | `e.g. https://theircompany.com` |

Note: internally the "Company/Deal Size" field is stored under the `prospect.channel` key (a holdover name — it does not represent an outreach channel).

**Research content textarea** (`#rf-content`, full-width, `.content-textarea`, min-height 140px):
- Label: *"Paste Anything About Them (About page, bio, recent post, press, interview - feeds Generate Script Draft)"*
- Placeholder: *"Paste their About page copy, LinkedIn bio, a recent post, an interview excerpt, press coverage - anything that shows who they are and where the business is headed."*
- Live character counter beneath it; turns into a warning state (`.over` class, amber) once length exceeds `CONTENT_MAX_CHARS = 8000`, showing *"N characters - only the first 8000 are sent"*.

**Problem You See textarea** (`#rf-problem`):
- Label: *"Problem You See (optional - if set, this anchors the Problem You See beat instead of the AI inferring one)"*
- Placeholder: *"e.g. They are stuck in the volume model - dozens of small clients instead of the handful of whales that would change their year."*

All fields persist to `plan.prospect` on every `input` event via `persistPlan()`, and immediately trigger `renderNav(); renderProgress(); renderPlanPanel();` to keep the sidebar in sync live.

---

### Step 2 — Script Builder

Page header: "Step 2 of 4 / Script Builder".

**Generate Script Draft callout** (`.callout.generate-bar`):
> *"Generate Script Draft. AI reads what you pasted in Research Fit and drafts the Hook and Problem You See - built on the Attention, Individual, and Volume-Inverse laws. The 5 reusable beats below are pre-seeded once and untouched by generation. Edit anything after."*

Button: `Generate Script Draft` (`#generateScriptBtn`) → calls `generateScriptDraft()`.

**Legend row** — two dot-legend items:
- Green/stamp square dot — *"Bespoke - rewrite / reshoot per whale"*
- Grey/outlined square dot — *"Same every time - batch-record once"*

**Beat-flow diagram** (`scriptFlowHtml()`) — a horizontal "msg-flow" visualization (see §5) rendering all 7 beats in order as numbered circular nodes connected by a dotted line, each labeled with its tag (`Bespoke` or `Same Every Time`) and beat name. Bespoke nodes render in a filled green gradient circle; "same" nodes render as a light outlined circle.

#### SCRIPT_SECTIONS (verbatim, all 7 beats)

| # | id | Label | Tag | Description | Placeholder |
|---|---|---|---|---|---|
| 1 | `hook` | Hook | bespoke | First 5 seconds. Say their name, do the unexpected - tied to who they are as a person, not their job title. The bar is not good outreach, it is unprecedented outreach - if a jaded 8-figure founder would not stop mid-scroll, it is not enough yet. | e.g. "{name}, I flew to find you. Nobody sends senior buyers this. Come, come now - I built something just for you." |
| 2 | `reason` | Reason For Reaching Out | same | Proves the Individual Law - you researched them as a human, not just a company. Non-negotiable - cutting this line is what tanks reply rates. Batch-record once. | e.g. "You built the {niche} space from nothing, and that is exactly the kind of market leader we love working with - not just another logo for a deck." |
| 3 | `problem` | Problem You See | bespoke | The specific, true gap in their growth model, outbound, or market position - named plainly and tied back to the {niche} space so it reads as observed, not generic. | e.g. "You are stuck in the volume trap - dozens of smaller clients instead of the handful of whales that would actually change your year." |
| 4 | `whoiam` | Who I Am | same | One line of credibility. Not a bio dump - just enough to earn the right to move into the value section. Batch-record once. | e.g. "My name is Dan, and my team and I build the outreach that signs 7 and 8-figure founders - the kind of outreach nobody else is willing to make." |
| 5 | `solution` | How You Can Solve It | same | The mechanism. Max 2 value shots: problem → why it matters → how you close it → why you're the one. Batch-record once per offer. | e.g. "The first way I'll help you make more money is by building the outreach that earns attention from senior buyers before anyone else even gets seen - here's everything that goes into it..." |
| 6 | `proof` | Social Proof | same | Results, whale logos, the dream state you're selling toward. Never changes whale to whale - batch-record once. | e.g. "Here's an 8-figure founder calling this the best outreach he has ever seen - one client closed $71K from 3 hyper-targeted sends." |
| 7 | `cta` | CTA | same | One bold, assumptive ask. Never "let me know your thoughts." Batch-record once. | e.g. "Send me your calendar, let's do this!" or "I've blocked the time, I'll book myself in - just say the word." |

Each beat renders as a `.msg-card` (green top accent bar for bespoke, grey for "same") with:
- Numbered badge, title, tag pill ("Bespoke" or "Same Every Time"), description text.
- If AI-generated, a `.script-source-tag` line: *"Generated from research - "{insight}""* — cleared automatically the moment the user manually edits that beat's textarea.
- A `<textarea>` pre-filled with the saved value (or empty, showing the placeholder), a live character counter, and a `Save Beat` button (saving is also implicitly captured on every keystroke via `persistPlan()`, so "Save Beat" is mostly a manual confirmation / toast trigger).
- **Bespoke beats only**: a `.token-preview` box below the textarea labeled *"Preview with {name} / {niche} filled in"*, showing the live text with `{name}`/`{niche}` tokens substituted via `fillTokens()` (falls back to literal `{name}`/`{niche}` if those prospect fields are empty).

#### DEFAULT_SAME_BEATS (verbatim — pre-seeded into a fresh plan)

```
reason:   "You've built something that stands out in your market, and that is exactly the kind of leader we love working with - not just another logo for a deck."
whoiam:   "My name is Dan, and my team and I build the outreach that signs 7 and 8-figure founders - the kind of outreach nobody else is willing to make."
solution: "The way I'll help you close more whale clients is by building the outreach that earns attention from senior buyers before anyone else even gets seen - here's everything that goes into it..."
proof:    "Here's an 8-figure founder calling this the best outreach he has ever seen - one client closed $71K from just 3 hyper-targeted sends."
cta:      "Send me your calendar, let's do this! Or - I've blocked the time, I'll book myself in, just say the word."
```

These 5 "same" beats are seeded into every `defaultPlan()` so the tool is usable out of the box without any research; `hook` and `problem` start blank.

#### AI script-drafting (Generate Script Draft) — full mechanics

Constants: `CONTENT_MAX_CHARS = 8000`, `AI_MODEL = 'claude-haiku-4-5-20251001'`, `BESPOKE_IDS = ['hook','problem']`.

`generateScriptDraft()` flow:
1. Guard: requires `plan.prospect.name` to be non-empty (toast "Add a Whale Name in Research Fit first" and abort otherwise).
2. Guard: requires an API key (`getApiKey()`); if missing, toasts "Add your API key in Research Fit first", auto-navigates to the Research step, and focuses the API key input.
3. If the Hook or Problem beat already has content, shows a confirm dialog: *"Overwrite the script? This replaces the Hook and Problem You See with a fresh AI draft. Anything you've written in those beats will be lost."* (Confirm label: "Generate Draft"). Aborts on cancel.
4. Disables the button and sets its label to "Generating...".
5. Builds a prompt via `buildAIPrompt({name, niche, company, problem, content, landingPage})` — `company` is sourced from `plan.prospect.channel`; `content` is truncated to the first 8000 characters.
6. Calls `callClaudeForScript(prompt)`, which POSTs directly from the browser to `https://api.anthropic.com/v1/messages` with headers `x-api-key` (the user's stored key), `anthropic-version: 2023-06-01`, and `anthropic-dangerous-direct-browser-access: true` (this header is required to call the Anthropic Messages API directly from client-side JS/browser origin rather than a backend). Body: `{model: AI_MODEL, max_tokens: 1024, messages:[{role:'user', content: promptText}]}`.
7. On a non-OK response: a 401 raises *"API key rejected - check it above and save again."*; any other status raises *"AI request failed ({status})."*
8. Parses `data.content[0].text`, stripping any accidental Markdown code fences, then `JSON.parse`s it. Parse failure raises *"AI returned something we couldn't read - try generating again."*
9. On success, for each of `hook` and `problem`: if the response has a non-empty string for that key, writes it into `plan.script[id]`; also stores `plan.scriptMeta[id] = {insight}` from `result.insights[id]` (or `null` if the AI reported no real source data was used).
10. Persists the plan, toasts "Script draft generated", and re-renders the Script step, nav, progress, and plan panel.
11. On any thrown error, toasts the error message and re-enables the button with its original label.

**buildAIPrompt() — exact prompt template sent to the model:**

```
You are ghostwriting cold-outreach VSL (video sales letter) script beats for someone who closes 7-8 figure "whale" clients for B2B deals. The doctrine: the Attention Law (nothing else matters until you've earned the whale's attention), the Individual Law (you are researching and speaking to a human, not a job title), and the Volume-Inverse Law (fewer, sharper, hyper-specific sends beat generic mass outreach).

Voice reference (match this register - direct, confident, a little cheeky, never corporate):
- Hook example: "{name}, I flew to find you. Nobody sends senior buyers this. Come, come now - I built something just for you."
- Problem example: "You are stuck in the volume trap - dozens of smaller clients instead of the handful of whales that would actually change your year."

Whale profile:
- Name: <prospect name, or "(unknown - use a generic but warm address)">
- Industry/Market: <niche, or "(unknown)">
- Company/Deal size: <channel field, or "(unknown)">
- Landing page (reference only, you cannot browse it): <landingPage, or "(none provided)">
- Explicit problem the sender already sees (use this verbatim as the anchor for the Problem beat if provided): <problem, or "(none provided - infer from pasted content below if possible)">

Pasted research content (About page, bio, recent posts, press, interview excerpts - may be empty):
"""
<content, truncated to 8000 chars, or "(none provided)">
"""

Write exactly 2 script beats:
1. "hook" - first 5 seconds, says their name, does something unexpected tied to them as a person (only if the pasted content actually supports a personal detail - otherwise keep it general and confident, do not invent facts).
2. "problem" - the specific, true gap in their growth model, outbound, or market position. If an explicit problem was given above, build on that. Otherwise infer one honestly from the pasted content. Never fabricate specifics (numbers, names, events) that are not present in the input.

For each beat also return a one-sentence "insight": the specific fact or phrase from the pasted content or inputs that beat draws on, in your own words. If a beat used no real source data (pure fallback/generic), set insight to null.

Respond with ONLY raw JSON, no markdown code fences, no extra prose, matching exactly this shape:
{"hook":"...","problem":"...","insights":{"hook":"..."|null,"problem":"..."|null}}
```

The AI is explicitly instructed never to fabricate facts not present in the research input, and to flag (via a nullable `insight`) whether a beat is grounded in real research or a generic fallback — the app surfaces that insight back to the user as the "Generated from research" source tag.

---

### Step 3 — Record Loom

Page header: "Step 3 of 4 / Record Loom".

**Production Checklist card** — renders `PRODUCTION_CHECKLIST` as checkbox list items (custom-styled checkboxes with a checkmark glyph on `:checked`), where checked items get a strikethrough on the bold heading and muted colors.

#### PRODUCTION_CHECKLIST (verbatim, all 5 items)

| key | Heading (`h`) | Description (`span`) |
|---|---|---|
| `researched` | Researched the specific problem | Confirmed via their business model, market position, or outbound - not a guess. |
| `batched` | Batch-recorded the templated beats | Reason For Reaching Out, Who I Am, How You Solve It (max 2 value shots), Social Proof, CTA. |
| `bespoke` | Shot the bespoke beats fresh | Hook and Problem You See - this whale only. |
| `runtime` | Kept runtime tight | Full VSL runs 4-7 minutes - the bespoke segment alone should be under 30 seconds. |
| `locations` | New Locations | Have you shot in different locations to keep the video fresh. |

Each checkbox toggle writes to `plan.production.checklist[key]`, persists, and fully re-renders the Record step plus nav/progress/plan-panel.

**Tools Used** section (`.tool-chips`) — a static row of pill chips listing the production toolkit:

```
DaVinci Resolve, Adobe Premiere, CapCut, Magnetic Mask (compositing), Artlist.io (music), Loom (delivery + open tracking)
```

(constant `TOOLS` array — purely informational, not interactive/checkable.)

---

### Step 4 — Messaging

Page header: "Step 4 of 4 / Messaging".

#### MESSAGE_SECTIONS (verbatim, both entries)

| id | num | Label | Description | Placeholder | Has Subject |
|---|---|---|---|---|---|
| `firstMessage` | 01 | First Message | Tease, don't pitch. Keep it under 80 words - the Loom does the selling, not the message around it. | e.g. Built this specifically for you - nobody else is sending this. 90 seconds, worth it. [link] | No |
| `followup` | 02 | Follow-Up | Bump the send if it goes unanswered - reference the Loom directly, never re-pitch from scratch. | e.g. Hey {name}, saw you had a look at the video - wanted to bump this in case it got buried. | Yes (subject placeholder: `Subject line...`) |

Each renders as an `.msg-card`:
- Numbered badge + title + description.
- A **"Browse Template Bank"** trigger button (`.tpl-trigger`, dashed border, list icon) showing a live count: *"N template(s) available - pick one to start from"* (`N` = total items across all categories for that section from `getTemplateGroups`).
- (Follow-Up only) a subject-line text input.
- The message body `<textarea>`.
- A footer with a live counter and a `Save Message` button:
  - **First Message** counts **words**, showing `N word(s)` and appending `- over 80` in a warning style if the count exceeds 80 (the stated word-limit guidance).
  - **Follow-Up** counts **characters** instead (no explicit cap/warning).

#### TEMPLATE_BANK (verbatim, all categories and items)

```js
TEMPLATE_BANK = {
  firstMessage: [
    { cat: 'General', items: [
      { title: 'Built This For You', subject: '',
        text: '{name} - built this specifically for you, nobody else is getting this. 90 seconds, worth it. [loom link]' },
      { title: 'Direct Tease', subject: '',
        text: '{name}, I flew to find you. Sending senior buyers a video like this is not something anyone else does. 90 seconds - come see.' },
    ]},
  ],
  followup: [
    { cat: 'General', items: [
      { title: 'Simple Bump', subject: 'Bumping this up',
        text: 'Hey {name}, saw you had a look at the video - wanted to bump this in case it got buried. Still worth the 90 seconds.' },
      { title: 'Reference The Loom', subject: 'In case it got lost',
        text: '{name}, following up on the Loom I sent over - built it specifically with {niche} in mind. Happy to send the calendar link if it landed.' },
    ]},
  ],
};
```

Every item is auto-assigned a stable id at load time (`ensureTemplateIds()` IIFE) of the shape `sectionId__CategoryName__index` (spaces in category replaced with underscores) if it doesn't already have one, e.g. `firstMessage__General__0`.

Both stock categories are literally named `General` — the template bank ships with only 2 templates per section, clearly meant to be expanded by the user via the "+ New Template" flow (see §5).

---

## 4. State & persistence

All state lives in `localStorage` (no backend/server). Keys:

| localStorage key | Holds | Loader | Persister |
|---|---|---|---|
| `vslloom_plan` | The whole prospect/script/production/messaging plan | `loadPlan()` | `persistPlan()` |
| `vslloom_api_key` | Anthropic API key (kept separate — never exported/cleared with the plan) | `getApiKey()` | `setApiKey(key)` |
| `vslloom_template_edits` | Per-section map of `{templateId: {title,subject,text,cat}}` overrides for built-in templates | `loadCustomTemplateEdits()` | `persistCustomTemplateEdits()` |
| `vslloom_template_adds` | Per-section array of fully custom user-created template items | `loadCustomTemplateAdds()` | `persistCustomTemplateAdds()` |
| `vslloom_template_deletes` | Per-section array of template ids the user has "deleted" (built-ins are soft-deleted, never mutated in source) | `loadCustomTemplateDeletes()` | `persistCustomTemplateDeletes()` |
| `vslloom_template_cats` | Per-section array of user-created category names (even empty ones with no items yet) | `loadCustomCategories()` | `persistCustomCategories()` |

All loaders wrap `JSON.parse` in try/catch and fall back to `{}` on any error/absence, so first-run and corrupted state both degrade gracefully to empty defaults.

### `plan` object shape — `defaultPlan()`

```js
{
  prospect: { name:'', niche:'', channel:'', landingPage:'', content:'', problem:'' },
  script: Object.assign({ hook:'', problem:'' }, DEFAULT_SAME_BEATS), // reason/whoiam/solution/proof/cta pre-seeded
  scriptMeta: { hook: null, problem: null },  // {insight: string} once AI-generated, else null
  production: { checklist: {} },              // e.g. {researched:true, batched:false, ...}
  firstMessage: '', followup: '', followupSubject: '',
}
```

### Backward-compatible schema migration — `loadPlan()`

When reading `vslloom_plan` from storage, the loader merges the parsed object onto a fresh `defaultPlan()` (so any missing keys fall back to defaults) and specifically handles an **older schema** that predates a "Messaging step redesign":
- Old shape: `plan.send = {channel, message}` and `plan.followup = {escalation, emails: [...]}` (an object, not a string, with an array of `{subject, body}` email objects).
- Migration logic:
  - `oldFollowupEmail = p.followup.emails[0]` if `p.followup.emails` is an array.
  - `firstMessage`: uses `p.firstMessage` if it's already a string, else falls back to `p.send.message`.
  - `followup`: uses `p.followup` if it's already a string, else falls back to `oldFollowupEmail.body`.
  - `followupSubject`: uses `p.followupSubject` if already a string, else falls back to `oldFollowupEmail.subject`.
- This means any plan saved under the previous "Send"/multi-email-followup data model is transparently upgraded to the current flat `firstMessage` / `followup` / `followupSubject` string fields the first time the app loads after the update, with no data loss for the first old followup email (subsequent old followup emails beyond index 0 are discarded).

### Template bank state functions

- **`getAllTemplateItems(sectionId)`** — merges: (a) every built-in `TEMPLATE_BANK[sectionId]` item not in the delete-list, with any matching `customTemplateEdits` override applied (`Object.assign`), plus (b) every user-added item from `customTemplateAdds[sectionId]` not deleted, tagged `custom:true`, also with edits applied. Deleted built-ins are filtered out at read time rather than mutated from source data.
- **`getCategoryList(sectionId)`** — a `Set` built from every effective item's `cat` plus any `customCategories[sectionId]` entries (so an empty custom category still shows up as a filter chip even with zero items); always guarantees at least `'General'` is present.
- **`getTemplateGroups(sectionId)`** — maps each category from `getCategoryList` to `{cat, items: [...items with that cat]}`, used to drive both the modal's grouped display and section trigger's item count.
- **`renameCategory(sectionId, oldName, newName)`** — validates non-empty/non-duplicate new name; re-tags all built-in items currently effectively in `oldName` (via an edit override) and all custom-add items (mutated in place) to `newName`; also renames the entry in `customCategories`; persists edits, adds, and categories. Returns `false` (with a toast "That category already exists") on collision.
- **`deleteCategory(sectionId, name)`** — refuses to delete `'General'` (toast: *"General is the default category and can't be deleted"*); otherwise reassigns every item currently in that category back to `'General'` (via edit overrides for built-ins, direct mutation for custom adds) and removes the name from `customCategories`.
- **`addCategory(sectionId, name)`** — trims and validates non-empty/non-duplicate, then pushes into `customCategories[sectionId]`.

---

## 5. UI components

### `msg-flow` beat-flow diagram
A rounded card (`border-radius:16px`) with a 3px top gradient bar (`stamp` green → `mimeo` green). Contains an eyebrow ("The Script, Beat By Beat"), a title ("Seven beats, same order every time"), and a horizontal track (`.msg-flow-track`) of numbered circular nodes connected by a dotted background line (`.msg-flow-line`, a `repeating-linear-gradient`). Bespoke nodes are filled dark-green gradient circles with a white number and a green "Bespoke" pill tag; "same" nodes are white/outlined circles with a grey number and an outlined "Same Every Time" pill tag. Collapses to a vertical stack with a dotted vertical connector below 860px.

### `msg-card` (shared by Script Builder and Messaging)
Rounded card with a 3px top gradient accent (green→green for bespoke/default, grey→grey for "same"/generic messages), a numbered square badge, title + tag pill, description text, then the input area (textarea or textarea+subject), and a footer row with a live counter (word or character count, with an "over" warning state) and a Save button. Hover state lifts the card slightly (`translateY(-1px)`) and deepens its shadow.

### Template bank trigger + modal
- **Trigger** (`.tpl-trigger`): a full-width dashed-border row with a list-icon badge, title "Browse Template Bank", a live subtitle of the template count, and an arrow — turns solid-bordered and tinted green on hover.
- **Modal** (`#modalOverlay` → `#modalBox`, reused generically for the template bank): overlay dims the page (`rgba(20,24,27,.45)`), box max-width 1180px / max-height 85vh with fade+scale-in animation (skipped under reduced-motion). The template-bank-specific variant adds class `tpl-modal-box` (max-width 980px).
  - **Head**: eyebrow "Template Bank", section title (e.g. "First Message"), section description, and action buttons: fullscreen toggle, `+ New Template`, `Close`.
  - **Controls bar**: a search input (`#tplSearch`, live-filters as you type, re-focuses and restores cursor position after each re-render since the whole modal HTML is replaced), a row of category filter chips (`All N`, then one chip per category with its item count, plus a `⚙ Manage Categories` toggle chip pinned to the right via `margin-left:auto`).
  - **Category management panel** (toggled open): lists every category with a rename (pencil) and delete (×, hidden for `General`) icon; inline rename swaps the row for a text input + Save/Cancel; a bottom row lets you type a new category name and `+ Add Category`.
  - **Body** (`.tpl-modal-body`): grouped-by-category grid of `.tpl-card` items (CSS grid, `auto-fill, minmax(260px,1fr)`), each showing title, optional subject line (styled in green), a truncated/scrollable text preview (`max-height:150px`), an edit (pencil) icon, an add (+) icon, and a full-width `Use this template` button. Clicking add/pencil either applies the template directly to the plan field or opens an inline edit form (`templateEditFormHtml`) with title/category-select/subject/body fields and Save/Cancel/Delete actions, replacing the card in place.
  - **Empty states**: if the section has zero templates at all, shows a pencil-icon "No templates yet" empty state prompting to add some; if templates exist but none match the current search/category, shows a magnifying-glass "No matches — Nothing found for "{query}"" state.
  - **Fullscreen toggle**: a small round button in the modal head (four-corner-arrows icon) toggles a `fullscreen` class on both the overlay and box, expanding the modal to fill the entire viewport with no border radius.

### Confirm dialog (`#confirmOverlay`)
A small centered dialog (max-width 380px) reused for every destructive/overwrite confirmation in the app (Generate Script Draft overwrite, category delete, template delete, Clear Plan). Implemented as a Promise-returning helper `showConfirm({title, message, confirmLabel, cancelLabel})` — `closeConfirm(result)` resolves the pending promise with `true`/`false`. Has a warning "!" icon badge, is dismissible by clicking the overlay backdrop or pressing Escape (resolves `false`), and auto-focuses the confirm button on open.

### Toast
A single fixed-position pill at the bottom-center of the screen (`#toast`), shown via `toast(msg)`, which sets the text, adds `.show` (fade+slide-up transition), and auto-hides after 1600ms (any pending timer is cleared first so rapid toasts don't stack/flicker).

### Checklist UI
Custom checkbox styling (native checkbox visually replaced): a rounded 18×18 box with a border that turns green and shows a white checkmark glyph (drawn via a rotated `::after` pseudo-element border, no image/font icon) when checked; label text and its bold heading get a muted/strikethrough treatment once checked.

---

## 6. Business logic / key functions

- **`esc(s)` / `escAttr(s)`** — HTML-escape helpers for text nodes and attribute values respectively (prevents injection from user-typed prospect/script/template content into innerHTML).
- **`toast(msg)`** — see above.
- **`showConfirm(opts)` / `closeConfirm(result)`** — Promise-based confirm dialog, see above.
- **`copyText(s)`** — wraps `navigator.clipboard.writeText`, toasts "Copied" or "Copy failed".
- **`fillTokens(str)`** — replaces `{name}`/`{niche}` (case-insensitive) in a string with the trimmed prospect values, or leaves the literal token in place if the corresponding field is empty. Used for the bespoke-beat token preview and for the "Copy Plan" text export.
- **`wordCount(s)`** — trims, splits on whitespace, filters empties, returns length. Drives the First Message's 80-word guidance counter.
- **`buildAIPrompt(...)` / `callClaudeForScript(promptText)` / `generateScriptDraft()`** — the AI script-drafting pipeline, fully detailed in §3.
- **`stepStatus(id)` / `doneStepCount()`** — compute each step's pending/progress/done state and the overall `X/4` counter (drives sidebar dots and the progress bar).
- **`renderNav()` / `renderProgress()` / `setActiveStep(id)`** — sidebar step list rendering, progress bar update, and step-switching (re-renders the whole app, scrolls content to top, triggers the header fade-in animation, closes the mobile drawer).
- **`pageHeaderHtml(eyebrow, title, sub)` / `stepNavHtml()` / `wireStepNav(box)`** — shared page-header markup and the bottom Back/Next step-navigation buttons used by every step page.
- **`renderResearchStep()` / `renderScriptStep()` / `renderRecordStep()` / `renderMessagingStep()`** — the four step-specific render functions; each builds an HTML string, injects it into `#content`, then wires up all event listeners for that step's inputs (every field listens on `input` and immediately persists + re-renders nav/progress/plan-panel for live feedback).
- **`scriptFlowHtml()` / `scriptCardHtml(s)`** — build the beat-flow diagram and each script beat's card (including the AI-source tag and bespoke token-preview block).
- **`msgCardHtml(s)`** — builds a Messaging-step card including the template-bank trigger and live word/char counter.
- **Template bank functions** — `getAllTemplateItems`, `getCategoryList`, `getTemplateGroups`, `renameCategory`, `deleteCategory`, `addCategory` (all detailed in §4), plus modal-specific helpers:
  - **`templateMatches(item, q)`** — case-insensitive substring match against title, subject, and body text; empty query always matches.
  - **`findTemplateById(groups, id)`** — linear search across grouped items for the "Use this template" / delete-confirmation flows.
  - **`templateEditFormHtml(section, it, catList)`** — renders the inline template-editor card (title, category `<select>`, subject, body textarea, Save/Cancel/Delete).
  - **`openTemplateModal(sectionId)` / `closeTemplateModal()` / `renderTemplateModal()`** — modal lifecycle: opening resets search/category-filter/editing state, closing tears down all transient modal-only state including fullscreen; `renderTemplateModal()` fully re-renders the head/controls/body and re-wires every button (search, category chips, category management CRUD, per-template edit/delete/use, "+ New Template").
  - **`fullscreenBtnHtml()` / `wireFullscreenBtn()`** — the fullscreen toggle icon button and its click handler.
- **`planSectionHtml(label, value, emptyText, jumpTo)` / `renderPlanPanel()`** — build each rail "Loom Plan" tracker card and its "Change/Set →" jump-to-step link.
- **`planText()`** — builds the full plain-text export used by "Copy Plan" (see §8 for exact structure/labels).
- **`renderStepContent()` / `renderMobileTopbar()` / `render()`** — top-level render dispatch; `render()` is the single function called on load and after every mutating action, and internally calls `renderNav`, `renderProgress`, `renderStepContent`, `renderPlanPanel`, `renderMobileTopbar` in sequence.
- **Top-level wiring** (bottom of script): mobile rail open/close buttons, click-outside-to-close for both the template modal and confirm dialog, Escape-key handling for both overlays (checks confirm first, then modal), `Copy Plan` button → `copyText(planText())`, and `Clear Plan` button → confirm dialog → `plan = defaultPlan(); persistPlan(); render();` (note: this does **not** clear the API key or any template-bank customizations — only the `vslloom_plan` state).

---

## 7. Styling system

### Design tokens (`:root` CSS custom properties)

| Token | Value | Purpose |
|---|---|---|
| `--paper` | `#FFFFFF` | Base background |
| `--paper-raised` | `#FFFFFF` | Card/raised-surface background |
| `--paper-tab` | `#FFFFFF` | Sidebar/tab background |
| `--ink` | `#14181B` | Primary text |
| `--ink-soft` | `#5B6560` | Secondary text |
| `--ink-faint` | `#757E78` | Tertiary/muted text |
| `--stamp` | `#1E6B45` | Primary brand green (accents, active states, "bespoke" tag) |
| `--stamp-ink` | `#FFFFFF` | Text-on-stamp color |
| `--mimeo` | `#2F8F5B` | Secondary/lighter green (hover accents, gradients, focus outline) |
| `--mimeo-ink` | `#E6F4EC` | Light green tint background (active chip, tag backgrounds) |
| `--line` | `#E4E9E6` | Default border color |
| `--line-strong` | `#CCD5D0` | Stronger border color (hover states, chip borders) |
| `--good` | `#2F8F5B` | Success/progress-bar-fill color (same as mimeo) |
| `--warn` | `#B4691A` | Warning/destructive color (over-limit counters, delete buttons, danger dialogs) |
| `--shadow` | `0 1px 0 rgba(20,24,27,.03), 0 8px 20px -12px rgba(20,24,27,.14)` | Default card shadow |
| `--shadow-hover` | `0 1px 0 rgba(20,24,27,.03), 0 14px 30px -14px rgba(20,24,27,.22)` | Elevated/hover card shadow |
| `--radius` | `8px` | Default corner radius |
| `--sidebar-w` | `372px` | Sidebar fixed width |
| `--font-display` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Headings/labels/buttons |
| `--font-body` | (same stack as display) | Body copy, inputs |
| `--font-mono` | `ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace` | API key input, counters, tool chips |
| `--ease` | `cubic-bezier(.2,.7,.3,1)` | Standard animation easing |
| `--dur-fast` | `.12s` | Fast transition duration |
| `--dur-base` | `.18s` | Base transition duration |

### Typography & color palette notes
The palette reads as a muted "paper + forest green stamp" theme — off-white/pure-white paper surfaces, near-black ink text, and a single accent green (`stamp`/`mimeo`) used consistently for: active nav state, focus outlines, "bespoke" tags, progress fill, primary buttons, and the msg-flow gradient. Warning/destructive actions (delete category/template, over-word-count, Clear Plan) use a burnt-orange (`--warn`, `#B4691A`) rather than red. All headings/labels/buttons use the display font stack (system UI fonts) in bold weights with uppercase+letter-spacing for eyebrow/label text; body copy uses the same stack at regular weight.

### `msg-flow-track` / `msg-flow-node` visualization CSS (detail)
- `.msg-flow-track` is a flex row (`justify-content:space-between`) of `.msg-flow-step` items, each `flex:1 1 0` so all 7 nodes space evenly regardless of container width.
- `.msg-flow-line` is an absolutely-positioned 2px-tall bar spanning the track (inset 21px from each edge to align with node centers) using a `repeating-linear-gradient` to fake a dashed/dotted connector, sitting at `z-index:0` behind the nodes (`z-index:1`).
- `.msg-flow-node` (bespoke default): 42×42 circle, `linear-gradient(160deg, var(--stamp), #164f33)` background, white bold number, a 3px white border plus a `box-shadow: 0 0 0 2px var(--stamp)` ring plus a soft drop shadow — this double-ring technique creates a "coin/stamp" look against the white page background regardless of what's behind it.
- `.msg-flow-step.same .msg-flow-node` swaps to a white circle with a `line-strong` colored ring instead, producing a visually "lighter/optional" look for reused beats vs. the "official/important" bespoke look.
- Tag pills (`.msg-flow-tag`) are uppercase, letter-spaced, pill-shaped, colored to match their node (green-filled for bespoke, outlined for same).
- Responsive collapse (<860px): flips to `flex-direction:column`, hides the dotted line, and instead draws a short vertical dashed connector (`::after` pseudo-element) beneath each step except the last, mimicking a vertical timeline.

### Notable component patterns
- **Card top-accent bars**: both `.msg-flow::before` and `.msg-card::before` use a 3px `linear-gradient(90deg, var(--stamp), var(--mimeo))` strip pinned to the top of the card — a repeated signature motif distinguishing "important" content blocks; the muted `.same` variant of `.msg-card` swaps this to a grey gradient.
- **Dashed borders for "add new" affordances**: the template-bank trigger button and template body textareas' subtle affordance styling use `1.5px dashed` borders that solidify and tint green on hover — signaling "click to expand" rather than "static container."
- **Custom checkbox** (`.check-item input[type=checkbox]`): fully `appearance:none`-reset and hand-drawn via CSS (rounded box + `::after` rotated-border checkmark) rather than relying on native browser checkbox styling, for cross-browser visual consistency.
- **Confirm/modal entrance animations**: `modalOverlayIn` (opacity fade) and `modalBoxIn` (opacity + translateY + scale) keyframes, both respecting `prefers-reduced-motion`.
- **Scrollbar styling**: a global thin custom scrollbar (`10px`, rounded thumb in `--line-strong`, transparent track) applied via `::-webkit-scrollbar` (WebKit/Blink only, no Firefox equivalent defined).

---

## 8. Copy/content inventory (verbatim methodology text)

This section consolidates every piece of prescriptive/methodology copy embedded in the tool, since it reveals the actual outreach doctrine being taught.

### The three "Laws" (from code comments + AI prompt)
- **Attention Law** — nothing else matters until you've earned the whale's attention.
- **Individual Law** — you are researching and speaking to a human, not a job title.
- **Volume-Inverse Law** — fewer, sharper, hyper-specific sends beat generic mass outreach.

### Script beat guidance — see full table in §3 (SCRIPT_SECTIONS `desc` + `placeholder` columns), reproduced key lines:
- Hook: *"The bar is not good outreach, it is unprecedented outreach - if a jaded 8-figure founder would not stop mid-scroll, it is not enough yet."*
- Reason: *"Non-negotiable - cutting this line is what tanks reply rates."*
- Solution: *"Max 2 value shots: problem → why it matters → how you close it → why you're the one."*
- CTA: *"One bold, assumptive ask. Never 'let me know your thoughts.'"*

### Production checklist copy — see full table in §3 (PRODUCTION_CHECKLIST). Key runtime rule: *"Full VSL runs 4-7 minutes - the bespoke segment alone should be under 30 seconds."*

### Messaging guidance
- First Message: *"Tease, don't pitch. Keep it under 80 words - the Loom does the selling, not the message around it."*
- Follow-Up: *"Bump the send if it goes unanswered - reference the Loom directly, never re-pitch from scratch."*

### Template bank copy — see full TEMPLATE_BANK block in §3.

### Copy Plan text export format (`planText()`), exact structure

```
VSL LOOM PLAN

WHALE
  Name: <name or "(not set)">
  Industry/Market: <niche or "(not set)">
  Company/Deal Size: <channel or "(not set)">
  Landing Page: <landingPage or "(not set)">
  Problem Observed: <problem or "(not set)">
  Research Content Pasted: yes (<N> characters) | no

SCRIPT (beats in order - [BESPOKE] rewrite per whale, [SAME] reuse as-is)

  1. Hook [BESPOKE] [FROM RESEARCH: "<insight>"]
     <token-filled text, or "(not written yet)">

  2. Reason For Reaching Out [SAME EVERY TIME]
     <text>

  ... (all 7 beats, each preceded by a blank line)

PRODUCTION CHECKLIST
  [x] Researched the specific problem
  [ ] Batch-recorded the templated beats
  ... (all 5 items, checked state reflected as x or blank)

MESSAGING
  First Message: <text or "(not written)">
  Follow-Up Subject: <subject or "(none)">
  Follow-Up: <text or "(not written)">
```

Note the `[FROM RESEARCH: "..."]` tag only appears on beats that were AI-generated with a real (non-null) insight, and beat text in the export runs through `fillTokens()` so `{name}`/`{niche}` are substituted with real values where known.

---

## 9. Notable UX / edge cases

- **Runtime-length guidance**: the full VSL should run **4–7 minutes**; the **bespoke segment** (Hook + Problem You See combined) should be **under 30 seconds** — stated explicitly in the `runtime` production-checklist item, reinforcing that the bulk of the video's length comes from the batch-recorded "same" beats.
- **First Message word-limit soft-validation**: a live word counter turns into a warning state (amber text, `- over 80` suffix) once the First Message exceeds 80 words, but this is advisory only — it never blocks saving or navigation.
- **Research content 8,000-character cap**: the textarea has no hard character limit (it will accept unlimited text), but only the first 8,000 characters are actually sent to the AI; the counter clearly communicates this via a live warning message rather than silently truncating.
- **AI generation guardrails**: requires both a Whale Name and a saved API key before it will run, with the tool proactively navigating the user to Research Fit and focusing the exact input if the key is missing, rather than just showing an error. It also explicitly warns before overwriting existing Hook/Problem content.
- **Non-destructive template deletes**: built-in `TEMPLATE_BANK` entries are never mutated on delete — they're added to a per-section delete-list and filtered out at read time — so restoring the app to a fresh state (e.g. clearing `localStorage`) would resurrect "deleted" stock templates. Only `vslloom_plan` is cleared by "Clear Plan"; template customizations and the API key persist independently and have no UI-exposed way to reset them short of clearing browser storage directly.
- **Category deletion safety**: the default `General` category cannot be renamed away entirely (well — it *can* be renamed since rename allows any name, but it cannot be *deleted*) — deleting any other category reassigns its templates to `General` rather than losing them, and a confirm dialog states this explicitly.
- **Empty states**: template modal shows distinct empty states for "no templates in this section at all" (pencil icon, "No templates yet") vs. "no results for current search/category filter" (magnifying glass icon, "No matches"). The Loom Plan tracker panel shows italic "Not set yet" / "Not written yet" placeholders for every unset section.
- **Live cross-panel sync**: virtually every field mutation in every step immediately calls `renderNav()`, `renderProgress()`, and `renderPlanPanel()` in addition to persisting — so the sidebar step-status dots, the top progress bar, and the "Loom Plan" tracker summary are always in sync with the active step's inputs without requiring an explicit save action (the "Save Beat"/"Save Message" buttons mainly exist to give an explicit toast confirmation).
- **Search input cursor preservation**: the template search input re-focuses itself and manually restores cursor position (`setSelectionRange`) after each keystroke, because `renderTemplateModal()` replaces the entire modal's `innerHTML` on every input event (a full re-render pattern used throughout the app) which would otherwise reset focus/cursor.
- **Schema migration is silent and one-way**: old-format plans (pre-redesign `send`/`followup.emails[]` shape) are transparently upgraded on load with no user-visible notice; if an old plan had more than one follow-up email queued, only the first is preserved and the rest are silently dropped.
- **No real backend / no data leaves the browser** except the direct Anthropic API call for script generation (which sends the prospect's name/niche/company/landing-page URL/problem statement and pasted research content, up to 8,000 characters, to `api.anthropic.com`) — everything else (plan, templates, checklist, API key) is pure `localStorage`, so switching browsers/devices or clearing site data loses all data with no export/import beyond the plain-text "Copy Plan" clipboard dump (which is one-way — there's no "paste plan back in" import feature).
- **Responsive behavior**: full drawer-based sidebar collapse below 980px with mobile top bar; single-column field grids below 640px; full-bleed modals below 720px; msg-flow diagram reflows from horizontal to vertical below 860px. Reduced-motion preference is respected across page-header transitions and modal open animations.
- **Sign-out button is non-functional**: `.signout` button in the top bar has no attached event listener in the script — it renders but does nothing when clicked, consistent with this being a local single-user tool with hardcoded "Signed in as Dan" text rather than real auth.
