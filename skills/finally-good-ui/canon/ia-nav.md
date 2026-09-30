# Information Architecture & Navigation

Scope: how content and functions are grouped, how many top-level destinations exist, which navigation model carries them, and how users know where they are. These cards drive `blueprint.nav-model` and the screen inventory.

### ia-nav.visible-destinations
```yaml
id: ia-nav.visible-destinations
domain: ia-nav
principle: "Keep the top-level destinations visible and labelled at all times on every viewport where space allows. Hiding primary navigation behind a hamburger is a last resort for secondary items, not the default."
why: "Out of sight is out of mind. Hidden navigation is used less, and features behind it get discovered less. Visible labels also tell a newcomer what the product does."
sources: ["Krug, Don't Make Me Think (3rd ed.), ch.6 Street Signs and Breadcrumbs", "NN/g, Hamburger Menus and Hidden Navigation Hurt UX Metrics", "Apple HIG, Tab bars", "Material 3, Navigation bar"]
applies-when: "Primary destinations of any multi-screen app, at both mobile and desktop widths."
not-when: "Immersive single-task modes (editor canvas, media player, checkout) may hide global navigation if a clear exit remains."
decides: [blueprint.nav-model, component.nav, layout.shell]
tensions: [ia-nav.tension-discoverability-minimalism]
asked-by: [interview.context.frequency, interview.jobs.top-tasks]
checks:
  measured: "At 375 px and 1440 px, primary nav links (inside nav landmark) are visible without opening a menu. Where a toggle is used at 375 px, the link count behind it is 6 or more."
  judged: "Can a first-time user list the product's main areas from the default screen without clicking anything?"
```

### ia-nav.nav-model-by-count
```yaml
id: ia-nav.nav-model-by-count
domain: ia-nav
principle: "Pick the navigation model from the number and depth of top-level destinations. Use 2–5 for a tab bar on mobile or top nav/tabs on desktop, 5–9 for a sidebar or navigation rail with labels, more than 9 or deep trees for grouped sidebar sections or hub-and-spoke with drill-in, and a linear flow for sequential tasks."
why: "Each model has a physical capacity. Mobile bottom bars fit about 5 labelled targets, rails about 7, and drawers or sidebars scale with grouping. Too many items slow choice (Hick's Law), so over capacity you regroup rather than cram."
sources: ["Material 3, Navigation bar / Navigation rail / Navigation drawer (destination counts)", "Apple HIG, Tab bars and Sidebars", "Tidwell et al., Designing Interfaces (3rd ed.), ch.3 Getting Around (Hub and Spoke, Multilevel, Step by Step)", "Yablonski, Laws of UX, 'Hick's Law'"]
applies-when: "Choosing the app shell in the blueprint, and whenever destinations are added or removed."
not-when: "Content sites whose structure is a feed or search-first. See ia-nav.search-vs-browse."
decides: [blueprint.nav-model, layout.shell, component.nav]
tensions: [ia-nav.shallow-vs-deep, ia-nav.tension-discoverability-minimalism]
asked-by: [interview.context.device, interview.jobs.top-tasks]
checks:
  measured: "Count links in the primary nav landmark. Flag a bottom tab bar with more than 5 items, a top nav with more than 7, or an ungrouped sidebar with more than 9."
  judged: "Does the blueprint's destination count justify the chosen model, and is the reasoning recorded?"
```

### ia-nav.wayfinding-location
```yaml
id: ia-nav.wayfinding-location
domain: ia-nav
principle: "Every screen answers 'where am I, how did I get here, where can I go'. Show a page title that matches the nav label that led there, a persistent current-item indicator, breadcrumbs or a back target for depth of 2 or more levels, and URLs that reflect the location."
why: "People arrive mid-app from links, notifications and search, not from the home screen. Without location cues they cannot orient themselves or recover."
sources: ["Krug, Don't Make Me Think (3rd ed.), ch.6 Street Signs and Breadcrumbs", "Tidwell et al., Designing Interfaces (3rd ed.), ch.3 (signposts and wayfinding)", "WCAG 2.2, SC 2.4.2 Page Titled, SC 2.4.8 Location"]
applies-when: "All multi-screen apps, and especially nested detail and settings pages."
not-when: null
decides: [component.nav, component.breadcrumb, component.page-header, blueprint.nav-model]
tensions: []
asked-by: [interview.context.session]
checks:
  measured: "Each route has a unique document.title and exactly one h1. The active nav item carries aria-current='page'. Screens 2+ levels deep have a breadcrumb or back link."
  judged: "Cropped to the content area only, does the screenshot still tell you which section and item you are in?"
```

### ia-nav.shallow-vs-deep
```yaml
id: ia-nav.shallow-vs-deep
domain: ia-nav
principle: "Prefer broad, shallow hierarchies, about 2–3 levels to any leaf, with well-grouped menus over many narrow levels. Go deeper only when each level is a meaningful, predictable choice. Tabs inside a view count as a level."
why: "Each extra level adds a click, a wait and a chance to guess wrong. Studies favour breadth over depth provided groups are clearly labelled and scannable. Labelling is what limits breadth, not a magic 7."
sources: ["Tidwell et al., Designing Interfaces (3rd ed.), ch.2 Organizing the Content", "Krug, Don't Make Me Think (3rd ed.), ch.4 Animal, Vegetable, or Mineral?", "NN/g, Flat vs. Deep Website Hierarchies"]
applies-when: "Structuring the screen inventory and settings, and grouping features in the blueprint."
not-when: "Very large catalogues or document trees, where a guided drill-down plus search beats a wall of options."
decides: [blueprint.ia, blueprint.nav-model, blueprint.screens]
tensions: [ia-nav.nav-model-by-count, ia-nav.progressive-disclosure]
asked-by: []
checks:
  measured: "From the root route, the shortest click path to each screen in the inventory is 3 or fewer. Top tasks take 2 or fewer."
  judged: "Would a user predict which branch holds each top task, or is any step a coin-flip between vague labels?"
```

### ia-nav.progressive-disclosure
```yaml
id: ia-nav.progressive-disclosure
domain: ia-nav
principle: "Show what most people need for the current step and reveal advanced or rare options on request (expanders, 'more options', secondary screens). Keep the trigger visible and descriptively labelled, and never hide what the top tasks need."
why: "Fewer choices speed decisions and reduce errors for the majority, while experts still reach everything. It fails when the split between basic and advanced is wrong, because frequent needs then cost an extra click every time."
sources: ["Lidwell et al., Universal Principles of Design, 'Progressive Disclosure'", "NN/g, Progressive Disclosure (Nielsen)", "Tidwell et al., Designing Interfaces (3rd ed.), ch.10 (forms and controls)"]
applies-when: "Settings, filters, forms with optional fields, and feature-rich toolbars."
not-when: "Options that more than about 20% of users need on a typical visit. Show those by default."
decides: [component.disclosure, component.filters, blueprint.screens]
tensions: [ia-nav.tension-discoverability-minimalism, ia-nav.shallow-vs-deep]
asked-by: [interview.purpose.expertise]
checks:
  measured: "Disclosure triggers are buttons with aria-expanded and aria-controls, and have a text label (not an icon only)."
  judged: "Is anything behind a disclosure that a top task from the brief needs on most runs?"
```

### ia-nav.search-vs-browse
```yaml
id: ia-nav.search-vs-browse
domain: ia-nav
principle: "Offer search as a primary path when users arrive knowing what they want or the item count outgrows scanning (roughly more than 50–100 items). Keep browsing (categories, filters, recents) for exploration and for people who can't name the thing. Big collections need both."
why: "Known-item seekers are slowed by trees, and explorers are stranded by an empty search box. Offering several ways to reach content is also an accessibility requirement."
sources: ["Krug, Don't Make Me Think (3rd ed.), ch.6 (search and browsing)", "Tidwell et al., Designing Interfaces (3rd ed.), ch.2 and ch.7 Lists of Things", "WCAG 2.2, SC 2.4.5 Multiple Ways"]
applies-when: "Collections, docs, catalogues, admin tables, and any app with more than one page of items."
not-when: "Small fixed sets (under ~20 items) where search is clutter."
decides: [blueprint.nav-model, component.search, component.command-menu, component.filters]
tensions: [ia-nav.tension-discoverability-minimalism]
asked-by: [interview.content.volume]
checks:
  measured: "If any list route renders more than 50 items, a search input (role=search or type=search) is present on that route or globally."
  judged: "Given content.volume in the brief, can both a known-item seeker and a browser reach a target in 3 steps or fewer?"
```

### ia-nav.tension-discoverability-minimalism
```yaml
id: ia-nav.tension-discoverability-minimalism
domain: ia-nav
principle: "Showing more (labels, visible nav, toolbars, inline options) makes features discoverable but adds noise. Showing less (icons only, hidden menus, disclosure) calms the screen but hides capability. Decide per feature from its frequency and importance, not per app."
why: "Discoverability wins for new or infrequent users, features that drive success metrics, and anything tied to safety. Minimalism wins for daily users who already know the map, and for content-first screens where chrome competes with the work. The usual answer is to keep top tasks visible, put secondary items one click away and put rare ones in menus or the command palette."
sources: ["Nielsen, 10 Usability Heuristics, #8 Aesthetic and minimalist design", "Norman, The Design of Everyday Things (rev. 2013), ch.1 (discoverability)", "Krug, Don't Make Me Think (3rd ed.), ch.5 Omit Needless Words"]
applies-when: "Deciding what goes in primary nav, toolbars, and icon-only vs labelled controls."
not-when: null
decides: [blueprint.nav-model, component.toolbar, component.nav, layout.density]
tensions: [ia-nav.visible-destinations, ia-nav.progressive-disclosure, usability.self-evident]
resolve-by: [jobs.top-tasks, context.frequency, purpose.expertise, jobs.first-run]
asked-by: []
checks:
  measured: "Icon-only buttons have an accessible name and a tooltip. Controls for top tasks are visible without opening a menu."
  judged: "Is every top task visible on its screen, and is every always-visible control earning its space?"
```
