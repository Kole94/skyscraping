## Skyscraping – Figma design spec

This spec is based on the current implemented UX in `frontend/app/*` and `frontend/components/*`.

### Design goals
- **Clean and fast**: content-first lists, minimal chrome.
- **Consistent**: one card/list language across Words/Articles/Appearances.
- **Authed-only actions**: add/delete word visible only when token exists.
- **Readable**: article context snippets are the “hero” on word detail.

---

## 00 Foundations

### Frame presets
- **Desktop**: 1440×1024 (content centered)
- **Tablet**: 834×1112
- **Mobile**: 390×844

### Layout grid
- **Desktop container**: max width 1040, centered
- **Desktop margins**: 24 (outside container), container padding: 16
- **Grid**: 12 columns, 24 gutter (optional; lists can be single column)

### Spacing system
Use 4px base: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.

### Typography
Use **Inter** (falls back to system). Suggested styles:
- **H1**: 32 / 700 / 1.2
- **H2**: 24 / 700 / 1.2
- **H3**: 16 / 600 / 1.3
- **Body**: 16 / 400 / 1.6
- **Body (dense)**: 14 / 400 / 1.4
- **Caption**: 12 / 500 / 1.3

### Color
Import `tokens.studio.json`, then create these semantic styles (names are suggestions):
- `bg/canvas`, `bg/surface`, `bg/subtle`
- `text/primary`, `text/secondary`, `text/muted`, `text/link`
- `border/default`, `border/focus`
- `brand/primary`
- `status/success`, `status/warning`, `status/danger`

### Radius + elevation
- **Card radius**: 10
- **Control radius**: 6
- **Badge radius**: 999
- **Card shadow**: subtle (`shadow/sm`)

---

## 01 Components (build with Auto Layout)

### App Shell
**Component**: `AppShell/Header`
- **Height**: 56–64
- **Layout**: left nav + right auth actions
- **Left**: Brand “Skyscraping” (link) + tabs: Words, Articles
- **Right (unauth)**: text links Login / Register
- **Right (auth)**: secondary button “Logout”
- **Bottom border**: 1px `border/default`

### Tabs / nav link
**Component**: `Nav/Link`
- States: default / hover / active
- Active: `text/primary` + small underline or pill background `bg/subtle`

### Button
**Component**: `Button`
- Variants:
  - **Primary**: bg `brand/primary`, text `text/inverse`
  - **Secondary**: bg `bg/subtle`, text `text/primary`, border `border/default`
  - **Danger** (for delete): bg `danger/50`, text `danger/700`, border `danger/500` (subtle)
- Sizes: sm (32h) / md (40h)
- States: default / hover / pressed / disabled / loading (optional)

### Text input
**Component**: `Input/Text`
- Height 40, padding 12
- Border 1px `border/default`, focus ring 2px `border/focus` (in Figma: outer stroke)
- States: default / focus / error / disabled
- Support left label + helper text variants for auth forms

### Badge
**Component**: `Badge/Count`
- Pill radius
- Background `bg/subtle`, text `text/secondary`
- Min height 20–22, padding X 8

### Card / List item
**Component**: `Card/ListItem`
- Surface `bg/surface`, border 1px `border/default`, radius card
- Padding 12–16
- Optional header row (title + trailing meta/actions)

### Empty state
**Component**: `EmptyState`
- Icon placeholder (optional), title, description, optional action
- Used when:
  - Words list empty
  - Articles list empty
  - Word detail has no appearances

### Inline meta row
**Component**: `Meta/Inline`
- Small text 12–14, `text/muted`
- Separators: “•”

### Context snippet (Word detail)
**Component**: `ContextSnippet`
- Background `bg/subtle`, radius 6
- Padding 8–12
- Body dense 14/1.4

---

## 02 Screens

### Screen: Words (Home) `/`
**Purpose**: track words, see how often they appear in scraped articles.

**Layout (desktop)**
- Header (global)
- Page header:
  - H1 “Words”
  - Helper line: “Showing N words from the backend.”
- Auth-only block: `AddWordForm`
  - Input “New word”
  - Primary button “Add”
  - Inline status text (Saving… / Added / error)
- List: vertical stack of `WordListItem`

**WordListItem (row)**
- Left: word link (primary)
- Right:
  - `Badge/Count` (from stats)
  - Auth-only `Delete` (danger secondary)
- Subtext:
  - “by {user_name}” (caption)
  - created timestamp (caption)

**States**
- Loading: skeleton list items (optional)
- Error (backend down): empty list + subtle alert “Unable to load words”
- Authed vs Unauthed:
  - Unauthed: no Add form, no Delete actions

**Primary interactions**
- Click word → Word Detail
- Add word (authed): optimistic status then refresh
- Delete word (authed): confirm modal recommended (current app doesn’t confirm; design should)

---

### Screen: Word detail `/word/:id`
**Purpose**: show where the word appears in scraped articles.

**Layout**
- Back link “← Back to words”
- H1: `"word"`
- Meta block:
  - “Added by X on DATE”
  - “Found in N articles”
- Section:
  - If no appearances: `EmptyState` (“Not found yet”)
  - Else:
    - H2 “Appearances”
    - Stack of `AppearanceCard`

**AppearanceCard**
- Title (H3): article title as external link
- Meta row: date + badge “N appearances”
- Contexts: list of `ContextSnippet` blocks

**States**
- Word not found: title “Word Not Found”, short message, back link

---

### Screen: Articles `/articles`
**Purpose**: browse scraped articles.

**Layout**
- H1 “Articles”
- Helper line: “Showing N articles.”
- List of `ArticleCard`

**ArticleCard**
- Title link (external)
- Right meta: created datetime
- Submeta: source · category
- Snippet: first ~300 chars

**States**
- Empty: `EmptyState` (“No articles yet”)
- Error: subtle alert + empty list

---

### Screen: Login `/login`
**Layout**
- H1 “Login”
- Auth card centered on desktop:
  - Email input
  - Password input
  - Primary button “Sign in”
  - Status text area
- Secondary link under form: “Create an account” → `/register` (add in design even if not in code yet)

**States**
- Error: inline error message (red)
- Success: success message + optional redirect pattern in prototype

---

### Screen: Register `/register`
Same structure as Login:
- Name / Email / Password
- Primary button “Create account”
- Secondary link: “Already have an account?” → `/login`

---

## 03 Prototypes (recommended)

### Flow A: First time user
Words → Register → back to Words (authed) → add word → see word in list → open word detail.

### Flow B: Returning user
Words (unauth) → Login → Words (authed) → delete word.

### Flow C: Reading
Words → Word detail → open article (new tab) → Articles page.

---

## Suggested Figma file structure
- **Page “00 Foundations”**
  - Color styles, type scale, spacing/radius notes
- **Page “01 Components”**
  - AppShell, Buttons, Inputs, Cards, Badges, EmptyState, Snippets
- **Page “02 Screens”**
  - Desktop + Mobile frames for each route
- **Page “03 Prototypes”**
  - Connect frames with interactions

