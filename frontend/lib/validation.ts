export function messageForField(label: string, el: HTMLInputElement | HTMLSelectElement): string {
  const v = el.validity;
  if (v.valueMissing) return `${label} is required.`;
  if (v.typeMismatch) return el.type === "email" ? "Enter a valid email address." : el.type === "url" ? "Enter a valid URL." : "Enter a valid value.";
  if (v.tooShort) return `${label} is too short.`;
  if (v.patternMismatch) return `${label} doesn't match the expected format.`;
  return `Check ${label.toLowerCase()}.`;
}

/** Validates every `[name]` field found in `names` against the form's live DOM state. */
export function collectFormErrors(form: HTMLFormElement, fields: { name: string; label: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const el = form.elements.namedItem(f.name);
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
      if (!el.checkValidity()) errors[f.name] = messageForField(f.label, el);
    }
  }
  return errors;
}
