"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import { formatFbText } from "@/utils/textFormatter";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Copy, Check } from "lucide-react";

export default function FbFormatterBox() {
  const [text, setText] = useState("");
  const [copiedText, copy] = useCopyToClipboard();

  const results = [
    { label: "Chữ In Đậm", type: "bold" },
    { label: "Chữ In Nghiêng", type: "italic" },
    { label: "Đậm + Nghiêng", type: "boldItalic" },
  ];

  return (
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-xl flex flex-col gap-6">
      
      {/* Khối nhập liệu */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-binance-gray)] mb-2">
          Văn bản cần chuyển đổi:
        </label>
        <textarea
          className="w-full h-32 rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] px-4 py-3 text-sm text-[var(--color-binance-light)] placeholder:text-[var(--color-binance-border)] focus:outline-none focus:border focus:border-[var(--color-binance-yellow)] transition-colors resize-none"
          placeholder="Nhập nội dung quảng cáo Facebook của bạn vào đây (Lưu ý: Tiếng Việt có dấu sẽ được giữ nguyên)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* Khối kết quả */}
      <div className="grid grid-cols-1 gap-4">
        {results.map((item) => {
          const formatted = formatFbText(text, item.type);
          const isCopied = copiedText === formatted && formatted !== "";

          return (
            <div key={item.type} className="bg-[var(--color-binance-darker)] p-4 rounded-sm border border-[var(--color-binance-border)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-[var(--color-binance-yellow)]">{item.label}</span>
                <button
                  onClick={() => copy(formatted)}
                  disabled={!formatted}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCopied ? <Check size={14} className="text-[var(--color-binance-success)]" /> : <Copy size={14} />}
                  {isCopied ? "Đã copy!" : "Copy"}
                </button>
              </div>
              <div className="text-sm text-[var(--color-binance-light)] min-h-[20px] whitespace-pre-wrap break-words">
                {formatted || <span className="text-[var(--color-binance-border)] italic">Kết quả sẽ hiển thị ở đây...</span>}
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
