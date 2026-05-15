"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { CartStore, computeCart } from "@/lib/cart";
import type { Cart, AddToCartOptions } from "@/lib/cart";

interface CartContextValue {
  cart: Cart;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (options: AddToCartOptions) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => computeCart([]));
  const [isOpen, setIsOpen] = useState(false);

  // Warenkorb aus localStorage laden und auf Updates hören
  useEffect(() => {
    setCart(CartStore.getCart());
    const unsubscribe = CartStore.onUpdate(() => {
      setCart(CartStore.getCart());
    });
    return unsubscribe;
  }, []);

  const addToCart = useCallback((options: AddToCartOptions) => {
    CartStore.add(options);
    setIsOpen(true); // Warenkorb-Sidebar öffnen nach Hinzufügen
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    CartStore.updateQuantity(key, quantity);
  }, []);

  const removeFromCart = useCallback((key: string) => {
    CartStore.remove(key);
  }, []);

  const clearCart = useCallback(() => {
    CartStore.clear();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart muss innerhalb von CartProvider verwendet werden.");
  return ctx;
}
