import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import AdZone from "@/components/ads/AdZone";
import SupportWidget from "@/components/common/SupportWidget";
import LoginModal from "@/components/features/auth/LoginModal";
import CoinTopupModal from "@/components/features/CoinTopupModal";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-binance-darker)] transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header />
        
        {/* Vùng Quảng Cáo Top Banner (Hiển thị ở tất cả các trang con) */}
        <div className="p-4 sm:p-6 pb-0 max-w-7xl mx-auto w-full">
          <AdZone id="TOP-BANNER-MAIN" className="mb-2" />
        </div>

        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <SupportWidget />
        <LoginModal />
        <CoinTopupModal />
      </div>
    </div>
  );
}
