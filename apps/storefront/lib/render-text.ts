export function renderText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return fallback;

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => renderText(item, ""))
      .filter((item) => item.trim().length > 0);
    return parts.length > 0 ? parts.join(", ") : fallback;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["label", "name", "title", "text", "value"]) {
      const nested = record[key];
      if (nested != null) {
        const rendered = renderText(nested, "");
        if (rendered.trim().length > 0) return rendered;
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}
