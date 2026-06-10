"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import {
  History, Search, RefreshCw, Download, Plus, Copy, Check,
  Calendar, Filter, ChevronLeft, ChevronRight, Phone, Coins,
  CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

const ITEMS_PER_PAGE = 15;

const todayStr = () => new Date().toISOString().split("T")[0];
const pastStr = (days = 30) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
};

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n ?? 0);

export default function OtpHistoryBox({ hideHeader = false, onRentAgain }) {
  const { user } = useAuthStore();
  const supabase = createClient();

  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(pastStr);
  const [toDate, setToDate] = useState(todayStr);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("-1");
  const [localSearch, setLocalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedText, copy] = useCopyToClipboard();

  const fetchHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const from = new Date(fromDate + "T00:00:00+07:00").toISOString();
      const to   = new Date(toDate   + "T23:59:59+07:00").toISOString();

      let query = supabase
        .from("otp_rentals")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(500);

      if (statusFilter !== "-1") query = query.eq("status", Number(statusFilter));

      const { data, error } = await query;
      if (error) throw error;
      setHistoryList(data || []);
    } catch (err) {
      toast.error("Lỗi tải lịch sử: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, fromDate, toDate, statusFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Lọc local
  const filtered = useMemo(() => {
    let r = historyList;
    if (phoneFilter.trim()) r = r.filter(i => i.phone_number?.includes(phoneFilter.trim()));
    if (serviceFilter.trim()) r = r.filter(i => i.service_name?.toLowerCase().includes(serviceFilter.toLowerCase().trim()));
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      r = r.filter(i =>
        i.phone_number?.includes(q) ||
        i.service_name?.toLowerCase().includes(q) ||
        i.code?.toLowerCase().includes(q) ||
        i.sms_content?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [historyList, phoneFilter, serviceFilter, localSearch]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const safePage   = Math.min(currentPage, Math.max(1, totalPages));
  const pageItems  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleExportCSV = () => {
    if (filtered.length === 0) { toast.error("Không có dữ liệu để xuất!"); return; }
    const headers = ["Dịch vụ", "Số điện thoại", "Coin", "Mã OTP", "Thời gian thuê", "Hoàn thành lúc", "Trạng thái", "Nội dung tin nhắn"];
    const rows = filtered.map(i => [
      i.service_name, i.phone_number, i.coin_cost, i.code || "",
      new Date(i.created_at).toLocaleString("vi-VN"),
      i.completed_at ? new Date(i.completed_at).toLocaleString("vi-VN") : "",
      i.status === 1 ? "Thành công" : i.status === 2 ? "Hết hạn" : "Đang chờ",
      (i.sms_content || "").replace(/"/g, '""'),
    ]);
    const csv = "﻿" + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: `lich_su_otp_${todayStr()}.csv`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Xuất CSV thành công!");
  };

  const StatusBadge = ({ status }) => {
    if (status === 1) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        <CheckCircle2 size={9} /> Thành công
      </span>
    );
    if (status === 2) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
        <XCircle size={9} /> Hết hạn
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">
        <Clock size={9} /> Đang chờ
      </span>
    );
  };

  if (!user) return (
    <div className="py-24 text-center text-[var(--color-binance-gray)]">
      <History size={36} className="mx-auto mb-3 opacity-30" />
      <p>Vui lòng đăng nhập để xem lịch sử thuê số.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full text-[var(--color-binance-light)]">

      {/* HEADER */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[var(--color-binance-yellow)] rounded-sm" />
            <h1 className="text-xl sm:text-2xl font-bold">Lịch sử thuê số</h1>
          </div>
          <Link href="/thue-otp">
            <Button className="flex items-center gap-2 text-xs font-semibold px-4 py-2">
              <Plus size={15} /> THUÊ SỐ MỚI
            </Button>
          </Link>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Calendar size={12} /> Từ ngày</label>
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-10 text-xs" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Calendar size={12} /> Đến ngày</label>
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-10 text-xs" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Phone size={12} /> Số điện thoại</label>
          <Input placeholder="Lọc theo số..." value={phoneFilter} onChange={e => { setPhoneFilter(e.target.value); setCurrentPage(1); }} className="h-10 text-xs" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Filter size={12} /> Dịch vụ</label>
          <Input placeholder="Gmail, Telegram..." value={serviceFilter} onChange={e => { setServiceFilter(e.target.value); setCurrentPage(1); }} className="h-10 text-xs" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Filter size={12} /> Trạng thái</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex h-10 w-full rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-dark)] px-3 text-xs text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] transition-colors"
          >
            <option value="-1">Tất cả</option>
            <option value="0">Đang chờ OTP</option>
            <option value="1">Thành công</option>
            <option value="2">Hết hạn</option>
          </select>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <Button onClick={fetchHistory} disabled={loading} className="flex-1 h-10 flex items-center justify-center gap-2 text-xs">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />} Tìm
          </Button>
          <Button onClick={handleExportCSV} className="h-10 w-12 bg-[var(--color-binance-success)] hover:opacity-90 text-white flex items-center justify-center" title="Xuất CSV">
            <Download size={14} />
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg shadow-lg flex flex-col gap-4 overflow-hidden">

        {/* Table header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-3 sm:px-6 pt-5 pb-4 border-b border-[var(--color-binance-border)]">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <History size={16} className="text-[var(--color-binance-yellow)]" /> Kết quả
            </h2>
            <p className="text-[var(--color-binance-gray)] text-xs mt-0.5">
              {filtered.length} giao dịch {loading && <span className="text-yellow-400 inline-flex items-center gap-1"><RefreshCw size={9} className="animate-spin" /> đang tải...</span>}
            </p>
          </div>
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-binance-gray)]" />
            <Input placeholder="Tìm nhanh..." value={localSearch} onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
          </div>
        </div>

        <div className="overflow-x-auto px-3 sm:px-6 pb-6">
          {loading && historyList.length === 0 ? (
            <div className="py-20 text-center text-[var(--color-binance-gray)] flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-[var(--color-binance-yellow)]" />
              <span className="text-sm">Đang tải lịch sử...</span>
            </div>
          ) : pageItems.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-binance-border)] text-[var(--color-binance-gray)] uppercase text-[10px] tracking-wide font-semibold">
                  <th className="py-3 px-3">Dịch Vụ</th>
                  <th className="py-3 px-3">Số Điện Thoại</th>
                  <th className="py-3 px-3 min-w-[80px]">Coin</th>
                  <th className="py-3 px-3 min-w-[96px]">Mã OTP</th>
                  <th className="py-3 px-3">Thời Gian</th>
                  <th className="py-3 px-3 min-w-[96px]">Trạng Thái</th>
                  <th className="py-3 px-3">Tin Nhắn</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-binance-border)]/30">
                {pageItems.map((item) => {
                  const isPhoneCopied = copiedText === item.phone_number;
                  const isCodeCopied  = copiedText === item.code;
                  return (
                    <tr key={item.id} className="hover:bg-[var(--color-binance-border)]/10 transition-colors">
                      <td className="py-3 px-3 font-semibold">{item.service_name}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold">{item.phone_number}</span>
                          <button onClick={() => copy(item.phone_number)} className="p-1 text-[var(--color-binance-gray)] hover:text-white transition-colors">
                            {isPhoneCopied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-[var(--color-binance-yellow)] font-mono">
                          <Coins size={11} /> {fmt(item.coin_cost)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {item.code ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-mono font-bold border border-green-500/20">
                              {item.code}
                            </span>
                            <button onClick={() => copy(item.code)} className="p-1 text-[var(--color-binance-gray)] hover:text-white transition-colors">
                              {isCodeCopied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                            </button>
                          </div>
                        ) : <span className="text-[var(--color-binance-gray)] italic">—</span>}
                      </td>
                      <td className="py-3 px-3 text-[var(--color-binance-gray)] whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-3 text-[var(--color-binance-gray)] max-w-xs truncate" title={item.sms_content}>
                        {item.sms_content || <span className="italic opacity-40">Chưa có</span>}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {onRentAgain ? (
                          <button
                            onClick={() => onRentAgain({
                              phone_number: item.phone_number,
                              service_id: item.service_id,
                              service_name: item.service_name,
                              countryISO: item.country || "VN",
                              price: (item.coin_cost ?? 0) / 2
                            })}
                            title="Thuê lại số này"
                            className="p-1.5 rounded text-[var(--color-binance-gray)] hover:text-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/10 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold border border-transparent hover:border-[var(--color-binance-yellow)]/20"
                          >
                            <RefreshCw size={11} /> Thuê lại
                          </button>
                        ) : (
                          <Link
                            href={`/thue-otp?re_phone_number=${item.phone_number}&service_id=${item.service_id}`}
                            className="p-1.5 rounded text-[var(--color-binance-gray)] hover:text-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/10 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold border border-transparent hover:border-[var(--color-binance-yellow)]/20"
                          >
                            <RefreshCw size={11} /> Thuê lại
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center text-[var(--color-binance-gray)] flex flex-col items-center gap-2">
              <History size={32} className="opacity-20 mb-1" />
              <span className="text-sm">Không có lịch sử trong khoảng thời gian này.</span>
              <span className="text-xs opacity-60">Thử mở rộng khoảng ngày hoặc thuê số để bắt đầu.</span>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-binance-border)] px-3 sm:px-6 py-3 text-xs text-[var(--color-binance-gray)]">
            <span>
              Hiển thị <b className="text-white">{(safePage - 1) * ITEMS_PER_PAGE + 1}</b>–<b className="text-white">{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}</b> / <b className="text-white">{filtered.length}</b>
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={safePage === 1}
                className="p-1.5 rounded border border-[var(--color-binance-border)] hover:bg-[var(--color-binance-darker)] disabled:opacity-30">
                <ChevronLeft size={13} />
              </button>
              <span>Trang <b className="text-white">{safePage}</b> / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={safePage === totalPages}
                className="p-1.5 rounded border border-[var(--color-binance-border)] hover:bg-[var(--color-binance-darker)] disabled:opacity-30">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
