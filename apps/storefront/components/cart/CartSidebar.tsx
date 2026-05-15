"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatCartCurrency } from "@/lib/cart";
import { Link } from "@/i18n/navigation";

export function CartSidebar() {
  const { cart, isOpen, closeCart, updateQuantity, removeFromCart } = useCart();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Schließen bei Klick außerhalb
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        closeCart();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, closeCart]);

  // Schließen bei Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeCart]);

  // Body-Scroll sperren wenn geöffnet
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Warenkorb"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-brand-dark">
            Warenkorb
            {cart.itemCount > 0 && (
              <span className="ml-2 text-sm font-normal text-brand-muted">
                ({cart.itemCount} {cart.itemCount === 1 ? "Artikel" : "Artikel"})
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Warenkorb schließen"
            className="rounded-lg p-1.5 text-brand-muted hover:bg-gray-100 hover:text-brand-dark transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-200" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <p className="text-brand-muted">Ihr Warenkorb ist leer.</p>
              <button
                onClick={closeCart}
                className="rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                Weiter einkaufen
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 px-5 py-3">
              {cart.items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  {/* Produktbild */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-gray-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-brand-dark hover:text-brand-green line-clamp-2"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-brand-muted truncate">{item.variantName}</p>

                    {item.bundleTitle && (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-green">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9Z" /></svg>
                        {item.bundleTitle}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      {/* Menge */}
                      <div className="flex items-center gap-1 rounded-lg border border-gray-200 text-sm">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          aria-label="Menge verringern"
                          className="px-2 py-0.5 text-brand-muted hover:text-brand-dark"
                        >
                          −
                        </button>
                        <span className="px-1 font-medium text-brand-dark min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          aria-label="Menge erhöhen"
                          className="px-2 py-0.5 text-brand-muted hover:text-brand-dark"
                        >
                          +
                        </button>
                      </div>

                      {/* Preis */}
                      <div className="text-right">
                        {item.effectivePriceCents < item.unitPriceCents && (
                          <p className="text-xs text-brand-muted line-through">
                            {formatCartCurrency(item.unitPriceCents * item.quantity, item.currency)}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-brand-dark">
                          {formatCartCurrency(item.effectivePriceCents * item.quantity, item.currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Entfernen */}
                  <button
                    onClick={() => removeFromCart(item.key)}
                    aria-label={`${item.productName} entfernen`}
                    className="self-start text-brand-muted hover:text-red-500 transition-colors p-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Bundle-Rabatte */}
          {cart.discounts.length > 0 && (
            <div className="mx-5 mb-4 rounded-xl bg-green-50 border border-green-100 p-3 space-y-1">
              {cart.discounts.map((d) => (
                <div key={d.bundleId} className="flex items-center justify-between text-sm text-green-700">
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                    Bundle-Rabatt: {d.bundleTitle}
                  </span>
                  <span className="font-semibold">
                    − {formatCartCurrency(d.savingsCents, cart.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            {/* Summen */}
            {cart.totalSavingsCents > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-muted">Originalpreis</span>
                <span className="text-brand-muted line-through">
                  {formatCartCurrency(cart.subtotalOriginalCents, cart.currencyCode)}
                </span>
              </div>
            )}
            {cart.totalSavingsCents > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Ihre Ersparnis</span>
                <span className="font-semibold">
                  − {formatCartCurrency(cart.totalSavingsCents, cart.currencyCode)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-base font-semibold text-brand-dark">
              <span>Gesamt</span>
              <span>{formatCartCurrency(cart.subtotalCents, cart.currencyCode)}</span>
            </div>

            <p className="text-xs text-brand-muted">zzgl. MwSt. und Versand</p>

            {/* Checkout-Buttons */}
            <div className="space-y-2">
              <Link
                href="/kontakt"
                onClick={closeCart}
                className="block w-full rounded-xl bg-brand-green py-3 text-center text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                Beratung & Bestellung anfragen
              </Link>
              <button
                onClick={closeCart}
                className="block w-full rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-brand-dark hover:border-brand-green hover:text-brand-green transition-colors"
              >
                Weiter einkaufen
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
