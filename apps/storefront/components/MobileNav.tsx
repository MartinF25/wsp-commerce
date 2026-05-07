"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";

type Props = {
  labels: {
    solarzaun: string;
    skywind: string;
    kombiloesungen: string;
    products: string;
    blog: string;
  };
};

export function MobileNav({ labels }: Props) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass =
    "block px-4 py-3 text-sm font-medium text-brand-text hover:text-brand-accent hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-0";

  return (
    <>
      {/* Hamburger-Button – nur auf mobile/tablet sichtbar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="lg:hidden p-2 -mr-1 rounded-lg text-brand-text hover:bg-gray-100 transition-colors duration-150"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Transparenter Klick-Catcher: schließt Menü bei Klick daneben */}
      {open && (
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Dropdown-Panel */}
      <div
        id="mobile-menu"
        role="navigation"
        aria-label="Mobile Navigation"
        className={`fixed top-16 inset-x-0 z-50 bg-white border-b border-gray-100 shadow-lg lg:hidden transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Link href="/solarzaun" onClick={close} className={linkClass}>{labels.solarzaun}</Link>
          <Link href="/skywind" onClick={close} className={linkClass}>{labels.skywind}</Link>
          <Link href="/kombiloesungen" onClick={close} className={linkClass}>{labels.kombiloesungen}</Link>
          <Link href="/products" onClick={close} className={linkClass}>{labels.products}</Link>
          <Link href="/blog" onClick={close} className={linkClass}>{labels.blog}</Link>
        </div>
      </div>
    </>
  );
}
