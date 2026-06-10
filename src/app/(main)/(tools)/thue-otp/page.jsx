import OtpRentBox from "@/components/features/OtpRentBox";
import { Suspense } from "react";

export const metadata = {
  title: "Thuê Số Điện Thoại Nhận OTP Online - MMO Tools",
  description: "Dịch vụ thuê số điện thoại Việt Nam & Lào nhận mã xác thực OTP tự động cho Telegram, Gmail, Facebook, Shopee...",
};

export default function OtpRentPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-7xl w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)] mb-3 flex items-center justify-center gap-2.5">
          <span className="w-2.5 h-8 bg-[var(--color-binance-yellow)] rounded-sm inline-block"></span>
          Thuê Số Nhận OTP Tự Động
        </h1>
        <p className="text-[var(--color-binance-gray)] text-sm max-w-2xl mx-auto">
          Thuê số điện thoại ảo kích hoạt tài khoản Việt Nam & Lào. Hệ thống quét tin nhắn và trả mã OTP siêu tốc phục vụ nhu cầu MMO, Affiliate, và Reup chuyên nghiệp.
        </p>
      </div>
      <div className="w-full max-w-7xl">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20 text-[var(--color-binance-gray)]">
            <span className="text-sm">Đang tải biểu mẫu...</span>
          </div>
        }>
          <OtpRentBox />
        </Suspense>
      </div>
    </main>
  );
}
