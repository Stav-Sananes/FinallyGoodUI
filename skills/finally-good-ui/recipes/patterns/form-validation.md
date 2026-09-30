# Pattern: form-validation

**Intent:** catch mistakes at the right moment — after the user leaves a field, never while they are still typing it — and say exactly how to fix them.

**Cards:** flows-forms.inline-validation-timing · flows-forms.labels-above · usability.error-prevention · writing.error-messages · color.color-not-sole-signal · a11y.keyboard-complete · flows-forms.primary-action-clarity

**When NOT to use:** as a substitute for prevention — constrain inputs first (pickers, `inputmode`, sensible defaults: flows-forms.sensible-defaults); for single-field search boxes.

**Tokens:** `--color-destructive` · `--color-ring` · `--space-*` · `--text-sm` · `--duration-short` · `--ease-enter`

## Timing rules
1. **Pristine:** no errors while typing a field for the first time.
2. **On blur** (field touched and non-empty, or required and left empty after interaction): validate and show the message.
3. **Once invalid, on input:** re-validate every keystroke so the error clears the moment it's fixed ("reward early, punish late").
4. **On submit:** validate all; if any fail, show an error summary at the top, focus it, and link each item to its field.
5. **Server errors:** map field errors back onto fields; show non-field errors in the summary. Keep the user's input.

## States
| State | UI |
|---|---|
| pristine | labels above fields, hints visible, submit enabled (don't disable submit — it hides the reason) |
| invalid | red border + icon + message under the field; `aria-invalid="true"` |
| valid | no decoration by default; a check only where confirmation matters (username available) |
| submitting | button shows progress label ("Saving…"), `aria-busy`, fields stay readable; prevent double submit |
| submit-error | summary with links + preserved values; network failures get Retry |
| success | navigate, or inline confirmation + next step; toast only if the user stays on the page |
| loading (edit form) | skeleton fields of the right height; don't render empty inputs that then jump to filled |
| no-permission | read-only values as text (not disabled inputs) + who can edit |

## CSS baseline
```html
<form novalidate>
  <div class="error-summary" role="alert" tabindex="-1" hidden><h2>Fix 2 fields to continue</h2><ul></ul></div>
  <div class="field">
    <label for="email">Work email</label>
    <p class="hint" id="email-hint">We send the invoice copy here.</p>
    <input id="email" name="email" type="email" required autocomplete="email"
           aria-describedby="email-hint email-err" data-msg-value-missing="Enter your work email"
           data-msg-type-mismatch="Enter an email like name@company.com">
    <p class="error" id="email-err" hidden></p>
  </div>
  <button type="submit">Create account</button>
</form>
```
```css
.field { display: grid; gap: var(--space-1); margin-block-end: var(--space-4); }
.field input { font-size: max(16px, 1rem); min-block-size: 44px; border: 1px solid var(--color-input); border-radius: var(--radius-sm); }
.field input:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 1px; }
.field input[aria-invalid="true"] { border-color: var(--color-destructive); border-width: 2px; }
.hint { margin: 0; font-size: var(--text-sm); color: var(--color-muted-foreground); }
.error { margin: 0; font-size: var(--text-sm); color: var(--color-destructive); display: flex; gap: var(--space-1); }
.error::before { content: "!"; font-weight: 700; }                 /* non-colour cue; swap for an icon */
.error:not([hidden]) { animation: err-in var(--duration-short) var(--ease-enter); }
@keyframes err-in { from { opacity: 0; transform: translateY(-2px); } }
@media (prefers-reduced-motion: reduce) { @keyframes err-in { from { opacity: 0; } } }
```
No shake animations: they read as scolding and are vestibular noise.

```js
const msg = el => { for (const k in el.validity) if (k !== 'valid' && el.validity[k]) return el.dataset['msg' + k[0].toUpperCase() + k.slice(1)] || el.validationMessage; };
function show(el) {
  const out = document.getElementById(el.id + '-err');
  const bad = !el.validity.valid;
  el.setAttribute('aria-invalid', String(bad));
  out.hidden = !bad; out.textContent = bad ? msg(el) : '';
  return bad;
}
form.addEventListener('focusout', e => { if (e.target.matches('input,select,textarea') && (e.target.value || e.target.dataset.touched)) show(e.target); });
form.addEventListener('input', e => { e.target.dataset.touched = '1'; if (e.target.getAttribute('aria-invalid') === 'true') show(e.target); });
form.addEventListener('submit', e => {
  const bad = [...form.elements].filter(el => el.willValidate && show(el));
  const sum = form.querySelector('.error-summary');
  sum.hidden = !bad.length;
  if (!bad.length) return;                       // let it submit (or handle via fetch)
  e.preventDefault();
  sum.querySelector('h2').textContent = `Fix ${bad.length} field${bad.length > 1 ? 's' : ''} to continue`;
  sum.querySelector('ul').replaceChildren(...bad.map(el => {
    const li = document.createElement('li'), a = li.appendChild(document.createElement('a'));
    a.href = '#' + el.id; a.textContent = msg(el); return li;
  }));
  sum.focus();
});
```
Custom messages: `data-msg-<validity-key-in-kebab>` (e.g. `data-msg-value-missing`) is read back as `dataset.msgValueMissing`; unmapped keys fall back to the browser's message.

## React + Motion
No Motion needed. Use the project's form library if present (React Hook Form: `mode: "onTouched"`, `reValidateMode: "onChange"` implements rules 1–3; Zod/Valibot for schemas). Render errors with the same markup/ARIA as above.

## Vue / Svelte
- Vue: VeeValidate (`validateOnBlur: true, validateOnModelUpdate: false` until touched) or hand-roll with `@blur` + a `touched` ref; `<Transition name="err">` for messages.
- Svelte/SvelteKit: form actions return `fail(400, { errors, values })` for server errors; client timing via `on:blur`/`oninput` handlers + `use:enhance`.

## A11y
- Visible labels above inputs (placeholders are not labels). Hints and errors wired with `aria-describedby`.
- Error summary: `role="alert"` or focus on submit, links jump to fields. Required fields marked in text ("required") or mark optional ones — be consistent.
- `autocomplete` tokens on personal data; inputs ≥ 16px to avoid iOS zoom.

## Upgrade trigger
Suggest a form library + schema validator only for forms with > ~8 fields, cross-field rules, or multi-step state; state the size.
