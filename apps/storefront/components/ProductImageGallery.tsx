"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@wsp/types";

type Props = {
  images: ProductImage[];
  fallback: { src: string; alt: string };
  categoryName?: string;
};

export function ProductImageGallery({ images, fallback, categoryName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const hasImages = images.length > 0;
  const hasMany = images.length > 1;

  const active = hasImages
    ? { src: images[activeIndex].url, alt: images[activeIndex].alt ?? fallback.alt }
    : fallback;

  function prev() {
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function next() {
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div>
      {/* ── Hauptbild ── */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 shadow-sm">
        <Image
          src={active.src}
          alt={active.alt}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {/* Kategorie-Badge */}
        {categoryName && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-white/90 backdrop-blur-sm text-brand-text text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {categoryName}
            </span>
          </div>
        )}

        {/* Pfeil-Navigation */}
        {hasMany && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Vorheriges Bild"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:bg-white transition-colors duration-150"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-brand-text">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Nächstes Bild"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:bg-white transition-colors duration-150"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-brand-text">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Punkt-Indikatoren (mobile) */}
        {hasMany && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Bild ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === activeIndex ? "bg-white scale-110" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail-Leiste ── */}
      {hasMany && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Bild ${i + 1} anzeigen`}
              className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                i === activeIndex
                  ? "border-brand-accent shadow-sm"
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${fallback.alt} – Bild ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
