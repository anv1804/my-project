"use client";

import { useEffect } from "react";
import { X, Coins } from "lucide-react";
import { useLayoutStore } from "@/store/useLayoutStore";
import NapCoinBox from "./NapCoinBox";

export default function CoinTopupModal() {
  const { isCoinModalOpen, closeCoinModal } = useLayoutStore();

  // Close on Escape
  useEffect(() => {
    if (!isCoinModalOpen) return;
    const handler = (e) => { if (e.key === "Escape") closeCoinModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isCoinModalOpen, closeCoinModal]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isCoinModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCoinModalOpen]);

  if (!isCoinModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeCoinModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-binance-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <Coins size={20} className="text-[var(--color-binance-yellow)]" />
            <div>
              <h2 className="text-base font-bold text-[var(--color-binance-light)]">Nạp Coin</h2>
              <p className="text-xs text-[var(--color-binance-gray)]">
                Quét VietQR · Xác nhận tự động 1–5 phút
              </p>
            </div>
          </div>
          <button
            onClick={closeCoinModal}
            className="p-1.5 rounded-md text-[var(--color-binance-gray)] hover:text-white hover:bg-[var(--color-binance-border)]/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6">
          <NapCoinBox onSuccess={closeCoinModal} />
        </div>
      </div>
    </div>
  );
}
