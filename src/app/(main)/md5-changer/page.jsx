import Md5ChangerBox from "@/components/features/Md5ChangerBox";

export const metadata = {
  title: "Công cụ đổi mã MD5 Video lách bản quyền - MMO Tools",
  description: "Phần mềm lách thuật toán quét bản quyền video TikTok, Douyin. Đổi mã Hash hoàn toàn miễn phí.",
};

export default function Md5ChangerPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)] mb-3">Công cụ Đổi mã MD5 Video</h1>
        <p className="text-[var(--color-binance-gray)] text-sm">
          Thay đổi chỉ số Hash (MD5) của video giúp lách bản quyền Reup cực kỳ hiệu quả. 
          Không làm giảm chất lượng video. File không lưu trên máy chủ của chúng tôi.
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <Md5ChangerBox />
      </div>
    </main>
  );
}
