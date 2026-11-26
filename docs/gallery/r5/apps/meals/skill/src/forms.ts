/** Shows the scaffolded field's error on every invalid control (it validates on focusout) and says whether the form is valid. */
export function validateForm(form: HTMLFormElement): boolean {
  const bad = [...form.querySelectorAll<HTMLInputElement>('[data-fgu="field"] [data-part="control"]')].filter((c) => !c.checkValidity());
  for (const c of bad) c.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  bad[0]?.focus();
  return bad.length === 0;
}
