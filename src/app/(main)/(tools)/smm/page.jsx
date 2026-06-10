import SmmBox from "@/components/features/SmmBox";
import { Suspense } from "react";

export const metadata = {
  title: "Dịch Vụ Tương Tác SMM Tự Động (Follow, Like, View, Comment) - MMO Tools",
  description: "Dịch vụ tăng tương tác tự động cho TikTok, Facebook, Shopee, Lazada với hệ thống đại lý SMM tự động 24/7.",
};

export default function SmmPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-7xl w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)] mb-3 flex items-center justify-center gap-2.5">
          <span className="w-2.5 h-8 bg-[var(--color-binance-yellow)] rounded-sm inline-block"></span>
          Dịch Vụ SMM Tương Tác Mạng Xã Hội
        </h1>
        <p className="text-[var(--color-binance-gray)] text-sm max-w-2xl mx-auto">
          Tăng lượng Tim, Follow, Like, View, Comment cho các nền tảng mạng xã hội và thương mại điện tử. Hệ thống kết nối trực tiếp đại lý siêu tốc để xử lý các gói tương tác an toàn.
        </p>
      </div>
      <div className="w-full max-w-7xl">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20 text-[var(--color-binance-gray)]">
            <span className="text-sm">Đang tải biểu mẫu...</span>
          </div>
        }>
          <SmmBox />
        </Suspense>
      </div>
    </main>
  );
}
