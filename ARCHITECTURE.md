# Kiến Trúc Dự Án (AI Context)
*File này được tạo ra để các AI Agent (như Cursor, Copilot, Windsurf...) đọc và hiểu toàn bộ dự án chỉ trong 1 lần quét, giúp tiết kiệm Token và tránh tình trạng AI quên ngữ cảnh.*

## 1. Thông Tin Chung
- **Dự án:** MMO Tools Hub (Nền tảng cung cụ dành cho dân MMO/Affiliate)
- **Mục tiêu:** Cung cấp công cụ tải video không logo (TikTok/Douyin), dịch thuật, và dịch vụ thiết kế Landing Page.
- **Tech Stack:** 
  - Framework: Next.js 15 (App Router)
  - Styling: Tailwind CSS v4
  - Database & Auth: Supabase (PostgreSQL)
  - UI Pattern: Atomic Design

## 2. Design System (Binance Theme)
- Các biến màu được định nghĩa tại `src/app/globals.css`.
- **Màu chủ đạo:** Vàng Binance (`--color-binance-yellow`: `#F0B90B`).
- **Nền:** Đen/Xám đậm (`--color-binance-darker`: `#0B0E11`).
- **Nguyên tắc UI:** Sang trọng, tối màu, nút bấm call-to-action (CTA) phải màu vàng rực rỡ để kích thích click.

## 3. Cấu Trúc Thư Mục (src/)
- `/app`: Chứa các trang (pages) và API (Back-end ẩn API key).
- `/components`: Được chia theo Atomic Design để tái sử dụng.
  - `/common`: Components nguyên tử (Button, Input, Card).
  - `/layout`: Các phần chung (Header, Footer).
  - `/features`: Các khối logic phức tạp (VD: Form tải video).
- `/lib`: Khởi tạo thư viện bên thứ 3 (Supabase client).
- `/utils`: Các hàm dùng chung (như `cn` để gom class Tailwind).

## 4. Nguyên Tắc Code (Coding Rules)
- Luôn sử dụng Tailwind để style, không viết CSS tay trừ khi làm hiệu ứng phức tạp.
- Components dùng chung phải đặt trong `src/components/common` và phải dễ dàng cấu hình qua `props`.
- API gọi ra bên ngoài (như TikAPI tải video) BẮT BUỘC phải đi qua `src/app/api/...` để không lộ API Key xuống client.
- Lấy dữ liệu hoặc Auth luôn sử dụng Supabase Client từ `src/lib/supabase.js`.
