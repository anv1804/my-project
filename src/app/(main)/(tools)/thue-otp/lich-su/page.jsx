import OtpHistoryBox from "@/components/features/OtpHistoryBox";

export const metadata = {
  title: "Lịch Sử Thuê Số Nhận OTP - MMO Tools",
  description: "Trang tra cứu, lọc và xuất dữ liệu lịch sử thuê số điện thoại ảo nhận OTP tự động từ ViOTP.",
};

export default function OtpHistoryPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-7xl">
        <OtpHistoryBox />
      </div>
    </main>
  );
}
