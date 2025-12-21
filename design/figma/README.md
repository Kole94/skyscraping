## Skyscraping – Figma design pack (spec + tokens)

This folder contains a **Figma-ready design spec** for the current Skyscraping app screens and a **Tokens Studio** token file you can import into Figma.

### What this project currently has (screens)
- **Words list** (`/`): list of tracked words, add word (authed only), delete word (authed only), shows per-word count badge from `/api/words/stats`.
- **Word detail** (`/word/:id`): word meta + list of appearances by article, each with context snippets.
- **Articles list** (`/articles`): list of scraped articles with title, date, source/category, snippet.
- **Login** (`/login`): email + password; stores JWT token in `localStorage`.
- **Register** (`/register`): name + email + password; stores JWT token in `localStorage`.
- **Header** (global): brand + nav (Words/Articles) + auth links or Logout.

### Files
- `Skyscraping-Figma-Spec.md`: Frames, components, states, spacing, typography, and interaction notes.
- `tokens.studio.json`: Import into Figma via **Tokens Studio** plugin (Design Tokens).

### How to use in Figma
1. Create a new Figma file: **Skyscraping UI**.
2. Install the plugin **Tokens Studio for Figma**.
3. In Tokens Studio:
   - Import → JSON → select `tokens.studio.json`.
   - Apply tokens to styles (colors, typography, radii, spacing).
4. Create pages:
   - **00 Foundations**
   - **01 Components**
   - **02 Screens**
   - **03 Prototypes**
5. Build screens following `Skyscraping-Figma-Spec.md` (Auto Layout-heavy).

