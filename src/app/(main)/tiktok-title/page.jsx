import TiktokTitleBox from "@/components/features/TiktokTitleBox";

export const metadata = {
  title: "Gợi ý Tiêu đề TikTok (Viral) | MMO Tools",
  description: "Công cụ tạo tiêu đề giật tít, thu hút người xem cho Video và Bài ảnh trên TikTok.",
};

export default function TiktokTitlePage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-binance-light)] mb-2">
          Gợi ý Tiêu đề TikTok (Viral)
        </h1>
        <p className="text-[var(--color-binance-gray)] text-sm">
          Nhập từ khóa nội dung để tạo tiêu đề hấp dẫn. Hỗ trợ tạo Tiêu đề đơn cho Video và Tiêu đề kép cho định dạng Bài Ảnh (Photo Swipe).
        </p>
      </div>

      <TiktokTitleBox />
    </div>
  );
}
