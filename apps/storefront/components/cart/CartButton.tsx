"use client";

import { useCart } from "@/contexts/CartContext";

export function CartButton() {
  const { cart, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      aria-label={`Warenkorb öffnen, ${cart.itemCount} Artikel`}
      className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-brand-dark hover:border-brand-green hover:text-brand-green transition-colors"
    >
      {/* Cart Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>

      {cart.itemCount > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-green px-1 text-xs font-bold text-white">
          {cart.itemCount > 99 ? "99+" : cart.itemCount}
        </span>
      )}
    </button>
  );
}
