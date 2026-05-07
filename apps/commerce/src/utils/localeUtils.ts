import type { ProductTranslation, ProductVariantTranslation } from "@prisma/client";

// ─── Generisch ────────────────────────────────────────────────────────────────

/**
 * Wählt die beste Translation aus einem beliebigen Array von Objekten mit locale-Feld.
 * Gibt { value, fallbackUsed } zurück — fallbackUsed=true wenn auf DE zurückgefallen.
 * Gibt null zurück wenn weder die angefragte Locale noch DE vorhanden ist.
 */
export function resolveLocale<T extends { locale: string }>(
  items: T[],
  locale: string,
  fallback = "de"
): { value: T; fallbackUsed: boolean } | null {
  const exact = items.find((t) => t.locale === locale);
  if (exact) return { value: exact, fallbackUsed: false };
  const de = items.find((t) => t.locale === fallback);
  if (de) return { value: de, fallbackUsed: true };
  return null;
}

/**
 * Resolves the best matching translation for the requested locale.
 * Falls back to the DE entry if the requested locale has no entry.
 * Returns null only when neither the requested locale nor DE has an entry
 * (incomplete product — should not occur in production if seed/admin enforces DE).
 */
export function resolveTranslation(
  translations: ProductTranslation[],
  locale: string,
  fallback = "de"
): ProductTranslation | null {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === fallback) ??
    null
  );
}

/**
 * Resolves the best matching variant translation for the requested locale.
 * Falls back to the DE entry if the requested locale has no entry.
 */
export function resolveVariantTranslation(
  translations: ProductVariantTranslation[],
  locale: string,
  fallback = "de"
): ProductVariantTranslation | null {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === fallback) ??
    null
  );
}
