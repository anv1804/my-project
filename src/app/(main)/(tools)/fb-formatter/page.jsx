import FbFormatterBox from "@/components/features/FbFormatterBox";

export const metadata = {
  title: "Định dạng chữ Facebook In Đậm, In Nghiêng - MMO Tools",
  description: "Công cụ đổi font chữ Facebook thành in đậm, in nghiêng giúp bài viết quảng cáo nổi bật hơn.",
};

export default function FbFormatterPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)] mb-3">Định Dạng Chữ Facebook</h1>
        <p className="text-[var(--color-binance-gray)] text-sm">
          Tạo chữ in đậm, in nghiêng để đăng status, comment Facebook. Giúp nội dung bài viết quảng cáo nổi bật và chuyên nghiệp hơn.
        </p>
      </div>
      <div className="w-full max-w-3xl">
        <FbFormatterBox />
      </div>
    </main>
  );
}
