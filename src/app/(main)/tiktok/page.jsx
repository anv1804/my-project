"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, Play } from "lucide-react";
import { MENU_GROUPS, TiktokIcon } from "@/config/menu";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/useAuthStore";

export default function TiktokDashboardPage() {
  const { openLoginModal } = useAuthStore();
  const tiktokGroup = MENU_GROUPS.find(g => g.id === "tiktok");
  const tools = tiktokGroup.items;
  
  // Mặc định chọn tool đầu tiên
  const [activeTab, setActiveTab] = useState(tools[0].id);
  const activeTool = tools.find(t => t.id === activeTab);

  const steps = [
    { title: "Tải Video", desc: "Không logo", id: "downloader" },
    { title: "Đổi MD5", desc: "Lách bản quyền", id: "md5" },
    { title: "Tạo Tiêu Đề", desc: "Bắt trend", id: "title" },
    { title: "Hashtag", desc: "Tối ưu SEO", id: "hashtag" },
    { title: "Báo Cáo", desc: "Lưu lịch sử", id: "report" }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-8 pb-4 border-b border-[var(--color-binance-border)]">
        <TiktokIcon size={24} className="text-[var(--color-binance-yellow)]" />
        <h1 className="text-xl sm:text-3xl font-bold text-[var(--color-binance-light)]">Tổng Quan Công Cụ TikTok</h1>
      </div>

      {/* Workflow Section */}
      <section className="mb-8 sm:mb-12">
        <h2 className="text-base sm:text-xl font-bold text-[var(--color-binance-light)] mb-4 sm:mb-6 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-[var(--color-binance-yellow)]" />
          Luồng Thao Tác Chuẩn (Reup Workflow)
        </h2>

        <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-2xl p-4 sm:p-10 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-32 bg-[var(--color-binance-yellow)]/5 blur-[80px] pointer-events-none"></div>
          
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            {/* Connecting Line for desktop */}
            <div className="hidden sm:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-[var(--color-binance-border)] z-0"></div>
            
            {steps.map((step) => {
              const toolConfig = tools.find(t => t.id === step.id);
              const Icon = toolConfig ? toolConfig.icon : Play;
              const isActive = activeTab === step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className="relative z-10 flex flex-col items-center group w-full sm:w-1/5 focus:outline-none"
                >
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 transition-all duration-300 relative",
                    isActive 
                      ? "bg-gradient-to-br from-[var(--color-binance-yellow)] to-yellow-500 text-black shadow-[0_0_20px_rgba(240,185,11,0.4)] scale-110" 
                      : "bg-[var(--color-binance-dark)] text-[var(--color-binance-gray)] border border-[var(--color-binance-border)] group-hover:border-[var(--color-binance-yellow)]/50 group-hover:text-[var(--color-binance-yellow)]"
                  )}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl border border-[var(--color-binance-yellow)] animate-ping opacity-20"></div>
                    )}
                  </div>
                  <div className={cn(
                    "font-bold transition-colors whitespace-nowrap text-xs sm:text-[15px]",
                    isActive ? "text-[var(--color-binance-yellow)]" : "text-[var(--color-binance-light)] group-hover:text-[var(--color-binance-yellow)]/80"
                  )}>
                    {step.title}
                  </div>
                  <div className="text-xs text-[var(--color-binance-gray)] mt-1.5 whitespace-nowrap opacity-80">
                    {step.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Tool Panel */}
      <section>
        <h2 className="text-base sm:text-xl font-bold text-[var(--color-binance-light)] mb-4 sm:mb-6 flex items-center gap-2">
          <Play size={18} className="text-[var(--color-binance-yellow)]" />
          Chi Tiết Tính Năng
        </h2>

        {/* Tab Header */}
        <div className="flex overflow-x-auto pb-2 gap-2 mb-6 scrollbar-hide">
          {tools.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 border",
                  isActive 
                    ? "bg-[var(--color-binance-yellow)] text-black border-[var(--color-binance-yellow)]" 
                    : "bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)] border-[var(--color-binance-border)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50"
                )}
              >
                <Icon size={16} />
                {tool.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTool && (
          <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-yellow)]/30 rounded-xl p-6 sm:p-8 shadow-[0_0_20px_rgba(240,185,11,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-binance-yellow)]/20 text-[var(--color-binance-yellow)] flex items-center justify-center flex-shrink-0">
                <activeTool.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-[var(--color-binance-yellow)] mb-1">
                  {activeTool.label}
                </h3>
                <p className="text-[var(--color-binance-light)] text-sm">
                  {activeTool.desc}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--color-binance-dark)] p-5 rounded-lg border border-[var(--color-binance-border)]">
                <h4 className="font-bold text-[var(--color-binance-light)] mb-2 uppercase text-xs tracking-wider text-[var(--color-binance-gray)]">Công cụ này là gì?</h4>
                <p className="text-[var(--color-binance-gray)] leading-relaxed">
                  {activeTool.details?.what}
                </p>
              </div>

              <div className="bg-[var(--color-binance-dark)] p-5 rounded-lg border border-[var(--color-binance-border)]">
                <h4 className="font-bold text-[var(--color-binance-light)] mb-2 uppercase text-xs tracking-wider text-[var(--color-binance-gray)]">Cách thức hoạt động</h4>
                <p className="text-[var(--color-binance-gray)] leading-relaxed">
                  {activeTool.details?.how}
                </p>
              </div>

              <div className="bg-[var(--color-binance-dark)] p-5 rounded-lg border border-[var(--color-binance-border)]">
                <h4 className="font-bold text-[var(--color-binance-light)] mb-2 uppercase text-xs tracking-wider text-[var(--color-binance-gray)]">Hướng dẫn nhanh</h4>
                <p className="text-[var(--color-binance-gray)] leading-relaxed">
                  {activeTool.details?.guide}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 flex justify-end">
              {activeTool.type === "link" ? (
                <Link 
                  href={activeTool.href}
                  className="inline-flex items-center gap-2 bg-[var(--color-binance-yellow)] text-black font-bold px-6 py-3 rounded-lg hover:bg-[var(--color-binance-yellow-hover)] transition-all hover:scale-105 shadow-[0_4px_14px_rgba(240,185,11,0.3)]"
                >
                  Trải nghiệm ngay <ArrowRight size={18} />
                </Link>
              ) : (
                <button 
                  onClick={() => openLoginModal("Tính năng xem Lịch sử tạo yêu cầu đăng nhập tài khoản Pro!")}
                  className="inline-flex items-center gap-2 bg-[var(--color-binance-yellow)] text-black font-bold px-6 py-3 rounded-lg hover:bg-[var(--color-binance-yellow-hover)] transition-all hover:scale-105 shadow-[0_4px_14px_rgba(240,185,11,0.3)]"
                >
                  Yêu cầu đăng nhập <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
