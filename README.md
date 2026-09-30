# finally-good-ui

A Claude Code plugin that designs and builds **complete applications** the way a senior product designer would. That means multi-screen apps with navigation, flows, every empty, loading and error state, and a coherent motion language.

Most AI design skills hand the model *answers*: presets, style catalogues and ban lists. That is why their output looks AI-generated. finally-good-ui hands the model **judgment**:
- a canon of design principles distilled from the classic books and standards;
- explicit trade-offs, resolved against a brief;
- a check of the rendered result against the same principles.

## What it does

1. **Design interview:** one question at a time. Each question explains *why it matters*, grounded in the canon, and "you decide" is always an option.
2. **App blueprint:** information architecture, navigation model, key flows, screen inventory and a state matrix. Every decision is cited, and you approve the blueprint before any pixels.
3. **3 animated directions:** your real key screen, built three different ways with real motion, shown side by side. Pick one or mix them.
4. **System:** tokens and a motion language, emitted into *your* stack (Tailwind v3/v4, shadcn, MUI, CSS variables).
5. **Build:** shell, then components, then screens, then every state, then transitions. It adapts to your stack and suggests a dependency only when one is needed.
6. **Verify, always on:**
   - a static check after every edit;
   - a browser walk through your real flows at mobile and desktop widths, in light and dark, plus reduced motion, with states forced;
   - measured checks for accessibility, layout and motion;
   - an independent reviewer subagent;
   - at most 2 fix rounds.
7. **Decision log:** `.design/decisions.md` explains every choice with its principle and source.

It also works on existing apps: `extract` turns your codebase into a design system, and `review` audits your current UI.

## Install

See the [repository README](../README.md) and [INSTALL.md](../INSTALL.md) for all options.

```bash
claude plugin marketplace add Stav-Sananes/finally-good-ui
claude plugin install finally-good-ui@finally-good-ui-market
```

## Use

```
/finally-good-ui                         full pipeline for a new app or big feature
/finally-good-ui interview               design interview only
/finally-good-ui blueprint               interview + blueprint
/finally-good-ui directions              3 animated directions
/finally-good-ui build                   system + build + verify
/finally-good-ui review                  audit the current UI (changes nothing)
/finally-good-ui extract                 codebase → .design/brand.md + tokens.json
/finally-good-ui export                  rules for Cursor, Windsurf, Copilot, AGENTS.md
```

For full browser verification, the project needs Playwright:
`npm i -D playwright @axe-core/playwright && npx playwright install chromium`.
Without it, the skill uses any available browser tool or falls back to static checks, and tells you so.

## What it writes in your project

`.design/`: `config.json` · `brief.md` · `blueprint.md` · `brand.md` · `tokens.json` · `decisions.md` · `flows.json` · `directions/` · `reports/`

Set `"directions": "off"` or `"hook": "off"` in `.design/config.json` to skip those steps.

## Sources

The canon cites, among others:
- **Usability and interaction:** Krug, *Don't Make Me Think*; Norman, *The Design of Everyday Things*; Cooper, *About Face*; Tidwell, *Designing Interfaces*
- **Visual design:** Wathan & Schoger, *Refactoring UI*; Lidwell, *Universal Principles of Design*; Müller-Brockmann, *Grid Systems*; Albers, *Interaction of Color*
- **Typography:** Bringhurst, *The Elements of Typographic Style*; Lupton, *Thinking with Type*
- **Motion:** Thomas & Johnston, *The Illusion of Life*; Head, *Designing Interface Animation*; Saffer, *Microinteractions*
- **Data:** Few, *Information Dashboard Design*; Tufte, *The Visual Display of Quantitative Information*
- **Forms, layout and inclusion:** Silver, *Form Design Patterns*; Pickering, *Inclusive Design Patterns*; Pickering & Bell, *Every Layout*
- **Psychology:** Yablonski, *Laws of UX*
- **Standards:** WCAG 2.2, Nielsen Norman Group heuristics, Apple HIG, Material 3
- **Practitioners:** Emil Kowalski, Rauno Freiberg, Josh Comeau, Vercel's Web Interface Guidelines

Every principle is written in our own words, with citations. Informed by these works; not endorsed by their authors.

## Status

v0.1: ~70 canon cards, 22 interview questions, 15 recipes, and all scripts with tests. Planned next: the full ~180-card canon, 25+ recipes, and an evaluation set with a before/after gallery.
