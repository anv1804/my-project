"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import OtpHistoryBox from "./OtpHistoryBox";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import {
  Phone, RefreshCw, Search, Copy, Check, Timer,
  Globe, Wifi, AlertCircle, History, FileText,
  Volume2, VolumeX, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useAuthStore } from "@/store/useAuthStore";
import { setStoreCoins, getCoins } from "@/utils/coinService";
import { createClient } from "@/utils/supabase/client";

// Giá hiển thị = giá ViOTP × 2, đơn vị coin
const formatCoin = (num) => {
  if (num == null) return "0 coin";
  return new Intl.NumberFormat("vi-VN").format(Math.round(num * 2)) + " coin";
};

// Inline brand SVG icons
const BrandIcon = ({ name }) => {
  switch (name) {
    case "gmail": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#EA4335"/><path d="M8 14l16 11L40 14" stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round"/><path d="M8 14v20h32V14L24 25 8 14z" fill="#EA4335"/><path d="M8 14l16 11L40 14" stroke="white" strokeWidth="2.5" fill="none"/></svg>
    );
    case "telegram": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#2CA5E0"/><path d="M10 23.5l8 3.5 3 8.5 4-5 7 5 6-22-28 10z" fill="white"/><path d="M18 27l-1 7 3-4" fill="#C8DAEA"/></svg>
    );
    case "facebook": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#1877F2"/><path d="M32 8h-5c-3.3 0-6 2.7-6 6v4h-4v6h4v16h6V24h4l1-6h-5v-4c0-1.1.9-2 2-2h3V8z" fill="white"/></svg>
    );
    case "shopee": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#EE4D2D"/><path d="M24 8c-4.4 0-8 3.6-8 8h-6l2 24h24l2-24h-6c0-4.4-3.6-8-8-8zm0 3c2.8 0 5 2.2 5 5H19c0-2.8 2.2-5 5-5zm0 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="white"/></svg>
    );
    case "viber": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#7360F2"/><path d="M24 8C15.2 8 8 14.4 8 22.2c0 4.7 2.4 8.9 6.2 11.6v5.2l5-2.4c1.5.4 3.2.6 4.8.6 8.8 0 16-6.4 16-14.2C40 14.4 32.8 8 24 8zm8 17.4l-2.6 2.6c-.4.4-1 .5-1.4.2-1.2-.8-2.4-1.8-3.4-2.9-1-1-2-2.2-2.8-3.4-.3-.5-.2-1.1.2-1.5l2.4-2.4c.4-.4.4-1 0-1.4l-3-3c-.4-.4-1-.4-1.4 0l-1.8 1.8c-.8.8-1 2-.6 3 1.4 3.8 4.4 6.8 8.2 8.2 1 .4 2.2.2 3-.6L32 24c.4-.4 1-.4 1.4 0l.6.6c.4.4.4 1 0 1.4l-2 1.4z" fill="white"/></svg>
    );
    case "tiktok": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#010101"/><path d="M34 12c-2.5 0-4.8-1.5-5.8-3.8V28a8 8 0 1 1-8-8v4.4a3.6 3.6 0 1 0 3.6 3.6V6h4c.2 2.8 2 5.2 4.5 6.5V16c-1.6 0-3.2-.4-4.5-1.2" fill="white"/></svg>
    );
    default: return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-binance-gray)]"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    );
  }
};

// Network brand config
const NETWORK_CONFIG = {
  MOBIFONE:     { color: "#0080C6", label: "Mobifone" },
  VINAPHONE:    { color: "#CC0000", label: "Vinaphone" },
  VIETTEL:      { color: "#E30613", label: "Viettel" },
  VIETNAMOBILE: { color: "#FF6D00", label: "Vietnamobile" },
  ITELECOM:     { color: "#9B51E0", label: "Itelecom" },
  WINTEL:       { color: "#0EA5E9", label: "Wintel" },
};

export default function OtpRentBox() {
  const { user, profile, openLoginModal } = useAuthStore();
  const searchParams = useSearchParams();

  const [isConnected, setIsConnected] = useState(false);

  // Rental parameters
  const [country, setCountry] = useState("vn");
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);

  // Advanced parameters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [exceptPrefix, setExceptPrefix] = useState("");
  const [customNumber, setCustomNumber] = useState("");

  const [mounted, setMounted] = useState(false);
  const [activeRentals, setActiveRentals] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(0);

  // Parse query parameters for re-renting
  useEffect(() => {
    if (!searchParams) return;
    const rePhone = searchParams.get("re_phone_number");
    const svcId = searchParams.get("service_id");
    if (rePhone) {
      setCustomNumber(rePhone);
      setShowAdvanced(true);
    }
    if (svcId && services.length) {
      const matched = services.find(s => String(s.id) === String(svcId));
      if (matched) setSelectedService(matched);
    }
  }, [searchParams, services]);

  // Load localStorage + đồng bộ pending rentals từ DB sau khi hydration
  useEffect(() => {
    const supabase = createClient();
    const { user } = useAuthStore.getState();

    // Đọc localStorage trước
    let localRentals = [];
    try {
      const saved = localStorage.getItem("otp_active_rentals");
      if (saved) localRentals = JSON.parse(saved);
    } catch {}

    // Dùng String() để tránh type mismatch number vs string
    const localIds = new Set(localRentals.map(r => String(r.request_id)));

    // Dedup helper — luôn dùng khi merge để tránh duplicate key
    const dedup = (list) => {
      const seen = new Set();
      return list.filter(r => {
        const key = String(r.request_id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Fetch pending rentals từ DB, merge những cái chưa có trong localStorage
    const syncFromDb = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("otp_rentals")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", 0)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data?.length) {
          const fromDb = data
            .filter(r => !localIds.has(String(r.request_id)))
            .map(r => ({
              request_id: r.request_id,
              phone_number: r.phone_number,
              countryISO: r.country?.toUpperCase() || "VN",
              countryCode: r.country === "vn" ? "84" : "856",
              service_name: r.service_name,
              service_id: r.service_id,
              price: r.coin_cost / 2,
              coinCost: r.coin_cost,
              status: 0,
              code: "",
              smsContent: "",
              isSound: false,
              createdAt: r.created_at,
            }));
          if (fromDb.length) {
            startTransition(() => setActiveRentals(prev => dedup([...fromDb, ...prev])));
          }
        }
      } catch {}
    };

    startTransition(() => {
      if (localRentals.length) setActiveRentals(localRentals);
      try {
        const s = localStorage.getItem("otp_sound_enabled");
        if (s !== null) setSoundEnabled(s === "true");
      } catch {}
      setMounted(true);
    });

    syncFromDb();
  }, []);

  const rentInFlightRef = useRef(false);

  // Loading flags
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingRent, setLoadingRent] = useState(false);

  const [activeTab, setActiveTab] = useState("rent");
  const [copiedText, copy] = useCopyToClipboard();

  const popularServices = [
    { id: 3,  name: "Gmail",    search: "gmail" },
    { id: 19, name: "Telegram", search: "telegram" },
    { id: 7,  name: "Facebook", search: "facebook" },
    { id: 4,  name: "Shopee",   search: "shopee" },
    { id: 99, name: "Viber",    search: "viber" },
    { id: 86, name: "TikTok",   search: "tiktok" },
  ];

  // Auto-connect on mount — localStorage state is already restored via lazy initializers above
  useEffect(() => {
    // Auto-connect: server-side token, no user input needed
    (async () => {
      setLoadingServices(true);
      try {
        const [svcRes, netRes] = await Promise.all([
          fetch(`/api/otp?path=service/getv2&country=vn`),
          fetch(`/api/otp?path=networks/get`),
        ]);
        const svcData = await svcRes.json();
        const netData = await netRes.json();

        if (svcData.status_code === 200 && svcData.success) {
          setServices(svcData.data.sort((a, b) => a.name.localeCompare(b.name)));
          setIsConnected(true);
        }
        if (netData.status_code === 200 && netData.success) {
          const vnNames = ["MOBIFONE", "VINAPHONE", "VIETTEL", "VIETNAMOBILE", "ITELECOM", "WINTEL"];
          setNetworks(netData.data.filter(n => vnNames.includes(n.name)));
        }
      } catch {
        toast.error("Không thể kết nối hệ thống OTP. Vui lòng thử lại!");
      } finally {
        setLoadingServices(false);
      }
    })();
  }, []);

  // Tick countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Re-fetch when country changes
  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      setLoadingServices(true);
      try {
        const [svcRes, netRes] = await Promise.all([
          fetch(`/api/otp?path=service/getv2&country=${country}`),
          fetch(`/api/otp?path=networks/get`),
        ]);
        const svcData = await svcRes.json();
        const netData = await netRes.json();

        if (svcData.status_code === 200 && svcData.success) {
          const sorted = svcData.data.sort((a, b) => a.name.localeCompare(b.name));
          setServices(sorted);
          if (selectedService && !sorted.find(s => s.id === selectedService.id)) {
            setSelectedService(null);
          }
        }
        if (netData.status_code === 200 && netData.success) {
          const vnNames = ["MOBIFONE", "VINAPHONE", "VIETTEL", "VIETNAMOBILE", "ITELECOM", "WINTEL"];
          const laNames = ["UNITEL", "ETL", "BEELINE", "LAOTEL"];
          setNetworks(netData.data.filter(n =>
            country === "vn" ? vnNames.includes(n.name) : laNames.includes(n.name)
          ));
          setSelectedNetworks([]);
        }
      } catch {}
      finally {
        setLoadingServices(false);
      }
    })();
  }, [country]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save active rentals to localStorage
  useEffect(() => {
    localStorage.setItem("otp_active_rentals", JSON.stringify(activeRentals));
  }, [activeRentals]);

  const playAlertSound = () => {
    try {
      const audio = new Audio("/notification-a.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };


  // Polling for waiting rentals (every 4s)
  useEffect(() => {
    // Dedup trước khi poll — tránh hoàn coin nhiều lần do duplicate entry
    const seen = new Set();
    const waiting = activeRentals.filter(r => {
      const key = String(r.request_id);
      if (r.status !== 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (waiting.length === 0 || !isConnected) return;

    const id = setInterval(async () => {
      const updated = [...activeRentals];
      let changed = false;

      await Promise.all(waiting.map(async (rental) => {
        try {
          const res = await fetch(`/api/otp?path=session/getv2&requestId=${rental.request_id}`);
          if (!res.ok) return;
          const result = await res.json();
          if (result.success && result.data) {
            const newStatus = result.data.Status;
            if (newStatus !== 0) {
              const idx = updated.findIndex(r => String(r.request_id) === String(rental.request_id));
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  status: newStatus,
                  code: result.data.Code || "",
                  smsContent: result.data.SmsContent || "",
                  isSound: result.data.IsSound === "true" || result.data.IsSound === true,
                  price: result.data.Price || updated[idx].price,
                };
                changed = true;
                // Cập nhật DB + nhận kết quả hoàn coin từ server
                fetch('/api/otp-rental', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update',
                    request_id: rental.request_id,
                    status: newStatus,
                    code: result.data.Code || '',
                    sms_content: result.data.SmsContent || '',
                  }),
                }).then(r => r.json()).then(res => {
                  if (res.coinsNow != null) setStoreCoins(res.coinsNow);
                  if (res.coinRefunded > 0) {
                    toast.success(`Đã hoàn ${new Intl.NumberFormat("vi-VN").format(res.coinRefunded)} coin cho số ${rental.phone_number}`);
                  }
                }).catch(() => {});
                if (newStatus === 1) {
                  toast.success(`Nhận OTP thành công cho số ${rental.phone_number}!`);
                  if (soundEnabled) playAlertSound();
                } else if (newStatus === 2) {
                  updated[idx].expiredAt = Date.now();
                  toast.error(`Yêu cầu thuê số ${rental.phone_number} đã hết hạn!`);
                }
              }
            }
          }
        } catch {}
      }));

      if (changed) setActiveRentals(updated);
    }, 4000);

    return () => clearInterval(id);
  }, [activeRentals, isConnected, soundEnabled]);

  // Tự động xóa SIM hết hạn sau 1 phút
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setActiveRentals(prev => {
        const filtered = prev.filter(r => !(r.status === 2 && r.expiredAt && now - r.expiredAt >= 60000));
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const handleRent = async () => {
    if (!isConnected) { toast.error("Hệ thống chưa sẵn sàng, vui lòng đợi..."); return; }
    if (!selectedService) { toast.error("Vui lòng chọn một dịch vụ cần thuê!"); return; }
    if (!user) { openLoginModal("Vui lòng đăng nhập để thuê số OTP!"); return; }

    // Kiểm tra nhanh client-side (UX) — server sẽ validate lại
    const estimatedCost = Math.round(selectedService.price * 2);
    if (getCoins() < estimatedCost) {
      toast.error(`Không đủ coin! Cần khoảng ${new Intl.NumberFormat("vi-VN").format(estimatedCost)} coin.`);
      return;
    }

    // Chống double-click
    if (rentInFlightRef.current) return;
    rentInFlightRef.current = true;
    setLoadingRent(true);

    try {
      const res = await fetch('/api/otp-rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rent',
          service_id: selectedService.id,
          service_name: selectedService.name,
          country,
          networks: selectedNetworks,
          prefix: prefix.trim() || undefined,
          except_prefix: exceptPrefix.trim() || undefined,
          custom_number: customNumber.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const item = data.data;
        if (data.coinsNow != null) setStoreCoins(data.coinsNow);
        setActiveRentals(prev => [{
          request_id: item.request_id,
          phone_number: item.phone_number,
          re_phone_number: item.re_phone_number,
          countryISO: item.countryISO,
          countryCode: item.countryCode,
          service_name: selectedService.name,
          service_id: selectedService.id,
          price: selectedService.price,
          coinCost: data.coinCost ?? estimatedCost,
          status: 0,
          code: "",
          smsContent: "",
          isSound: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        const msg = data.rerentWindow
          ? `Thuê thành công: ${item.phone_number} (còn ${data.rerentWindow} phút để thuê lại)`
          : `Yêu cầu thuê số thành công: ${item.phone_number}`;
        toast.success(msg);
        if (customNumber) setCustomNumber("");
      } else {
        // coinsNow được trả về khi server đã refund
        if (data.coinsNow != null) setStoreCoins(data.coinsNow);
        toast.error(data.message || "Không thể thuê số.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    } finally {
      rentInFlightRef.current = false;
      setLoadingRent(false);
    }
  };

  const toggleNetwork = (name) =>
    setSelectedNetworks(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const handleRemoveRental = (requestId) => {
    setActiveRentals(prev => prev.filter(r => String(r.request_id) !== String(requestId)));
  };

  const handleRentAgain = (rental) => {
    setCountry(rental.countryISO?.toLowerCase() === "vn" ? "vn" : "la");
    setCustomNumber(rental.phone_number);
    const matched = services.find(s => s.id === rental.service_id);
    setSelectedService(matched || { id: rental.service_id, name: rental.service_name, price: rental.price });
    setActiveTab("rent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full text-[var(--color-binance-light)]">

      {/* SECTION 1: STATUS + GUIDE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* System Status Card */}
        <div className="md:col-span-4 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-binance-border)] pb-3">
            <Wifi size={16} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-sm font-semibold">Trạng thái hệ thống</h2>
          </div>

          <div className="bg-[var(--color-binance-darker)] rounded-md p-4 border border-[var(--color-binance-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-[var(--color-binance-success)] animate-pulse" : "bg-[var(--color-binance-yellow)] animate-pulse"}`} />
              <div>
                <div className="text-[11px] text-[var(--color-binance-gray)] uppercase font-semibold">Dịch vụ OTP</div>
                <div className="text-sm font-medium">{isConnected ? "Đang hoạt động" : "Đang khởi động..."}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[var(--color-binance-gray)] uppercase font-semibold">Đơn vị</div>
              <div className="text-lg font-bold text-[var(--color-binance-yellow)]">Coin</div>
            </div>
          </div>

          <p className="text-[var(--color-binance-gray)] text-xs leading-relaxed">
            Hệ thống sử dụng đơn vị <strong className="text-[var(--color-binance-yellow)]">Coin</strong> cho mọi giao dịch. Nạp coin để thuê số OTP.
          </p>
        </div>

        {/* Instructions Card */}
        <div className="md:col-span-8 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 border-b border-[var(--color-binance-border)] pb-3">
            <FileText size={16} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-sm font-semibold">Hướng dẫn sử dụng</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-[var(--color-binance-gray)]">
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">1</span>
              <p>Chọn quốc gia <strong className="text-[var(--color-binance-light)]">Việt Nam / Lào</strong> và tìm kiếm ứng dụng muốn lấy OTP (Telegram, FB, Gmail...).</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">2</span>
              <p>Nhấp chọn nhà mạng (tuỳ chọn) rồi bấm <strong className="text-[var(--color-binance-light)]">&ldquo;Thuê số ngay&rdquo;</strong>. Hệ thống cấp số điện thoại ngay lập tức.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">3</span>
              <p>Nhập số điện thoại vào ứng dụng, đợi 1–3 phút. Mã OTP sẽ đồng bộ tự động bên dưới.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">4</span>
              <p>Nếu số không nhận được tin nhắn, bạn <strong className="text-white">không bị trừ coin</strong>. Thời gian chờ tối đa 5–10 phút.</p>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: TABS */}
      <div className="flex border-b border-[var(--color-binance-border)] gap-2">
        <button
          onClick={() => setActiveTab("rent")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "rent" ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]" : "border-transparent text-[var(--color-binance-gray)] hover:text-white"}`}
        >
          <Phone size={16} /> Thuê số trực tuyến
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "history" ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]" : "border-transparent text-[var(--color-binance-gray)] hover:text-white"}`}
        >
          <History size={16} /> Lịch sử thuê
        </button>
      </div>

      {/* SECTION 3: RENT FORM */}
      {activeTab === "rent" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Order Form */}
          <div className="lg:col-span-7 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg flex flex-col gap-5">

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-binance-gray)] uppercase tracking-wider mb-2">1. Chọn Quốc Gia</label>
              <div className="flex gap-3">
                {[{ code: "vn", label: "Việt Nam (VN)" }, { code: "la", label: "Lào (LA)" }].map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => setCountry(code)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-sm border text-sm font-medium transition-all cursor-pointer ${country === code ? "border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]" : "border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)] hover:border-gray-500 hover:text-white"}`}
                  >
                    <Globe size={16} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-binance-gray)] uppercase tracking-wider mb-2">2. Chọn Dịch Vụ / Ứng Dụng</label>

              <div className="flex flex-wrap gap-2 mb-3">
                {popularServices.map((pop) => {
                  const isActive = selectedService?.name.toLowerCase().includes(pop.search);
                  return (
                    <button
                      key={pop.id}
                      onClick={() => {
                        setSearchQuery(pop.search);
                        const found = services.find(s => s.name.toLowerCase().includes(pop.search));
                        if (found) setSelectedService(found);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${isActive ? "bg-[var(--color-binance-yellow)] text-black font-semibold border-[var(--color-binance-yellow)]" : "bg-[var(--color-binance-darker)] border-[var(--color-binance-border)] text-[var(--color-binance-gray)] hover:text-white hover:border-gray-500"}`}
                    >
                      <BrandIcon name={pop.search} />
                      {pop.name}
                    </button>
                  );
                })}
              </div>

              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-binance-gray)]" />
                <Input
                  placeholder="Tìm kiếm ứng dụng (Ví dụ: Facebook, Telegram...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-sm max-h-48 overflow-y-auto">
                {loadingServices ? (
                  <div className="p-8 text-center text-[var(--color-binance-gray)] text-sm flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-[var(--color-binance-yellow)]" />
                    Đang tải danh sách dịch vụ...
                  </div>
                ) : filteredServices.length > 0 ? (
                  <div className="divide-y divide-[var(--color-binance-border)]/40">
                    {filteredServices.map((service) => {
                      const isSel = selectedService?.id === service.id;
                      return (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${isSel ? "bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)] font-semibold" : "hover:bg-[var(--color-binance-border)]/30"}`}
                        >
                          <span>{service.name}</span>
                          <span className={isSel ? "text-[var(--color-binance-yellow)]" : "text-[var(--color-binance-gray)]"}>
                            {formatCoin(service.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[var(--color-binance-gray)] text-sm">
                    {isConnected ? "Không tìm thấy dịch vụ nào phù hợp." : "Đang kết nối hệ thống..."}
                  </div>
                )}
              </div>
            </div>

            {/* Network */}
            {networks.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-binance-gray)] uppercase tracking-wider mb-2">
                  3. Chọn Nhà Mạng (Tùy chọn, để trống = Ngẫu nhiên)
                </label>
                <div className="flex flex-wrap gap-2">
                  {networks.map((net) => {
                    const isSel = selectedNetworks.includes(net.name);
                    const cfg = NETWORK_CONFIG[net.name] || { color: "#888", label: net.name };
                    return (
                      <button
                        key={net.id}
                        onClick={() => toggleNetwork(net.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-all cursor-pointer font-medium ${isSel ? "border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]" : "border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)] hover:text-white hover:border-gray-500"}`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                          style={{ backgroundColor: isSel ? "var(--color-binance-yellow)" : "#22c55e" }}
                        />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Advanced */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer"
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Cấu hình nâng cao (Đầu số / Thuê lại số cũ)
              </button>

              {showAdvanced && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--color-binance-darker)] p-4 rounded-md border border-[var(--color-binance-border)] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-binance-gray)] mb-1">Chỉ lấy đầu số (cách nhau bởi &apos;|&apos;)</label>
                    <Input placeholder="Ví dụ: 90|91|98" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-binance-gray)] mb-1">Tránh đầu số (cách nhau bởi &apos;|&apos;)</label>
                    <Input placeholder="Ví dụ: 94|96|97" value={exceptPrefix} onChange={(e) => setExceptPrefix(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-[var(--color-binance-gray)] mb-1">Thuê lại số điện thoại cũ</label>
                    <Input placeholder="Nhập số điện thoại gốc (84... hoặc 856...)" value={customNumber} onChange={(e) => setCustomNumber(e.target.value)} className="h-9 text-xs" />
                    <p className="text-[10px] text-[var(--color-binance-gray)] mt-1">
                      * Dùng giá trị &apos;re_phone_number&apos; hoặc &apos;PhoneOriginal&apos; để thuê lại số đã thuê trước đó.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary & Order */}
            <div className="border-t border-[var(--color-binance-border)] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="text-sm">
                {selectedService ? (
                  <div>
                    Đã chọn: <span className="font-semibold text-white">{selectedService.name}</span>
                    <span className="text-[var(--color-binance-yellow)] font-bold ml-2">({formatCoin(selectedService.price)})</span>
                  </div>
                ) : (
                  <span className="text-[var(--color-binance-gray)]">Chưa chọn dịch vụ</span>
                )}
              </div>

              <Button
                onClick={handleRent}
                disabled={loadingRent || !selectedService || !isConnected}
                className="w-full sm:w-48 h-11 flex items-center justify-center gap-2 text-base shadow-lg"
              >
                {loadingRent ? (
                  <><RefreshCw size={16} className="animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Phone size={16} /> Thuê Số Ngay</>
                )}
              </Button>
            </div>

          </div>

          {/* Sound panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--color-binance-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-[var(--color-binance-yellow)]" />
                  <h3 className="text-sm font-semibold">Quét Tín Hiệu Tin Nhắn</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-[10px] text-[var(--color-binance-gray)] uppercase">Auto 4s</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-binance-gray)]">Âm báo có OTP:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        localStorage.setItem("otp_sound_enabled", String(next));
                      }}
                      className={`p-1.5 rounded-md border transition-all cursor-pointer ${soundEnabled ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10" : "border-[var(--color-binance-border)] text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)]"}`}
                    >
                      {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                    <button
                      onClick={() => { playAlertSound(); toast.success("Đã phát âm thanh thông báo mẫu!"); }}
                      className="text-xs text-[var(--color-binance-gray)] hover:text-white hover:underline cursor-pointer"
                    >
                      Thử âm thanh
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)] p-3.5 rounded border border-[var(--color-binance-border)] leading-relaxed">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5 text-[13px]">
                    <AlertCircle size={14} className="text-[var(--color-binance-yellow)]" />
                    Lưu ý quan trọng
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] mt-1.5">
                    <li>Nếu số không nhận được tin nhắn, bạn sẽ <strong className="text-white">không bị trừ coin</strong>.</li>
                    <li>Thời gian chờ tin nhắn của SIM khoảng 5 – 10 phút.</li>
                    <li>Không đóng trang này khi đang chờ OTP để tránh gián đoạn tiến trình.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* SECTION 4: HISTORY */
        <OtpHistoryBox hideHeader={true} onRentAgain={handleRentAgain} />
      )}

      {/* SECTION 5: ACTIVE RENTALS */}
      <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b border-[var(--color-binance-border)] pb-3">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-[var(--color-binance-yellow)] shrink-0" />
            <h2 className="text-sm font-semibold whitespace-nowrap">SIM Đang Hoạt Động</h2>
          </div>
          <span suppressHydrationWarning className="bg-[var(--color-binance-border)]/50 text-white text-xs px-2.5 py-1 rounded-full font-mono">
            {activeRentals.length} số
          </span>
        </div>

        {activeRentals.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-binance-border)] rounded-xl">
            <div className="w-12 h-12 rounded-full bg-[var(--color-binance-darker)] flex items-center justify-center text-[var(--color-binance-gray)] mb-3">
              <Phone size={22} />
            </div>
            <p className="text-[var(--color-binance-gray)] text-sm">Chưa có số nào đang hoạt động</p>
            <p className="text-[var(--color-binance-gray)] text-xs mt-1 opacity-60">Thuê số ở khung bên trên để nhận OTP</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRentals.map((rental) => {
              const durationSecs = 300;
              const elapsed = Math.floor((now - new Date(rental.createdAt).getTime()) / 1000);
              const remaining = Math.max(0, durationSecs - elapsed);
              const pct = (remaining / durationSecs) * 100;
              const m = Math.floor(remaining / 60);
              const s = remaining % 60;
              const formattedTime = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

              const isWaiting = rental.status === 0;
              const isCompleted = rental.status === 1;
              const isExpired = rental.status === 2 || (isWaiting && remaining === 0);
              const isPhoneCopied = copiedText === rental.phone_number;
              const isCodeCopied = copiedText === rental.code;

              const borderColor = isCompleted ? "#22c55e" : isExpired ? "#4b5563" : "#f0b90b";
              const bgGlow = isCompleted ? "bg-green-500/[0.04]" : isExpired ? "" : "bg-yellow-500/[0.03]";

              return (
                <div
                  key={rental.request_id}
                  className={`relative rounded-xl border bg-[var(--color-binance-darker)]/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-black/20 overflow-hidden ${isExpired ? "opacity-60" : ""}`}
                  style={{ borderColor }}
                >
                  {/* Top glow strip */}
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${borderColor}aa, transparent)` }} />

                  <div className="p-4 flex flex-col gap-3">

                    {/* Header row: icon | info | status + actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] flex items-center justify-center">
                          <BrandIcon name={rental.service_name?.toLowerCase()} />
                        </div>

                        {/* Service name + meta */}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[var(--color-binance-light)] leading-snug truncate" title={rental.service_name}>{rental.service_name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Globe size={9} className="text-blue-400 shrink-0" />
                            <span className="text-[10px] font-semibold text-[var(--color-binance-gray)]">{rental.countryISO?.toUpperCase()}</span>
                            <span className="text-[10px] text-[var(--color-binance-gray)]/40">·</span>
                            <span className="text-[10px] text-[var(--color-binance-yellow)] font-mono whitespace-nowrap">{formatCoin(rental.price)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status + Actions Row */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isWaiting && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
                            <RefreshCw size={9} className="animate-spin text-yellow-400" />
                            <span className="font-mono text-[10px] text-yellow-400 tabular-nums">{formattedTime}</span>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25">
                            <CheckCircle2 size={10} className="text-green-400" />
                            <span className="text-[10px] text-green-400">Thành công</span>
                          </div>
                        )}
                        {isExpired && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/25">
                            <XCircle size={10} className="text-gray-400" />
                            <span className="text-[10px] text-gray-400">Hết hạn</span>
                          </div>
                        )}

                        <div className="flex items-center border-l border-[var(--color-binance-border)]/40 pl-1.5 ml-0.5 gap-0.5">
                          <button onClick={() => handleRentAgain(rental)} title="Thuê lại số này" className="p-1 rounded text-[var(--color-binance-gray)] hover:text-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/10 transition-colors cursor-pointer">
                            <RefreshCw size={12} />
                          </button>
                          <button onClick={() => handleRemoveRental(rental.request_id)} title="Xóa thẻ này" className="p-1 rounded text-[var(--color-binance-gray)] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Phone number row */}
                    <div className="flex items-center justify-between gap-2 bg-[var(--color-binance-darker)]/80 hover:bg-[var(--color-binance-darker)] rounded-lg px-3 py-2 border border-[var(--color-binance-border)]/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-green-400" : isExpired ? "bg-gray-500" : "bg-yellow-400 animate-pulse"}`} />
                        <span className="font-mono font-bold text-white text-[13px] tracking-wide">
                          {rental.countryCode ? `+${rental.countryCode} ` : ""}{rental.phone_number}
                        </span>
                      </div>
                      <button onClick={() => copy(rental.phone_number)} className="p-1 rounded text-[var(--color-binance-gray)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Copy số điện thoại">
                        {isPhoneCopied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* OTP code highlight */}
                    {isCompleted && rental.code && (
                      <div className="mt-1 flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-green-500/10 border border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.05)]">
                        <div>
                          <div className="text-[9px] text-green-400/70 uppercase tracking-widest font-bold mb-0.5">Mã OTP</div>
                          <span className="font-mono font-black text-green-400 text-lg tracking-[0.2em]">{rental.code}</span>
                        </div>
                        <button
                          onClick={() => copy(rental.code)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                        >
                          {isCodeCopied ? <><Check size={11} /> Copy xong</> : <><Copy size={11} /> Copy</>}
                        </button>
                      </div>
                    )}

                    {/* Progress bar */}
                    {isWaiting && (
                      <div className="mt-1 h-1 bg-[var(--color-binance-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #f0b90b, #fbbf24)` }}
                        />
                      </div>
                    )}

                    {/* SMS content */}
                    {rental.smsContent && (
                      <div className="mt-1 px-3 py-2.5 bg-[var(--color-binance-darker)]/80 border border-[var(--color-binance-border)]/50 rounded-lg">
                        <div className="text-[9px] text-[var(--color-binance-gray)] uppercase tracking-wider font-bold mb-1 opacity-70">Tin nhắn nhận được</div>
                        {rental.isSound ? (
                          <audio src={rental.smsContent} controls className="w-full h-7" />
                        ) : (
                          <p className="font-mono text-xs text-white/95 whitespace-pre-wrap select-all leading-relaxed break-all">{rental.smsContent}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
