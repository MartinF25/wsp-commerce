import type { StickerDisplay, StickerAdmin } from "@wsp/contracts";
import type { StickerWithRelations } from "../types";

/**
 * Löst die Sticker-Übersetzung auf.
 * Fallback-Kette: gewünschte Locale → DE → erste verfügbare.
 */
function resolveStickerTranslation(
  translations: StickerWithRelations["translations"],
  locale: string
) {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === "de") ??
    translations[0] ??
    null
  );
}

/**
 * Wandelt einen vollständig geladenen Sticker in den öffentlichen StickerDisplay-Contract um.
 * Löst locale-abhängige Felder auf (text, tooltip, link_url).
 */
export function toStickerDisplay(
  sticker: StickerWithRelations,
  locale = "de"
): StickerDisplay {
  const t = resolveStickerTranslation(sticker.translations, locale);

  return {
    id: sticker.id,
    type: sticker.type,
    position: sticker.position,
    position_x: sticker.position_x ?? null,
    position_y: sticker.position_y ?? null,
    priority: sticker.priority,
    size_config: (sticker.size_config as Record<string, string>) ?? {},

    image_url: sticker.image_url ?? null,

    text: t?.text ?? null,
    text_color: sticker.text_color ?? null,
    bg_color: sticker.bg_color ?? null,
    border_color: sticker.border_color ?? null,
    font_size: sticker.font_size ?? null,
    font_bold: sticker.font_bold,
    font_italic: sticker.font_italic,
    border_radius: sticker.border_radius ?? null,
    padding: sticker.padding ?? null,
    opacity: sticker.opacity !== null ? Number(sticker.opacity) : null,
    css_class: sticker.css_class ?? null,
    custom_css: sticker.custom_css ?? null,

    // Locale-spezifische Link-URL hat Vorrang, danach globale Sticker-URL
    link_url: t?.link_url ?? sticker.link_url ?? null,

    tooltip: t?.tooltip ?? null,
    tooltip_link_label: t?.tooltip_link_label ?? null,
    tooltip_link_url: t?.tooltip_link_url ?? null,
  };
}

/**
 * Wandelt einen Sticker in den vollständigen Admin-Contract um.
 * Enthält alle Felder inkl. Regeln und Translations-Array; kein Gültigkeitscheck.
 */
export function toStickerAdmin(sticker: StickerWithRelations): StickerAdmin {
  return {
    id: sticker.id,
    name: sticker.name,
    status: sticker.status,
    priority: sticker.priority,
    sort_order: sticker.sort_order,
    type: sticker.type,
    image_url: sticker.image_url ?? null,
    text_color: sticker.text_color ?? null,
    bg_color: sticker.bg_color ?? null,
    border_color: sticker.border_color ?? null,
    font_size: sticker.font_size ?? null,
    font_bold: sticker.font_bold,
    font_italic: sticker.font_italic,
    border_radius: sticker.border_radius ?? null,
    padding: sticker.padding ?? null,
    opacity: sticker.opacity !== null ? Number(sticker.opacity) : null,
    css_class: sticker.css_class ?? null,
    custom_css: sticker.custom_css ?? null,
    link_url: sticker.link_url ?? null,
    position: sticker.position,
    position_x: sticker.position_x ?? null,
    position_y: sticker.position_y ?? null,
    size_config: (sticker.size_config as Record<string, string>) ?? {},
    valid_from: sticker.valid_from?.toISOString() ?? null,
    valid_until: sticker.valid_until?.toISOString() ?? null,
    store_id: sticker.store_id ?? null,
    customer_groups: sticker.customer_groups as string[] | null,
    max_per_product: sticker.max_per_product,
    allow_override: sticker.allow_override,
    created_at: sticker.created_at.toISOString(),
    updated_at: sticker.updated_at.toISOString(),
    translations: sticker.translations.map((t) => ({
      id: t.id,
      locale: t.locale,
      text: t.text ?? null,
      tooltip: t.tooltip ?? null,
      tooltip_link_label: t.tooltip_link_label ?? null,
      tooltip_link_url: t.tooltip_link_url ?? null,
      link_url: t.link_url ?? null,
    })),
    rules: sticker.rules.map((r) => ({
      id: r.id,
      rule_type: r.rule_type,
      category_id: r.category_id ?? null,
      price_min_cents: r.price_min_cents ?? null,
      price_max_cents: r.price_max_cents ?? null,
      availability_status: r.availability_status ?? null,
      new_arrival_days: r.new_arrival_days ?? null,
    })),
    override_count: sticker.product_overrides.length,
  };
}
