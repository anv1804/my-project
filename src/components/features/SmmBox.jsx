"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import {
  Sparkles, Search, RefreshCw, Link2, Sliders, Play,
  History, AlertCircle, ShoppingBag, CheckCircle, Clock,
  HelpCircle, ExternalLink, ArrowRight, Eye, Heart, UserPlus,
  MessageSquare, Star, Share2, ChevronDown, ChevronUp, MapPin, Activity
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useAuthStore } from "@/store/useAuthStore";
import { setStoreCoins, getCoins } from "@/utils/coinService";

const PROFIT_MULTIPLIER = 4.0;
const USD_TO_VND = 25000;

// Format coin helper — always whole numbers, no decimals
const formatCoin = (num) => {
  return new Intl.NumberFormat("vi-VN").format(Math.floor(num)) + " coin";
};

// Format per-unit price — always floor to whole coin (no confusing decimals)
const formatUnitPrice = (num) => {
  const floored = Math.floor(num);
  return new Intl.NumberFormat("vi-VN").format(floored) + " coin";
};

// Platform helper icon
const getPlatformIcon = (platform) => {
  const p = platform?.toLowerCase() || "";
  if (p.includes("tiktok")) return <Sparkles size={16} className="text-pink-500" />;
  if (p.includes("facebook") || p.includes("fb")) return <Star size={16} className="text-blue-500" />;
  if (p.includes("shopee")) return <ShoppingBag size={16} className="text-orange-500" />;
  if (p.includes("lazada")) return <ShoppingBag size={16} className="text-purple-500" />;
  if (p.includes("instagram") || p.includes("ig")) return <Heart size={16} className="text-pink-600" />;
  if (p.includes("youtube") || p.includes("yt")) return <Play size={16} className="text-red-600" />;
  return <HelpCircle size={16} className="text-[var(--color-binance-gray)]" />;
};

const getFixedDuration = (name) => {
  const lowercaseName = (name || "").toLowerCase();
  const match = lowercaseName.match(/\[?(\d+)\s*phút\]?/);
  return match ? parseInt(match[1], 10) : null;
};

const getMinQuantity = (service) => {
  if (!service) return 30;
  const apiMin = parseInt(service.min, 10) || 1;
  if (apiMin < 30) return 30;
  return apiMin;
};

const isLivestreamService = (service) => {
  if (!service) return false;
  const cat = (service.category || "").toLowerCase();
  const name = (service.name || "").toLowerCase();
  return (cat.includes("livestream") || cat.includes("mắt live") || name.includes("livestream") || name.includes("mắt live")) && !cat.includes("live bài viết");
};

export default function SmmBox() {
  const { user, openLoginModal } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("order");
  const [copiedText, copy] = useCopyToClipboard();

  // Services list states
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState(null);

  // Filters inside service view
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Accordion sidebar state
  const [expandedPlatforms, setExpandedPlatforms] = useState({});

  // Order placing states
  const [targetLink, setTargetLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [duration, setDuration] = useState("30");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [multiLinkMode, setMultiLinkMode] = useState(false);

  // Inline validation errors
  const [errors, setErrors] = useState({});
  const clearError = (field) => setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  // History states
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [checkingStatusId, setCheckingStatusId] = useState(null);

  // Fetch SMM Services
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const res = await fetch("/api/smm?action=services");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Filter out inactive services
        const activeServices = data.data.filter(s => s.status === "active");
        setServices(activeServices);

        // Auto select first platform and category
        if (activeServices.length > 0) {
          const platformsList = [...new Set(activeServices.map(s => s.platform || "Khác").filter(Boolean))];
          const defaultPlatform = platformsList.includes("TikTok") ? "TikTok" : platformsList[0];
          setSelectedPlatform(defaultPlatform);
          setExpandedPlatforms({ [defaultPlatform]: true });

          const categoriesList = [...new Set(activeServices
            .filter(s => (s.platform || "Khác") === defaultPlatform)
            .map(s => s.category)
            .filter(Boolean))];
          const defaultCategory = categoriesList[0];
          setSelectedCategory(defaultCategory);

          const matchedServices = activeServices.filter(s => 
            (s.platform || "Khác") === defaultPlatform && s.category === defaultCategory
          );
          if (matchedServices.length > 0) {
            setSelectedService(matchedServices[0]);
          }
        }
      } else {
        toast.error("Không thể tải danh sách dịch vụ SMM.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ dịch vụ SMM.");
    } finally {
      setLoadingServices(false);
    }
  };

  // Fetch Order History
  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/smm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "history" }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Auto-set quantity to min when service changes
  useEffect(() => {
    if (selectedService) {
      const minQty = getMinQuantity(selectedService);
      setQuantity(String(minQty));
    }
  }, [selectedService]);

  // Load services and history on mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Sync platform and category selection from query parameters
  useEffect(() => {
    if (!searchParams || !services.length) return;
    const platQuery = searchParams.get("platform");
    const catQuery = searchParams.get("category");
    
    if (platQuery) {
      // Find matching platform in case-insensitive list
      const pList = [...new Set(services.map(s => s.platform || "Khác").filter(Boolean))];
      const matched = pList.find(p => p.toLowerCase() === platQuery.toLowerCase());
      if (matched) {
        setSelectedPlatform(matched);

        // Find matching category or fallback to first category
        const categoriesList = [...new Set(services
          .filter(s => (s.platform || "Khác") === matched)
          .map(s => s.category)
          .filter(Boolean))];
          
        let matchedCategory = categoriesList[0];
        if (catQuery) {
          const foundCat = categoriesList.find(c => c.toLowerCase() === catQuery.toLowerCase());
          if (foundCat) matchedCategory = foundCat;
        }
        
        setSelectedCategory(matchedCategory);

        if (matchedCategory) {
          const servers = services.filter(s => 
            (s.platform || "Khác") === matched && s.category === matchedCategory
          );
          if (servers.length > 0) setSelectedService(servers[0]);
        }
      }
    }
  }, [searchParams, services]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, user]);

  // Handle placing order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      openLoginModal("Vui lòng đăng nhập để sử dụng dịch vụ SMM!");
      return;
    }

    // --- Inline validation ---
    const newErrors = {};
    if (!selectedService) newErrors.service = "Vui lòng chọn một server dịch vụ bên dưới.";
    if (!targetLink.trim()) newErrors.link = "Vui lòng dán link bài viết hoặc profile cần chạy.";

    let qty = parseInt(quantity, 10);
    if (!selectedService || !newErrors.service) {
      if (isNaN(qty) || qty <= 0) {
        newErrors.quantity = "Vui lòng nhập số lượng hợp lệ.";
      } else if (selectedService) {
        const minQty = getMinQuantity(selectedService);
        if (qty < minQty) {
          qty = minQty;
          setQuantity(String(minQty));
        } else if (qty > selectedService.max) {
          newErrors.quantity = `Số lượng tối đa là ${new Intl.NumberFormat("vi-VN").format(selectedService.max)}.`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const isLivestream = isLivestreamService(selectedService);
    const fixedDuration = getFixedDuration(selectedService.name);
    const minQty = getMinQuantity(selectedService);
    
    let cost;
    let minutes = 1;
    const rateInVnd = parseFloat(selectedService.rate) * USD_TO_VND;
    if (isLivestream) {
      if (fixedDuration !== null) {
        cost = Math.ceil((qty / 1000) * rateInVnd * PROFIT_MULTIPLIER);
        minutes = fixedDuration;
      } else {
        minutes = parseInt(duration, 10) || 30;
        cost = Math.ceil(((qty * minutes) / 1000) * rateInVnd * PROFIT_MULTIPLIER);
      }
    } else {
      cost = Math.ceil((qty / 1000) * rateInVnd * PROFIT_MULTIPLIER);
    }

    if (getCoins() < cost) {
      setErrors({ coins: `Số dư không đủ — cần thêm ${formatCoin(cost - getCoins())}.` });
      return;
    }

    setLoadingOrder(true);
    try {
      const res = await fetch("/api/smm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          service_id: selectedService.service,
          link: targetLink.trim(),
          quantity: qty,
          duration: isLivestream && fixedDuration === null ? minutes : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Tạo đơn hàng SMM thành công!");
        if (data.coinsNow != null) setStoreCoins(data.coinsNow);
        setTargetLink("");
        setQuantity("");
        // Switch to history tab to view order status
        setActiveTab("history");
      } else {
        toast.error(data.message || "Tạo đơn hàng thất bại.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ tạo đơn hàng SMM.");
    } finally {
      setLoadingOrder(false);
    }
  };

  // Check individual order status from API
  const handleCheckStatus = async (orderId) => {
    setCheckingStatusId(orderId);
    try {
      const res = await fetch("/api/smm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          order_id: orderId,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`Cập nhật trạng thái: ${data.data.status}`);
        // Refresh local history list
        fetchHistory();
      } else {
        toast.error("Không tìm thấy trạng thái từ nhà cung cấp.");
      }
    } catch (err) {
      toast.error("Không thể kết nối API cập nhật trạng thái.");
    } finally {
      setCheckingStatusId(null);
    }
  };

  // Filter servers list for current active selection
  const activeServers = services.filter(s => {
    const matchPlatform = (s.platform || "Khác") === selectedPlatform;
    const matchCategory = s.category === selectedCategory;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Custom mock country filter (checking text metadata)
    const matchesCountry = filterCountry === "All" ||
      (filterCountry === "VN" && (s.name.toLowerCase().includes("vietnam") || s.name.toLowerCase().includes("việt") || s.name.toLowerCase().includes("vn"))) ||
      (filterCountry === "Global" && !(s.name.toLowerCase().includes("vietnam") || s.name.toLowerCase().includes("việt") || s.name.toLowerCase().includes("vn")));
    
    // Status filter
    const matchesStatus = filterStatus === "All" ||
      (filterStatus === "active" && s.status === "active") ||
      (filterStatus === "stable" && s.stable === "stable");

    return matchPlatform && matchCategory && matchSearch && matchesCountry && matchesStatus;
  });

  // Calculate dynamic price
  const estimatedCost = selectedService && quantity
    ? (() => {
        const qty = parseInt(quantity, 10) || 0;
        const isLivestream = isLivestreamService(selectedService);
        const fixedDuration = getFixedDuration(selectedService.name);
        const rateInVnd = parseFloat(selectedService.rate) * USD_TO_VND;
        if (isLivestream) {
          if (fixedDuration !== null) {
            return Math.ceil((qty / 1000) * rateInVnd * PROFIT_MULTIPLIER);
          } else {
            const minutes = parseInt(duration, 10) || 30;
            return Math.ceil(((qty * minutes) / 1000) * rateInVnd * PROFIT_MULTIPLIER);
          }
        }
        return Math.ceil((qty / 1000) * rateInVnd * PROFIT_MULTIPLIER);
      })()
    : 0;

  return (
    <div className="flex flex-col gap-6 w-full text-[var(--color-binance-light)]">

      {/* SECTION 1: PROMOTIONAL HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-[var(--color-binance-border)] pb-2.5">
            <Sparkles size={16} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-sm font-semibold">Tăng tương tác tự động</h2>
          </div>
          <p className="text-[var(--color-binance-gray)] text-xs leading-relaxed">
            Dịch vụ tăng Tim, Follow, Like, View, Comment cho TikTok, Facebook, Shopee, Lazada với hệ thống tự động hoàn toàn 24/7.
          </p>
        </div>

        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-[var(--color-binance-border)] pb-2.5">
            <Sliders size={16} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-sm font-semibold">Cơ chế quy đổi linh hoạt</h2>
          </div>
          <p className="text-[var(--color-binance-gray)] text-xs leading-relaxed">
            Giá cả siêu mềm, tính trực tiếp bằng <strong className="text-[var(--color-binance-yellow)]">Coin</strong>. Tỷ lệ quy đổi ưu đãi, trừ tiền chuẩn xác theo số lượng đặt mua thực tế.
          </p>
        </div>

        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-[var(--color-binance-border)] pb-2.5">
            <History size={16} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-sm font-semibold">Theo dõi đơn hàng</h2>
          </div>
          <p className="text-[var(--color-binance-gray)] text-xs leading-relaxed">
            Quản lý mã đơn, số lượng bắt đầu, tiến độ chạy còn lại và cập nhật trạng thái trực tiếp từ nhà cung cấp SMM.
          </p>
        </div>
      </div>

      {/* SECTION 2: TABS */}
      <div className="flex border-b border-[var(--color-binance-border)] gap-2">
        <button
          onClick={() => setActiveTab("order")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "order" ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]" : "border-transparent text-[var(--color-binance-gray)] hover:text-white"}`}
        >
          <ShoppingBag size={16} /> Tạo Đơn Hàng SMM
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "history" ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]" : "border-transparent text-[var(--color-binance-gray)] hover:text-white"}`}
        >
          <History size={16} /> Lịch Sử Đơn Hàng
        </button>
      </div>

      {/* TAB CONTENT: ORDER FORM */}
      {activeTab === "order" ? (
        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5 shadow-lg flex flex-col gap-6 w-full">
          
          {/* Title Section */}
          <div className="border-b border-[var(--color-binance-border)] pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {selectedCategory ? `${selectedCategory} ${selectedPlatform}` : "Dịch vụ SMM Tương tác"} 
              <span className="text-sm font-normal text-[var(--color-binance-gray)]/80">
                – Bứt Phá Tăng Trưởng Tự Nhiên
              </span>
            </h2>
          </div>

          {/* Platform & Category Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-binance-gray)] uppercase">Nền tảng</label>
              <select
                value={selectedPlatform}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value);
                  const cats = [...new Set(services.filter(s => (s.platform || "Khác") === e.target.value).map(s => s.category).filter(Boolean))];
                  setSelectedCategory(cats[0]);
                }}
                className="h-10 rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] px-3 text-xs text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] cursor-pointer"
              >
                {[...new Set(services.map(s => s.platform || "Khác").filter(Boolean))].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-binance-gray)] uppercase">Danh mục</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] px-3 text-xs text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] cursor-pointer"
              >
                {[...new Set(services.filter(s => (s.platform || "Khác") === selectedPlatform).map(s => s.category).filter(Boolean))].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Link Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-binance-gray)] uppercase flex items-center gap-1.5">
              Link:
            </label>
            <Input
              placeholder="Dán link bài viết, profile cần chạy..."
              value={targetLink}
              onChange={(e) => { setTargetLink(e.target.value); clearError("link"); }}
              className={`h-10 text-xs ${errors.link ? "border-red-500 focus:border-red-500" : ""}`}
            />
            {errors.link && (
              <p className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5">
                <AlertCircle size={11} /> {errors.link}
              </p>
            )}
          </div>

          {/* Filters Selectors: Country & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-binance-gray)] uppercase">Quốc gia</label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="h-10 rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] px-3 text-xs text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] cursor-pointer"
              >
                <option value="All">Tất cả quốc gia</option>
                <option value="VN">Việt Nam</option>
                <option value="Global">Quốc tế</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-binance-gray)] uppercase">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] px-3 text-xs text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] cursor-pointer"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="stable">Ổn định</option>
              </select>
            </div>
          </div>

          {/* Servers List */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-[var(--color-binance-gray)] uppercase">Chọn Server</label>
            {errors.service && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.service}
              </p>
            )}
            
            {loadingServices ? (
              <div className="p-8 text-center text-[var(--color-binance-gray)] text-xs flex items-center justify-center gap-2 bg-[var(--color-binance-darker)]/40 rounded border border-[var(--color-binance-border)]">
                <RefreshCw size={12} className="animate-spin text-[var(--color-binance-yellow)]" />
                Đang tải danh sách server...
              </div>
            ) : activeServers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activeServers.map((service) => {
                  const isSel = selectedService?.service === service.service;
                  const finalRate = parseFloat(service.rate) * PROFIT_MULTIPLIER * USD_TO_VND;
                  const isStable = service.stable === "stable" || service.status === "active";
                  
                  return (
                    <div
                      key={service.service}
                      onClick={() => { setSelectedService(service); clearError("service"); }}
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer bg-[var(--color-binance-darker)]/30 hover:border-gray-500/50 ${isSel ? "border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/[0.03]" : errors.service ? "border-red-500/50" : "border-[var(--color-binance-border)]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? "border-[var(--color-binance-yellow)]" : "border-gray-500"}`}>
                          {isSel && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-binance-yellow)]" />}
                        </div>
                        <div className="text-xs font-medium">
                          <span className="font-bold text-[var(--color-binance-gray)] pr-1.5">SV{service.service}:</span>
                          <span className="text-white font-semibold">{service.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[var(--color-binance-yellow)] whitespace-nowrap">
                          {isLivestreamService(service) ? (
                            (() => {
                              const fDur = getFixedDuration(service.name);
                              if (fDur !== null) {
                                return (
                                  <>
                                    {formatUnitPrice(finalRate / 1000)}{" "}
                                    <span className="text-[10px] font-normal text-[var(--color-binance-gray)]">
                                      / mắt / {fDur} phút
                                    </span>
                                  </>
                                );
                              }
                              return (
                                <>
                                  {formatUnitPrice(finalRate / 1000)}{" "}
                                  <span className="text-[10px] font-normal text-[var(--color-binance-gray)]">
                                    / mắt / phút
                                  </span>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              {formatUnitPrice(finalRate / 1000)}{" "}
                              <span className="text-[10px] font-normal text-[var(--color-binance-gray)]">
                                / lượt
                              </span>
                            </>
                          )}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isStable ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                          {isStable ? "Ổn định" : "Bảo trì"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)] rounded border border-[var(--color-binance-border)]">
                Không tìm thấy server phù hợp trong chuyên mục này.
              </div>
            )}
          </div>

          {/* Quantity & Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--color-binance-gray)] uppercase">
                Số lượng (Tối thiểu: {selectedService ? getMinQuantity(selectedService) : 30})
              </label>
              <Input
                type="number"
                placeholder={selectedService ? `Từ ${getMinQuantity(selectedService)} đến ${selectedService.max}` : "Nhập số lượng..."}
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); clearError("quantity"); }}
                onBlur={() => {
                  if (!selectedService) return;
                  const minQty = getMinQuantity(selectedService);
                  const val = parseInt(quantity, 10);
                  if (isNaN(val) || val < minQty) {
                    setQuantity(String(minQty));
                    clearError("quantity");
                  }
                }}
                disabled={!selectedService}
                className={`h-10 text-xs ${errors.quantity ? "border-red-500 focus:border-red-500" : ""}`}
              />
              {errors.quantity && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.quantity}
                </p>
              )}
              {/* Quick preset buttons */}
              {selectedService && (() => {
                const minQty = getMinQuantity(selectedService);
                const maxQty = selectedService.max || 99999;
                const fixed = [30, 50, 100, 500, 1000];
                const list = [minQty, ...fixed.filter(v => v > minQty && v <= maxQty)];
                return (
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {list.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuantity(String(preset))}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all cursor-pointer ${
                          parseInt(quantity, 10) === preset
                            ? "bg-[var(--color-binance-yellow)] text-black border-[var(--color-binance-yellow)]"
                            : "bg-transparent text-[var(--color-binance-gray)] border-[var(--color-binance-border)] hover:border-[var(--color-binance-yellow)] hover:text-[var(--color-binance-yellow)]"
                        }`}
                      >
                        {new Intl.NumberFormat("vi-VN").format(preset)}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {selectedService && isLivestreamService(selectedService) && getFixedDuration(selectedService.name) === null && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--color-binance-gray)] uppercase">
                  Số phút duy trì
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-10 rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] px-3 text-xs text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] cursor-pointer"
                >
                  <option value="30">30 phút</option>
                  <option value="60">60 phút</option>
                  <option value="90">90 phút</option>
                  <option value="120">120 phút</option>
                  <option value="150">150 phút</option>
                  <option value="180">180 phút</option>
                  <option value="240">240 phút</option>
                  <option value="360">360 phút</option>
                  <option value="480">480 phút</option>
                  <option value="600">600 phút</option>
                  <option value="720">720 phút</option>
                </select>
              </div>
            )}
          </div>

          {/* Estimate Cost Preview & Order Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-binance-border)]/40 pt-5 mt-2">
            <div className="text-sm">
              <span className="text-[var(--color-binance-gray)] text-xs block mb-0.5">Tạm tính thanh toán</span>
              <span className="text-lg font-black text-[var(--color-binance-yellow)]">
                {estimatedCost > 0 ? formatCoin(estimatedCost) : selectedService ? formatCoin(0) : "— coin"}
              </span>
              {selectedService && quantity && estimatedCost > 0 && (
                <span className="text-[10px] text-[var(--color-binance-gray)] block mt-0.5">
                  {new Intl.NumberFormat("vi-VN").format(parseInt(quantity, 10))} lượt &times; {formatUnitPrice(parseFloat(selectedService.rate) * USD_TO_VND * PROFIT_MULTIPLIER / 1000)} / lượt
                </span>
              )}
              {errors.coins && (
                <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={11} /> {errors.coins}
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loadingOrder || !selectedService}
              className="w-full sm:w-48 h-11 flex items-center justify-center gap-2 text-base font-bold shadow-lg"
            >
              {loadingOrder ? (
                <><RefreshCw size={16} className="animate-spin" /> Đang tạo đơn...</>
              ) : (
                <><ShoppingBag size={16} /> Đặt Đơn Ngay</>
              )}
            </Button>
          </div>

          {/* Server Description (Ghi chú chi tiết) */}
          {selectedService && (
            <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] p-4 rounded-lg flex flex-col gap-2 mt-2">
              <div className="font-semibold text-white text-xs flex items-center gap-2">
                <CheckCircle size={14} className="text-[var(--color-binance-success)]" />
                Ghi chú chi tiết dịch vụ (Server SV{selectedService.service})
              </div>
              <div className="text-xs text-[var(--color-binance-gray)] leading-relaxed space-y-1 mt-1 pl-5 list-inside">
                <p>✔ <strong>Loại tài khoản:</strong> {selectedService.description || "Tài khoản thực, tốc độ ổn định"}</p>
                <p>✔ <strong>Giới hạn lượt đặt:</strong> Tối thiểu {selectedService.min} và Tối đa {selectedService.max} lượt mỗi đơn.</p>
                <p>✔ <strong>Bảo hành (Refill):</strong> {selectedService.refill ? "Hỗ trợ bảo hành tự động nếu tụt giảm" : "Không hỗ trợ bảo hành"}.</p>
                <p>✔ <strong>Hủy đơn:</strong> {selectedService.cancel ? "Có hỗ trợ gửi yêu cầu hủy đơn hàng" : "Không hỗ trợ hủy đơn sau khi đặt"}.</p>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* TAB CONTENT: ORDER HISTORY */
        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5 shadow-lg flex flex-col gap-4 overflow-hidden">
          <div className="flex justify-between items-center border-b border-[var(--color-binance-border)] pb-3">
            <h3 className="text-sm font-semibold">Đơn hàng tương tác của bạn</h3>
            <span className="bg-[var(--color-binance-border)] text-white text-xs px-2.5 py-1 rounded-full font-mono">
              {history.length} đơn
            </span>
          </div>

          <div className="overflow-x-auto">
            {loadingHistory ? (
              <div className="py-20 text-center text-[var(--color-binance-gray)] flex flex-col items-center gap-3">
                <RefreshCw size={24} className="animate-spin text-[var(--color-binance-yellow)]" />
                <span className="text-sm">Đang tải lịch sử đơn hàng...</span>
              </div>
            ) : history.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-binance-border)] text-[var(--color-binance-gray)] uppercase text-[10px] tracking-wide font-semibold">
                    <th className="py-3 px-3">Mã Đơn</th>
                    <th className="py-3 px-3">Dịch Vụ</th>
                    <th className="py-3 px-3">Link mục tiêu</th>
                    <th className="py-3 px-3">Số Lượng</th>
                    <th className="py-3 px-3">Coin Trả</th>
                    <th className="py-3 px-3">Bắt đầu / Còn lại</th>
                    <th className="py-3 px-3">Trạng Thái</th>
                    <th className="py-3 px-3">Ngày Tạo</th>
                    <th className="py-3 px-3 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-binance-border)]/30">
                  {history.map((order) => {
                    const isCompleted = order.status?.toLowerCase() === "completed";
                    const isPending = order.status?.toLowerCase() === "pending" || order.status?.toLowerCase() === "in progress";
                    const isCanceled = order.status?.toLowerCase() === "canceled" || order.status?.toLowerCase() === "cancelled";
                    
                    return (
                      <tr key={order.id} className="hover:bg-[var(--color-binance-border)]/10 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold">{order.order_id || "Chờ..."}</td>
                        <td className="py-3.5 px-3 font-medium">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(order.platform)}
                            <span>{order.service_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 max-w-[150px] truncate" title={order.link}>
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            Xem link <ExternalLink size={10} />
                          </a>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-white">{order.quantity}</td>
                        <td className="py-3.5 px-3 font-mono text-[var(--color-binance-yellow)] font-bold">{formatCoin(order.coin_cost)}</td>
                        <td className="py-3.5 px-3 font-mono text-[var(--color-binance-gray)]">
                          {order.start_count ?? 0} / {order.remains ?? 0}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isCompleted ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            isCanceled ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse"
                          }`}>
                            {isCompleted ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {order.status || "Chờ..."}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[var(--color-binance-gray)] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {order.order_id && (
                            <button
                              type="button"
                              onClick={() => handleCheckStatus(order.order_id)}
                              disabled={checkingStatusId === order.order_id}
                              className="p-1.5 rounded border border-[var(--color-binance-border)] text-[var(--color-binance-gray)] hover:text-white hover:bg-[var(--color-binance-darker)] transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                              title="Kiểm tra trạng thái mới nhất từ đại lý"
                            >
                              {checkingStatusId === order.order_id ? (
                                <RefreshCw size={11} className="animate-spin" />
                              ) : (
                                <RefreshCw size={11} />
                              )}
                              Cập nhật
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-[var(--color-binance-gray)] flex flex-col items-center gap-2">
                <ShoppingBag size={36} className="opacity-20 mb-2" />
                <span className="text-sm">Bạn chưa đặt đơn hàng SMM nào.</span>
                <span className="text-xs opacity-60">Đặt mua Like, Follow ở tab Tạo Đơn Hàng phía trên.</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
