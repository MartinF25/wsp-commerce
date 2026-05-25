-- CreateEnum
CREATE TYPE "FeatureMatchType" AS ENUM ('exact', 'contains', 'starts', 'ends', 'regex');

-- CreateEnum
CREATE TYPE "FeatureVisualScope" AS ENUM ('global', 'category', 'product');

-- CreateEnum
CREATE TYPE "FeatureDisplayMode" AS ENUM ('icon_value', 'icon_name_value', 'grouped', 'compact', 'tooltip_only', 'grid', 'horizontal', 'vertical');

-- DropForeignKey
ALTER TABLE "sticker_product_overrides" DROP CONSTRAINT "sticker_product_overrides_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sticker_product_overrides" DROP CONSTRAINT "sticker_product_overrides_sticker_id_fkey";

-- DropForeignKey
ALTER TABLE "sticker_rules" DROP CONSTRAINT "sticker_rules_sticker_id_fkey";

-- DropForeignKey
ALTER TABLE "sticker_translations" DROP CONSTRAINT "sticker_translations_sticker_id_fkey";

-- CreateTable
CREATE TABLE "feature_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "names" JSONB NOT NULL DEFAULT '{}',
    "descriptions" JSONB,
    "match_pattern" TEXT,
    "match_type" "FeatureMatchType" NOT NULL DEFAULT 'contains',
    "category_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_visuals" (
    "id" TEXT NOT NULL,
    "feature_definition_id" TEXT,
    "feature_value" TEXT,
    "scope" "FeatureVisualScope" NOT NULL DEFAULT 'global',
    "category_id" TEXT,
    "product_id" TEXT,
    "image_url" TEXT,
    "svg_content" TEXT,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "alt_texts" JSONB,
    "labels" JSONB,
    "tooltips" JSONB,
    "link_url" TEXT,
    "link_target" TEXT DEFAULT '_self',
    "link_rel" TEXT,
    "color_primary" TEXT,
    "color_secondary" TEXT,
    "css_class" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_visuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_visual_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enable_product_page" BOOLEAN NOT NULL DEFAULT true,
    "enable_quick_view" BOOLEAN NOT NULL DEFAULT true,
    "enable_miniature" BOOLEAN NOT NULL DEFAULT false,
    "enable_faceted_search" BOOLEAN NOT NULL DEFAULT true,
    "enable_collection" BOOLEAN NOT NULL DEFAULT true,
    "enable_search_results" BOOLEAN NOT NULL DEFAULT true,
    "default_display_mode" "FeatureDisplayMode" NOT NULL DEFAULT 'vertical',
    "default_icon_size" TEXT NOT NULL DEFAULT 'md',
    "show_labels" BOOLEAN NOT NULL DEFAULT true,
    "show_tooltips" BOOLEAN NOT NULL DEFAULT true,
    "enable_animations" BOOLEAN NOT NULL DEFAULT true,
    "responsive_config" JSONB,
    "product_page_mode" "FeatureDisplayMode" NOT NULL DEFAULT 'grid',
    "product_page_position" TEXT NOT NULL DEFAULT 'below_description',
    "product_page_columns" INTEGER NOT NULL DEFAULT 3,
    "miniature_mode" "FeatureDisplayMode" NOT NULL DEFAULT 'compact',
    "miniature_max_icons" INTEGER NOT NULL DEFAULT 4,
    "miniature_position" TEXT NOT NULL DEFAULT 'bottom',
    "facet_show_icons" BOOLEAN NOT NULL DEFAULT true,
    "facet_show_labels" BOOLEAN NOT NULL DEFAULT false,
    "facet_collapsible" BOOLEAN NOT NULL DEFAULT true,
    "facet_lazy_render" BOOLEAN NOT NULL DEFAULT true,
    "font_size" TEXT NOT NULL DEFAULT 'sm',
    "font_weight" TEXT NOT NULL DEFAULT 'medium',
    "track_interactions" BOOLEAN NOT NULL DEFAULT false,
    "enable_ab_testing" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_visual_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_definitions_slug_key" ON "feature_definitions"("slug");

-- CreateIndex
CREATE INDEX "feature_definitions_slug_idx" ON "feature_definitions"("slug");

-- CreateIndex
CREATE INDEX "feature_definitions_category_id_idx" ON "feature_definitions"("category_id");

-- CreateIndex
CREATE INDEX "feature_visuals_feature_definition_id_idx" ON "feature_visuals"("feature_definition_id");

-- CreateIndex
CREATE INDEX "feature_visuals_feature_value_idx" ON "feature_visuals"("feature_value");

-- CreateIndex
CREATE INDEX "feature_visuals_scope_priority_idx" ON "feature_visuals"("scope", "priority");

-- CreateIndex
CREATE INDEX "feature_visuals_category_id_idx" ON "feature_visuals"("category_id");

-- CreateIndex
CREATE INDEX "feature_visuals_product_id_idx" ON "feature_visuals"("product_id");

-- CreateIndex
CREATE INDEX "market_listings_price_cents_idx" ON "market_listings"("price_cents");

-- AddForeignKey
ALTER TABLE "sticker_translations" ADD CONSTRAINT "sticker_translations_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticker_rules" ADD CONSTRAINT "sticker_rules_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticker_product_overrides" ADD CONSTRAINT "sticker_product_overrides_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticker_product_overrides" ADD CONSTRAINT "sticker_product_overrides_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_definitions" ADD CONSTRAINT "feature_definitions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_visuals" ADD CONSTRAINT "feature_visuals_feature_definition_id_fkey" FOREIGN KEY ("feature_definition_id") REFERENCES "feature_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_visuals" ADD CONSTRAINT "feature_visuals_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_visuals" ADD CONSTRAINT "feature_visuals_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "stickers_valid_from_until_idx" RENAME TO "stickers_valid_from_valid_until_idx";
