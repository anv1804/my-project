"use client";
import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Crown, Flame, Eye, Video, Copy, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

// GIẢ LẬP DỮ LIỆU (Mock Data)
const generateData = (multiplier) => [
  { rank: 1, tag: "xuhuong", views: (24.5 * multiplier).toFixed(1) + "B", trend: "up", posts: (12 * multiplier).toFixed(1) + "M" },
  { rank: 2, tag: "fyp", views: (18.2 * multiplier).toFixed(1) + "B", trend: "up", posts: (9 * multiplier).toFixed(1) + "M" },
  { rank: 3, tag: "tiktok", views: (15.1 * multiplier).toFixed(1) + "B", trend: "down", posts: (7 * multiplier).toFixed(1) + "M" },
  { rank: 4, tag: "viral", views: (12.4 * multiplier).toFixed(1) + "B", trend: "up", posts: (5 * multiplier).toFixed(1) + "M" },
  { rank: 5, tag: "foryou", views: (10.2 * multiplier).toFixed(1) + "B", trend: "up", posts: (4.5 * multiplier).toFixed(1) + "M" },
  { rank: 6, tag: "trending", views: (8.9 * multiplier).toFixed(1) + "B", trend: "down", posts: (3.2 * multiplier).toFixed(1) + "M" },
  { rank: 7, tag: "funny", views: (6.5 * multiplier).toFixed(1) + "B", trend: "up", posts: (2.1 * multiplier).toFixed(1) + "M" },
  { rank: 8, tag: "dance", views: (5.1 * multiplier).toFixed(1) + "B", trend: "down", posts: (1.8 * multiplier).toFixed(1) + "M" },
  { rank: 9, tag: "music", views: (4.8 * multiplier).toFixed(1) + "B", trend: "up", posts: (1.5 * multiplier).toFixed(1) + "M" },
  { rank: 10, tag: "duet", views: (3.2 * multiplier).toFixed(1) + "B", trend: "up", posts: "900K" },
];

const DATA = {
  day: generateData(1),
  week: generateData(7.5),
  month: generateData(30),
};

export default function TrendingHashtags() {
  const [timeframe, setTimeframe] = useState("day");
  const [copiedId, setCopiedId] = useState(null);
  const currentData = DATA[timeframe];
  
  // Sắp xếp lại để cho lên bục: Vị trí 2 - 1 - 3
  const top3 = [currentData[1], currentData[0], currentData[2]]; 
  const rest = currentData.slice(3);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl p-4 sm:p-6 shadow-xl transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-[var(--color-binance-yellow)]/5 blur-[80px] pointer-events-none rounded-full"></div>

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 relative z-10">
        <h2 className="text-lg font-bold text-[var(--color-binance-light)] flex items-center gap-2">
          <Flame className="text-[var(--color-binance-error)]" size={20} />
          Bảng Xếp Hạng Hashtag
        </h2>
        <div className="flex bg-[var(--color-binance-darker)] p-1 rounded-lg border border-[var(--color-binance-border)]">
          {[
            { id: "day", label: "24h qua" },
            { id: "week", label: "Tuần này" },
            { id: "month", label: "Tháng này" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id)}
              className={cn(
                "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                timeframe === tab.id 
                  ? "bg-[var(--color-binance-dark)] text-[var(--color-binance-yellow)] shadow-sm"
                  : "text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Podium (Top 3) */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-10 h-48 sm:h-56 relative z-10">
        {top3.map((item, index) => {
          const isFirst = index === 1; // Center is 1st
          const isSecond = index === 0;
          const isThird = index === 2;
          
          return (
            <div key={item.rank} className="flex flex-col items-center relative w-1/3 max-w-[140px] animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Crown */}
              <div className={cn("absolute z-20 flex flex-col items-center", isFirst ? "-top-14" : "-top-10")}>
                <Crown 
                  size={isFirst ? 36 : 24} 
                  className={
                    isFirst ? "text-[#FCD535] fill-[#F0B90B] drop-shadow-[0_0_10px_rgba(240,185,11,0.5)]" : 
                    isSecond ? "text-[#EAECEF] fill-[#848E9C]" : 
                    "text-[#F0B90B] fill-[#CD7F32] opacity-80"
                  } 
                />
              </div>
              
              {/* Info above bar - Căn giữa tuyệt đối bằng thẻ relative */}
              <div className="text-center mb-2 z-10 w-full group/item flex flex-col items-center">
                <button 
                  onClick={() => handleCopy(`#${item.tag}`, item.rank)}
                  title="Sao chép Hashtag"
                  className={cn(
                    "font-bold truncate px-1 flex items-center justify-center transition-colors focus:outline-none cursor-copy", 
                    isFirst ? "text-[var(--color-binance-yellow)] hover:text-[#FCD535] text-sm sm:text-base" : "text-[var(--color-binance-light)] hover:text-white text-xs sm:text-sm"
                  )}
                >
                  <span className="relative inline-flex items-center">
                    #{item.tag}
                    <span className="absolute -right-5 flex items-center">
                      {copiedId === item.rank ? (
                        <Check size={14} className="text-[var(--color-binance-success)] flex-shrink-0" />
                      ) : (
                        <Copy size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                    </span>
                  </span>
                </button>
                <p className="text-[10px] sm:text-xs text-[var(--color-binance-gray)] flex items-center justify-center gap-1 mt-0.5 pointer-events-none">
                  <Eye size={12} /> {item.views}
                </p>
              </div>
              
              {/* Bar */}
              <div className={cn(
                "w-full rounded-t-lg bg-gradient-to-t relative overflow-hidden flex justify-center items-end pb-2 transition-all duration-500 hover:brightness-125",
                isFirst ? "h-32 sm:h-40 from-[var(--color-binance-yellow)]/10 to-[var(--color-binance-yellow)]/40 border-t-2 border-[var(--color-binance-yellow)]" : 
                isSecond ? "h-24 sm:h-32 from-[#848E9C]/10 to-[#848E9C]/30 border-t-2 border-[#848E9C]" : 
                "h-20 sm:h-28 from-[#CD7F32]/10 to-[#CD7F32]/30 border-t-2 border-[#CD7F32]"
              )}>
                <span className={cn(
                  "font-black text-4xl sm:text-5xl opacity-20",
                  isFirst ? "text-[var(--color-binance-yellow)]" : 
                  isSecond ? "text-[#EAECEF]" : "text-[#CD7F32]"
                )}>
                  {item.rank}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* List (4-10) */}
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="text-[11px] uppercase text-[var(--color-binance-gray)] border-b border-[var(--color-binance-border)]">
            <tr>
              <th className="pb-3 px-2 font-medium w-12 text-center">Hạng</th>
              <th className="pb-3 px-2 font-medium">Hashtag</th>
              <th className="pb-3 px-2 font-medium text-right">Lượt xem</th>
              <th className="pb-3 px-2 font-medium text-right">Bài đăng</th>
              <th className="pb-3 px-2 font-medium text-center">Xu hướng</th>
            </tr>
          </thead>
          <tbody className="animate-in fade-in duration-500">
            {rest.map((item) => (
              <tr key={item.rank} className="border-b border-[var(--color-binance-border)] hover:bg-[var(--color-binance-darker)] transition-colors group">
                <td className="py-3 px-2 text-center font-bold text-[var(--color-binance-gray)]">{item.rank}</td>
                <td className="py-3 px-2 font-medium text-[var(--color-binance-light)]">
                  <button 
                    onClick={() => handleCopy(`#${item.tag}`, item.rank)}
                    className="flex items-center gap-2 group/copy w-fit transition-colors hover:text-[var(--color-binance-yellow)] focus:outline-none cursor-copy"
                    title="Sao chép"
                  >
                    <span>#{item.tag}</span>
                    <span className="p-1 rounded-md hover:bg-[var(--color-binance-border)] opacity-0 group-hover/copy:opacity-100 transition-all text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)]">
                       {copiedId === item.rank ? <Check size={14} className="text-[var(--color-binance-success)]" /> : <Copy size={14} />}
                    </span>
                  </button>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="flex items-center justify-end gap-1.5 text-[var(--color-binance-light)] font-medium">
                    <Eye size={14} className="text-[var(--color-binance-gray)]" />
                    {item.views}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="flex items-center justify-end gap-1.5 text-[var(--color-binance-gray)]">
                    <Video size={14} />
                    {item.posts}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex justify-center">
                    {item.trend === "up" ? (
                      <ArrowUpRight size={18} className="text-[var(--color-binance-success)]" />
                    ) : (
                      <ArrowDownRight size={18} className="text-[var(--color-binance-error)]" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
