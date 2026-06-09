import React from "react";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Điều Khoản Dịch Vụ - MMOTools",
  description: "Điều khoản sử dụng dịch vụ tại MMOTools.",
};

export default function TermsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--color-binance-border)]">
        <ShieldCheck size={32} className="text-[var(--color-binance-yellow)]" />
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)]">Điều Khoản Dịch Vụ</h1>
      </div>

      <div className="space-y-6 text-[var(--color-binance-gray)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">1. Chấp nhận điều khoản</h2>
          <p>
            Bằng việc truy cập và sử dụng website MMOTools, bạn đồng ý tuân thủ các điều khoản dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">2. Quyền sở hữu trí tuệ</h2>
          <p>
            Nội dung, thiết kế, cấu trúc và mã nguồn của website này thuộc bản quyền của MMOTools. Bất kỳ việc sao chép, phân phối hoặc sửa đổi nào không được sự cho phép bằng văn bản đều bị nghiêm cấm.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">3. Nghĩa vụ của người dùng</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Không sử dụng công cụ của chúng tôi cho các mục đích vi phạm pháp luật.</li>
            <li>Không cố gắng can thiệp, phá hoại hệ thống hoặc phát tán mã độc.</li>
            <li>Chịu hoàn toàn trách nhiệm về nội dung và hành động được thực hiện thông qua tài khoản của bạn.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">4. Giới hạn trách nhiệm</h2>
          <p>
            MMOTools cung cấp các công cụ tiện ích dưới dạng "nguyên trạng". Chúng tôi không chịu trách nhiệm cho bất kỳ tổn thất, thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng hệ thống, bao gồm nhưng không giới hạn ở việc tài khoản bị khóa do lạm dụng tool.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-3">5. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi bảo lưu quyền cập nhật và sửa đổi các điều khoản này vào bất kỳ lúc nào mà không cần thông báo trước. Việc bạn tiếp tục sử dụng dịch vụ sau khi các thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
          </p>
        </section>
      </div>
      
      <div className="mt-12 text-sm text-[var(--color-binance-gray)]/50 text-center">
        Cập nhật lần cuối: Tháng 6 năm 2026
      </div>
    </div>
  );
}
