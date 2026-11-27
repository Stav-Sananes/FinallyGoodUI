// Identifier spellings shared by the generators.
export const capitalize = (s) => s[0].toUpperCase() + s.slice(1);
/** "toast-store" -> "ToastStore" */
export const pascal = (s) => s.split(/[-_]/).map(capitalize).join("");
/** "aria-busy" -> "ariaBusy" */
export const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
