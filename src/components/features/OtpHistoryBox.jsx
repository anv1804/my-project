"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import {
  History, Search, RefreshCw, Download, Plus, Copy, Check,
  ExternalLink, Calendar, Filter, CreditCard, ChevronLeft,
  ChevronRight, Phone
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useEffect } from "react";

const CACHE_KEY = "otp_history_cache";
const LIMIT = 100;
const ITEMS_PER_PAGE = 15;

// Pure helpers — không phụ thuộc component state
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw).data ?? []) : [];
  } catch {
    return [];
  }
}
const todayStr = () => new Date().toISOString().split("T")[0];
const pastStr = (days = 7) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
};

export default function OtpHistoryBox() {
  // Lazy initializer — không cần useEffect để set state ban đầu
  const [token] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("otp_api_token") || "aa372c99e679425689e979538a5c10a3")
      : ""
  );
  const [fromDate, setFromDate] = useState(pastStr);
  const [toDate, setToDate] = useState(todayStr);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("-1");
  const [statusFilter, setStatusFilter] = useState("-1");
  const [localSearch, setLocalSearch] = useState("");
  const [services, setServices] = useState([]);
  // Khôi phục cache ngay lập tức khi render
  const [historyList, setHistoryList] = useState(() =>
    typeof window !== "undefined" ? readCache() : []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedText, copy] = useCopyToClipboard();

  // Derived — dùng useMemo thay vì useEffect + setState
  const filteredHistory = useMemo(() => {
    let result = historyList;
    if (phoneFilter.trim()) {
      const q = phoneFilter.trim();
      result = result.filter(item => (item.PhoneOriginal || item.Phone || "").includes(q));
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      result = result.filter(item =>
        String(item.ID).includes(q) ||
        (item.ServiceName || "").toLowerCase().includes(q) ||
        (item.SmsContent || "").toLowerCase().includes(q) ||
        (item.Code || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [historyList, phoneFilter, localSearch]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const indexOfFirst = (safePage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredHistory.slice(indexOfFirst, indexOfFirst + ITEMS_PER_PAGE);

  // Fetch lịch sử — reuse cho cả init và submit
  const fetchHistoryData = useCallback(async (tk, fDate, tDate, svc, status, lim) => {
    if (!tk) { toast.error("Vui lòng kết nối API Token trước!"); return; }
    setLoadingHistory(true);
    const path = `session/historyv2?token=${tk}&service=${svc}&status=${status}&limit=${lim}&fromDate=${fDate}&toDate=${tDate}`;
    try {
      const res = await fetch(`/api/otp?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Không thể kết nối máy chủ");
      const data = await res.json();
      if (data.status_code === 200 && data.success) {
        const list = data.data || [];
        setHistoryList(list);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, savedAt: new Date().toISOString() }));
        toast.success(`Đã tải ${list.length} dòng lịch sử!`);
      } else {
        toast.error(data.message || "Lỗi khi lấy lịch sử thuê số");
      }
    } catch (err) {
      toast.error("Lỗi kết nối API: " + err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Init: dùng IIFE async bên trong effect — tránh call trực tiếp hàm có setState
  useEffect(() => {
    const controller = new AbortController();
    const sig = controller.signal;
    const tk = localStorage.getItem("otp_api_token") || "aa372c99e679425689e979538a5c10a3";
    const fDate = pastStr();
    const tDate = todayStr();

    (async () => {
      // Load danh sách dịch vụ
      try {
        const res = await fetch(`/api/otp?path=service/getv2&token=${tk}&country=vn`, { signal: sig });
        const data = await res.json();
        if (!sig.aborted && data.status_code === 200 && data.success) {
          setServices(data.data.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch { /* fetch bị huỷ hoặc lỗi mạng */ }

      // Load lịch sử
      if (!sig.aborted) {
        setLoadingHistory(true);
        try {
          const path = `session/historyv2?token=${tk}&service=-1&status=-1&limit=${LIMIT}&fromDate=${fDate}&toDate=${tDate}`;
          const res = await fetch(`/api/otp?path=${encodeURIComponent(path)}`, { signal: sig });
          const data = await res.json();
          if (!sig.aborted) {
            if (data.status_code === 200 && data.success) {
              const list = data.data || [];
              setHistoryList(list);
              localStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, savedAt: new Date().toISOString() }));
              toast.success(`Đã tải ${list.length} dòng lịch sử!`);
            } else {
              toast.error(data.message || "Lỗi khi lấy lịch sử thuê số");
            }
          }
        } catch (err) {
          if (!sig.aborted) toast.error("Lỗi kết nối API: " + err.message);
        } finally {
          if (!sig.aborted) setLoadingHistory(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchHistoryData(token, fromDate, toDate, serviceFilter, statusFilter, LIMIT);
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) { toast.error("Không có dữ liệu để xuất file!"); return; }
    const headers = ["ID", "Dịch vụ", "Giá (VND)", "Số điện thoại", "Mã OTP", "Thời gian", "Trạng thái", "Nội dung tin nhắn"];
    const rows = filteredHistory.map(item => [
      item.ID, item.ServiceName, item.Price,
      item.PhoneOriginal || item.Phone, item.Code || "", item.CreatedTime,
      item.Status === 1 ? "Hoàn thành" : item.Status === 2 ? "Hết hạn" : "Đang chờ",
      (item.SmsContent || "").replace(/"/g, '""'),
    ]);
    const csv = "﻿" + [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `lich_su_otp_${todayStr()}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Xuất file CSV thành công!");
  };

  const formatVnd = (num) =>
    num == null ? "0đ" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

  const selectClass = "flex h-10 w-full rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-dark)] px-3 py-2 text-xs text-[var(--color-binance-light)] focus:outline-none focus:border focus:border-[var(--color-binance-yellow)] transition-colors";

  return (
    <div className="flex flex-col gap-6 w-full text-[var(--color-binance-light)]">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-[var(--color-binance-yellow)] rounded-sm" />
          <h1 className="text-2xl font-bold">Lịch sử thuê số</h1>
        </div>
        <a href="https://viotp.com/admin/recharge" target="_blank" rel="noreferrer" className="inline-flex">
          <Button className="flex items-center gap-2 text-xs font-semibold px-4 py-2">
            <CreditCard size={15} /> NẠP TIỀN
          </Button>
        </a>
      </div>

      {/* FILTER BAR */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
      >
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Calendar size={13} /> Từ ngày</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 text-xs" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Calendar size={13} /> Đến ngày</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 text-xs" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Phone size={13} /> Số điện thoại</label>
          <Input type="text" placeholder="Nhập số điện thoại" value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value); setCurrentPage(1); }} className="h-10 text-xs" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Filter size={13} /> Dịch vụ</label>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={selectClass}>
            <option value="-1">Tất cả</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatVnd(s.price)})</option>)}
          </select>
        </div>
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-binance-gray)] font-medium flex items-center gap-1"><Filter size={13} /> Trạng thái</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="-1">Tất cả</option>
            <option value="0">Đang chờ OTP</option>
            <option value="1">Hoàn thành</option>
            <option value="2">Hết hạn</option>
          </select>
        </div>
        <div className="md:col-span-2 flex gap-2 w-full">
          <Button type="submit" disabled={loadingHistory} className="flex-1 h-10 flex items-center justify-center gap-2 text-xs">
            {loadingHistory ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />} Tìm
          </Button>
          <Button type="button" onClick={handleExportCSV}
            className="h-10 w-12 bg-[var(--color-binance-success)] hover:bg-[var(--color-binance-success)]/80 text-white flex items-center justify-center"
            title="Xuất file báo cáo Excel (CSV)">
            <Download size={15} />
          </Button>
        </div>
      </form>

      {/* TABLE */}
      <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-lg flex flex-col gap-4">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-binance-border)] pb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History size={18} className="text-[var(--color-binance-yellow)]" /> Lịch sử thuê số
            </h2>
            <p className="text-[var(--color-binance-gray)] text-xs mt-0.5 flex items-center gap-2">
              {filteredHistory.length} giao dịch
              {loadingHistory && <span className="inline-flex items-center gap-1 text-[var(--color-binance-yellow)]"><RefreshCw size={10} className="animate-spin" /> đang cập nhật...</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-binance-gray)]" />
              <Input placeholder="Lọc nhanh kết quả..." value={localSearch}
                onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Link href="/thue-otp" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-9 text-xs flex items-center justify-center gap-1.5">
                <Plus size={14} /> Thuê số
              </Button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingHistory && historyList.length === 0 ? (
            <div className="py-20 text-center text-[var(--color-binance-gray)] text-sm flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="animate-spin text-[var(--color-binance-yellow)]" />
              Đang tải lịch sử từ máy chủ...
            </div>
          ) : currentItems.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-binance-border)] text-[var(--color-binance-gray)] uppercase font-semibold">
                  <th className="py-3 px-4 w-16"># ID</th>
                  <th className="py-3 px-4">Dịch Vụ</th>
                  <th className="py-3 px-4 w-24">Giá</th>
                  <th className="py-3 px-4">Số Điện Thoại</th>
                  <th className="py-3 px-4 w-28">Code OTP</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4 w-28">Trạng Thái</th>
                  <th className="py-3 px-4 max-w-sm">Tin Nhắn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-binance-border)]/40">
                {currentItems.map((item) => {
                  const isPhoneCopied = copiedText === (item.PhoneOriginal || item.Phone);
                  const isCodeCopied = copiedText === item.Code;
                  const statusLabel = item.Status === 1 ? "Hoàn thành" : item.Status === 2 ? "Hết hạn" : "Đang chờ";
                  const statusColor = item.Status === 1
                    ? "text-[var(--color-binance-success)] bg-[var(--color-binance-success)]/10 border-[var(--color-binance-success)]/20"
                    : item.Status === 2
                    ? "text-[var(--color-binance-gray)] bg-[var(--color-binance-border)]/50 border-[var(--color-binance-border)]"
                    : "text-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 border-[var(--color-binance-yellow)]/20 animate-pulse";

                  return (
                    <tr key={item.ID} className="hover:bg-[var(--color-binance-border)]/10 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[var(--color-binance-gray)]">#{item.ID}</td>
                      <td className="py-3.5 px-4 font-semibold">{item.ServiceName}</td>
                      <td className="py-3.5 px-4 font-mono">{formatVnd(item.Price)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold">{item.PhoneOriginal || item.Phone}</span>
                          <button onClick={() => copy(item.PhoneOriginal || item.Phone)}
                            className="p-1 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors" title="Sao chép số">
                            {isPhoneCopied ? <Check size={12} className="text-[var(--color-binance-success)]" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.Code ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-[var(--color-binance-success)]/10 text-[var(--color-binance-success)] px-2 py-1 rounded-sm font-mono font-bold text-sm border border-[var(--color-binance-success)]/20">
                              {item.Code}
                            </span>
                            <button onClick={() => copy(item.Code)}
                              className="p-1 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors" title="Sao chép OTP">
                              {isCodeCopied ? <Check size={12} className="text-[var(--color-binance-success)]" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[var(--color-binance-gray)] italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-binance-gray)]">
                        {new Date(item.CreatedTime).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-binance-gray)] max-w-sm truncate" title={item.SmsContent}>
                        {item.IsSound === "true" || item.IsSound === true ? (
                          <a href={item.SmsContent} target="_blank" rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1">
                            Audio Cuộc Gọi <ExternalLink size={12} />
                          </a>
                        ) : (
                          item.SmsContent || <span className="italic text-[var(--color-binance-border)]">Chưa có nội dung...</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center text-[var(--color-binance-gray)] text-sm flex flex-col items-center justify-center gap-2">
              <History size={32} className="text-[var(--color-binance-border)] mb-1" />
              <span>Không tìm thấy lịch sử thuê số nào phù hợp.</span>
              <span className="text-xs">
                Ấn nút <span className="text-[var(--color-binance-yellow)] font-medium">Tìm</span> để truy vấn lại từ máy chủ.
              </span>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-binance-border)] pt-4 mt-2 text-xs text-[var(--color-binance-gray)]">
            <div>
              Hiển thị{" "}
              <span className="font-semibold text-[var(--color-binance-light)]">{indexOfFirst + 1}</span>–
              <span className="font-semibold text-[var(--color-binance-light)]">{Math.min(indexOfFirst + ITEMS_PER_PAGE, filteredHistory.length)}</span>
              {" "}/ <span className="font-semibold text-[var(--color-binance-light)]">{filteredHistory.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={safePage === 1}
                className="p-1.5 rounded-sm border border-[var(--color-binance-border)] hover:bg-[var(--color-binance-darker)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={14} />
              </button>
              <span className="font-medium">Trang <span className="text-[var(--color-binance-light)]">{safePage}</span> / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={safePage === totalPages}
                className="p-1.5 rounded-sm border border-[var(--color-binance-border)] hover:bg-[var(--color-binance-darker)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
