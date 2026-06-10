"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/utils/cn";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Menu Options */}
      <div className={cn(
        "flex flex-col gap-3 transition-all duration-300 origin-bottom",
        isOpen ? "scale-100 opacity-100 mb-2 translate-y-0" : "scale-50 opacity-0 h-0 translate-y-10 pointer-events-none"
      )}>
        {/* Nút Zalo */}
        <a 
          href="https://zalo.me/0397503905" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] p-2 pr-5 rounded-full shadow-lg hover:border-[#0068FF] hover:bg-[#0068FF]/5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[#0068FF] flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <span className="font-bold text-[13px] tracking-wide">Zalo</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-[var(--color-binance-gray)] font-semibold leading-tight">Chat qua Zalo</span>
            <span className="font-bold text-[var(--color-binance-light)] text-sm group-hover:text-[#0068FF] transition-colors leading-tight mt-0.5">0397.503.905</span>
          </div>
        </a>
        
        {/* Nút Telegram */}
        <a 
          href="https://t.me/anv184" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] p-2 pr-5 rounded-full shadow-lg hover:border-[#229ED9] hover:bg-[#229ED9]/5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Send size={18} className="ml-[-2px] mt-[2px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-[var(--color-binance-gray)] font-semibold leading-tight">Chat Telegram</span>
            <span className="font-bold text-[var(--color-binance-light)] text-sm group-hover:text-[#229ED9] transition-colors leading-tight mt-0.5">@anv184</span>
          </div>
        </a>
      </div>

      {/* Main Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-[var(--color-binance-yellow)] to-[#FCD535] rounded-full shadow-[0_0_15px_rgba(240,185,11,0.4)] flex items-center justify-center text-black hover:scale-110 transition-transform cursor-pointer relative group"
      >
        <X size={24} className={cn("absolute transition-all duration-300", isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")} />
        <MessageCircle size={26} className={cn("absolute transition-all duration-300", isOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} />
        
        {/* Nút X nhỏ để ẩn toàn bộ widget khi hover */}
        <div 
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
          title="Ẩn nút hỗ trợ"
        >
          <X size={12} />
        </div>
      </button>
    </div>
  );
}
