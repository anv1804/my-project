import NapCoinBox from "@/components/features/NapCoinBox";
import { Coins } from "lucide-react";

export const metadata = {
  title: "Nạp Coin - MMO Tools",
  description: "Nạp coin vào tài khoản bằng VietQR. Quét mã, chuyển khoản, hệ thống tự động cộng coin ngay lập tức.",
};

export default function NapCoinPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center p-4 sm:p-6">
      <div className="max-w-5xl w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)] mb-3 flex items-center justify-center gap-2.5">
          <span className="w-2.5 h-8 bg-[var(--color-binance-yellow)] rounded-sm inline-block" />
          Nạp Coin Tự Động
        </h1>
        <p className="text-[var(--color-binance-gray)] text-sm max-w-2xl mx-auto">
          Quét mã VietQR bằng app ngân hàng bất kỳ, ghi đúng nội dung chuyển khoản.
          Hệ thống tự động xác nhận và cộng coin trong vòng <strong className="text-[var(--color-binance-light)]">1–5 phút</strong>.
        </p>
      </div>
      <div className="w-full max-w-5xl">
        <NapCoinBox />
      </div>
    </main>
  );
}
