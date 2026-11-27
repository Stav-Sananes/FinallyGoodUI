import { Primitive } from "@radix-ui/react-primitive";

export function Button({ loading = false, icon, children, ...rest }) {
  return (
    <div data-part="root" aria-busy={loading ? "true" : undefined} {...rest}>
      {icon ? <span data-part="icon" aria-hidden="true">{icon}</span> : null}
      <span data-part="label">{children}</span>
      {loading ? <span data-part="spinner" aria-hidden="true"></span> : null}
    </div>
  );
}
