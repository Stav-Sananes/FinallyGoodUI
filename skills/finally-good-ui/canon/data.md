# Data

Scope: dashboards, charts, tables and status displays; how quantitative information is chosen, encoded and densified so the reader sees the answer, not the decoration.

### data.data-ink

```yaml
id: data.data-ink
domain: data
principle: "Spend ink on data, not on its frame: remove 3D, gradients, heavy borders, redundant legends and background fills; mute gridlines and axes to a low-contrast neutral so marks sit on top."
why: "Every non-data pixel competes with the data for attention; stripping it raises the signal without adding anything."
sources: ["Tufte, The Visual Display of Quantitative Information, data-ink ratio and chartjunk", "Few, Information Dashboard Design", "Lidwell et al., Universal Principles of Design, Signal-to-noise ratio"]
applies-when: "Every chart, sparkline, KPI tile, and table."
not-when: "Editorial or storytelling graphics where an annotation layer is itself the data's explanation."
decides: [component.chart, component.kpi-tile, tokens.color]
tensions: [data.tension-density-clarity, color.color-not-sole-signal]
asked-by: []
checks:
  measured: "Probe on chart SVG/canvas containers: no gradient fills or drop shadows on marks; gridline/axis stroke contrast against background is lower than data-mark contrast; legend absent when a single series is directly labelled."
  judged: "Which element in this chart could be deleted without losing information, and why is it still there?"
```

### data.dashboard-summary-first

```yaml
id: data.dashboard-summary-first
domain: data
principle: "Lead with the few numbers that answer 'is everything OK?', each with comparison context (target, previous period, trend), then let the user drill to detail. Fit the summary on one screen without scrolling."
why: "A dashboard is for monitoring at a glance; numbers without comparison can't be judged, and a summary split across scrolls stops being at-a-glance."
sources: ["Few, Information Dashboard Design", "Shneiderman, The Eyes Have It (1996), overview first then details on demand", "NN/g, Dashboards: Making Charts and Graphs Easier to Understand"]
applies-when: "Any overview, home or monitoring screen showing metrics."
not-when: "Exploratory analysis tools, where the user builds the view."
decides: [blueprint.dashboard, component.kpi-tile]
tensions: [data.tension-density-clarity, ia-nav.progressive-disclosure, layout.hierarchy-by-weight]
asked-by: [interview.context.session]
checks:
  measured: "Probe at 1440x900: the KPI row is fully above the fold; each KPI tile contains a comparison element (delta, target, or sparkline); 3-7 KPIs in the summary band."
  judged: "Could someone glance for three seconds and say whether things are good or bad, and compared to what?"
```

### data.chart-choice

```yaml
id: data.chart-choice
domain: data
principle: "Choose the chart by the question and by encoding accuracy: position on a common scale beats length, which beats angle and area. Use bars for comparison, lines for change over time, dots for correlation, tables for exact lookup; avoid pies beyond 2-5 slices."
why: "People judge position and length far more accurately than angle, area or colour intensity, so the wrong chart makes the right data unreadable."
sources: ["Cleveland & McGill, Graphical Perception (1984)", "Few, Show Me the Numbers", "Tufte, The Visual Display of Quantitative Information"]
applies-when: "Any quantitative display."
not-when: "The user needs exact values rather than a pattern; use a table (data.dense-tables)."
decides: [component.chart, blueprint.dashboard]
tensions: [data.data-ink, personality.playful]
asked-by: [interview.content.type]
checks:
  measured: "Probe/static: pie or donut charts have 5 or fewer segments; bar charts have a zero baseline on the value axis; no dual y-axes."
  judged: "What question does this chart answer, and is its main visual variable position or length?"
```

### data.dense-tables

```yaml
id: data.dense-tables
domain: data
principle: "Design tables for scanning and comparison: right-align numbers with tabular figures, left-align text, keep units in headers, use sticky headers, quiet row separators and a density setting (row height about 32-48px)."
why: "Aligned tabular digits let the eye compare magnitudes down a column; zebra stripes, heavy borders and centred numbers break that vertical scan."
sources: ["Few, Show Me the Numbers", "NN/g, Data Tables: Four Major User Tasks", "IBM Carbon, Data table (row size options)"]
applies-when: "Any list with 3+ attributes per item or numeric columns."
not-when: "Fewer than ~5 items with rich content per item; use cards or a description list."
decides: [component.table, tokens.space, tokens.text]
tensions: [data.tension-density-clarity, a11y.target-size, personality.dense-expert]
asked-by: [interview.content.type, interview.content.volume]
checks:
  measured: "Probe on table cells whose text parses as numeric: text-align right and font-variant-numeric includes tabular-nums; thead is position sticky when the table exceeds viewport height; row height 24px or more."
  judged: "Can you compare the largest and smallest value in a column without reading every number?"
```

### data.status-encoding

```yaml
id: data.status-encoding
domain: data
principle: "Encode status with a small, fixed vocabulary (e.g. success, warning, danger, info, neutral), each a colour plus a distinct icon/shape plus a text label, used identically across the app; reserve saturated status colour for exceptions."
why: "When everything is coloured, nothing stands out; a redundant, consistent encoding lets users find the one problem among many rows without relying on hue."
sources: ["Few, Information Dashboard Design", "WCAG 2.2 SC 1.4.1 Use of Color", "IBM Carbon, Status indicators pattern"]
applies-when: "Badges, table status columns, alerts, chart thresholds, health indicators."
not-when: null
decides: [component.badge, component.alert, tokens.color]
tensions: [color.accent-restraint, data.data-ink]
asked-by: []
checks:
  measured: "Probe: each status element has text or an icon with accessible name; status colours map to the fixed token set; icon and label contrast pass 3:1 and 4.5:1."
  judged: "On a screen of 50 rows with one failure, does the failure jump out in under two seconds, even in grayscale?"
```

### data.tension-density-clarity

```yaml
id: data.tension-density-clarity
domain: data
principle: "Density (more data per screen, less scrolling, faster comparison) conflicts with clarity (space, larger type, less to parse). Density wins for frequent expert monitoring and comparison; clarity wins for occasional, novice, or decision-at-a-glance use."
why: "Experts lose time and context when data is spread across pages, while newcomers drown in a packed grid; neither 'airy' nor 'dense' is correct without the audience and task."
sources: ["Tufte, The Visual Display of Quantitative Information, data density", "Few, Information Dashboard Design", "Cooper et al., About Face, sovereign vs transient posture"]
applies-when: "Choosing table density, dashboard layout, spacing scale and base type size for data-heavy screens."
not-when: null
resolve-by: ["user expertise (interview.purpose.expertise)", "frequency and session length (interview.context.frequency, interview.context.session)", "content volume (interview.content.volume)", "primary device (interview.context.device)", "dense-airy position (interview.personality.dense-airy)"]
decides: [tokens.space, tokens.text, component.table, blueprint.dashboard]
tensions: [data.data-ink, data.dense-tables, personality.dense-expert, personality.calm, a11y.target-size]
asked-by: [interview.personality.dense-airy]
checks:
  measured: null
  judged: "Is the chosen density logged against the brief's expertise and volume facts, and is there a density toggle where both audiences exist?"
```
