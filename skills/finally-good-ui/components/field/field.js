// Field behaviour: the label, hint and error stay wired to the control, and validation follows
// recipes/patterns/form-validation.md (no error while typing a pristine field, show it on blur,
// clear it on the next keystroke once fixed). Messages come from `data-msg-<validity key>` on the control
// (data-msg-value-missing, data-msg-type-mismatch ...), else the browser's own text.
// Every selector is scoped to data-fgu="field": attach may be given a whole page, or the field itself.
const FIELD = '[data-fgu="field"][data-part="root"]';
const CONTROL = '[data-fgu="field"] [data-part="control"]';
let counter = 0;

const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];

// Fixed order (the browser's own order for the most useful message first), not for..in over ValidityState.
const VALIDITY_KEYS = ["valueMissing", "typeMismatch", "patternMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput", "customError"];
const message = (control) => {
  for (const key of VALIDITY_KEYS) {
    if (!control.validity[key]) continue;
    const attr = `msg${key[0].toUpperCase()}${key.slice(1)}`;
    return control.dataset[attr] || control.validationMessage;
  }
  return "";
};

// label[for], aria-describedby (hint then error) and aria-required, added only where the markup left them out.
function wire(field) {
  const control = field.querySelector(CONTROL);
  if (!control) return;
  const id = control.id || `fgu-field-${++counter}`;
  control.id = id;
  field.querySelector('[data-part="label"]')?.setAttribute("for", id);
  const ids = [];
  for (const part of ["hint", "error"]) {
    const el = field.querySelector(`[data-part="${part}"]`);
    if (!el) continue;
    el.id ||= `${id}-${part}`;
    ids.push(el.id);
  }
  if (ids.length && !control.hasAttribute("aria-describedby")) control.setAttribute("aria-describedby", ids.join(" "));
  if (control.required && !control.hasAttribute("aria-required")) control.setAttribute("aria-required", "true");
}

// Write into the existing text node when there is one, so a framework that owns that node keeps a live reference to it.
function setText(el, text) {
  const node = el.firstChild;
  if (node && node.nodeType === 3) node.data = text; else el.textContent = text;
}

function show(field, control) {
  const error = field.querySelector('[data-part="error"]');
  // A framework wrapper marks the error line data-controlled while its `error` prop has a message: the prop wins,
  // validation stays out of the way until the prop is cleared.
  if (error?.hasAttribute("data-controlled")) return;
  const text = message(control);
  if (text) control.setAttribute("aria-invalid", "true");
  else control.removeAttribute("aria-invalid");
  if (error && error.textContent !== text) setText(error, text);
}

/** Shows every field's message at once (what blur does one control at a time) and focuses the first invalid control.
 *  Returns true when the form is valid. Call it from a submit handler, or let attach do it: attach validates a form's
 *  fields on submit and cancels the submit (so a method="dialog" form stays open) when one is invalid. Pair it with
 *  `novalidate` on the form so the browser's own bubbles do not pre-empt these messages. */
export function validate(form) {
  let first = null;
  for (const control of form.querySelectorAll(CONTROL)) {
    const field = control.closest(FIELD);
    if (field) show(field, control);
    if (!control.validity?.valid && !first) first = control;
  }
  first?.focus();
  return !first;
}

export function attach(root) {
  for (const field of within(root, FIELD)) wire(field);

  const owner = (event) => {
    const control = event.target.closest?.(CONTROL);
    return control ? { control, field: control.closest(FIELD) } : null;
  };
  // focusout (it bubbles; blur does not): the field was touched, so validate it now.
  const onFocusOut = (event) => {
    const hit = owner(event);
    if (hit?.field) show(hit.field, hit.control);
  };
  // Once invalid, re-validate on every keystroke so the message goes away the moment it is fixed.
  const onInput = (event) => {
    const hit = owner(event);
    if (hit?.field && hit.control.getAttribute("aria-invalid") === "true") show(hit.field, hit.control);
  };
  // Capture phase: this runs before the page's own submit handlers and before a method="dialog" form closes its dialog.
  const onSubmit = (event) => {
    const form = event.target;
    if (form.matches?.("form") && form.querySelector(CONTROL) && !validate(form)) event.preventDefault();
  };
  root.addEventListener("submit", onSubmit, true);
  root.addEventListener("focusout", onFocusOut, true);
  root.addEventListener("input", onInput, true);
  return () => {
    root.removeEventListener("submit", onSubmit, true);
    root.removeEventListener("focusout", onFocusOut, true);
    root.removeEventListener("input", onInput, true);
  };
}
