import HashtagGeneratorBox from "@/components/features/HashtagGeneratorBox";
import TrendingHashtags from "@/components/features/TrendingHashtags";

export const metadata = {
  title: "Tạo Hashtag & Bảng Xếp Hạng TikTok - MMO Tools",
};

export default function HashtagPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen flex justify-center">
      <div className="w-full max-w-5xl flex flex-col gap-10">
        
        {/* Tiêu đề trang */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-binance-light)] mb-3">
            Trung tâm Phân tích & Tạo Hashtag
          </h1>
          <p className="text-[var(--color-binance-gray)] text-sm max-w-2xl mx-auto">
            Tạo bộ thẻ chuẩn SEO giúp video của bạn cắn đề xuất, sau đó tham khảo thêm Bảng xếp hạng các Hashtag đang thịnh hành nhất TikTok bên dưới.
          </p>
        </div>
        
        {/* Phần 1: Khung tạo Hashtag (Ở TRÊN) */}
        <section className="w-full">
          <HashtagGeneratorBox />
        </section>

        {/* Phần 2: Bảng xếp hạng (Ở DƯỚI) */}
        <section className="w-full">
          <TrendingHashtags />
        </section>

      </div>
    </main>
  );
}
