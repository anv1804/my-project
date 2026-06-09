"use client";

import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

export function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        className: 'border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] text-[var(--color-binance-light)] shadow-lg',
        style: {
          background: 'var(--color-binance-darker)',
          color: 'var(--color-binance-light)',
          border: '1px solid var(--color-binance-border)',
        },
      }}
    />
  );
}
