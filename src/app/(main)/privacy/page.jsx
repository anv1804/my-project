import React from "react";
import { Lock } from "lucide-react";

export const metadata = {
  title: "Chính Sách Bảo Mật - MMOTools",
  description: "Chính sách bảo mật thông tin người dùng tại MMOTools.",
};

export default function PrivacyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--color-binance-border)]">
        <Lock size={32} className="text-[var(--color-binance-yellow)]" />
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)]">Chính Sách Bảo Mật</h1>
      </div>

      <div className="space-y-6 text-[var(--color-binance-gray)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">1. Thu thập thông tin</h2>
          <p>
            Khi bạn sử dụng MMOTools, chúng tôi có thể thu thập một số thông tin nhất định bao gồm: địa chỉ IP, loại trình duyệt, thời gian truy cập và các thông tin cơ bản khi bạn đăng nhập qua Google hoặc Facebook (Email, Tên hiển thị).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">2. Sử dụng thông tin</h2>
          <p>
            Thông tin của bạn được sử dụng vào các mục đích:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Duy trì và cải thiện chất lượng dịch vụ.</li>
            <li>Cá nhân hóa trải nghiệm người dùng (như lưu lịch sử tạo hashtag, tiêu đề).</li>
            <li>Ngăn chặn các hành vi gian lận hoặc phá hoại hệ thống.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">3. Bảo vệ dữ liệu</h2>
          <p>
            Chúng tôi cam kết sử dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ dữ liệu cá nhân của bạn khỏi việc truy cập, thay đổi hoặc phá hủy trái phép. Các thông tin nhạy cảm đều được mã hóa khi truyền tải.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">4. Chia sẻ thông tin</h2>
          <p>
            MMOTools tuyệt đối không bán, trao đổi hoặc cho thuê thông tin cá nhân của người dùng cho bên thứ ba. Dữ liệu chỉ được cung cấp khi có yêu cầu hợp pháp từ cơ quan chức năng có thẩm quyền.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">5. Cookie</h2>
          <p>
            Hệ thống sử dụng Cookie và LocalStorage/SessionStorage để lưu trữ phiên đăng nhập và các thiết lập ưu tiên của bạn trên trình duyệt. Bạn có thể vô hiệu hóa Cookie, nhưng điều này có thể ảnh hưởng đến một số tính năng của website.
          </p>
        </section>
      </div>
      
      <div className="mt-12 text-sm text-[var(--color-binance-gray)]/50 text-center">
        Cập nhật lần cuối: Tháng 6 năm 2026
      </div>
    </div>
  );
}
