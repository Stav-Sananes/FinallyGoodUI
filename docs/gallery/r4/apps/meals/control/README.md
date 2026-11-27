# Table for three (meals, control)

Vue 3 + Vite + TypeScript (`<script setup>`), no router, no UI libs, no CDN. `npm install && npm run dev` / `npm run build`.

- Plan Mon-Sun dinners from 11 recipes (search, vegetarian filter), choose who eats and who cooks per night.
- Shopping list builds from the plan, scales by diners, merges duplicates, groups by aisle; tick off, add extras, clear ticked.
- States: loading skeleton, error (corrupt storage or `?fail=1`), empty week, empty list, no search results, all-ticked, empty-name validation.
- State persists in localStorage. Shortcuts: no backend (load delay is simulated), fixed week label, quantities scaled by simple rounding.
