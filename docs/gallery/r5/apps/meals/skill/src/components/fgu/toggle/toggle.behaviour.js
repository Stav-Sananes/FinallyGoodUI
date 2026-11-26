// Toggle behaviour. A native <input type="checkbox"> already handles Space, focus, form value and
// the label click. attach adds only two things:
//  - a switch-shaped root gets role="switch" on its control if the markup left it out;
//  - data-indeterminate on a control sets the (property-only) indeterminate state, and the first
//    change clears it, as the native checkbox does.
// Every selector is scoped to data-fgu="toggle": attach may be given a whole page.
const CONTROL = '[data-fgu="toggle"] [data-part="control"]';

export function attach(root) {
  for (const control of root.querySelectorAll('[data-fgu="toggle"][data-variant="switch"] [data-part="control"]')) {
    if (!control.hasAttribute("role")) control.setAttribute("role", "switch");
  }
  for (const control of root.querySelectorAll(`${CONTROL}[data-indeterminate]`)) {
    control.indeterminate = true;
  }
  const clearIndeterminate = (event) => {
    const control = event.target.closest?.(CONTROL);
    if (!control) return;
    control.removeAttribute("data-indeterminate");
    control.indeterminate = false;
  };
  root.addEventListener("change", clearIndeterminate);
  return () => root.removeEventListener("change", clearIndeterminate);
}
