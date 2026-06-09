import { Download, Settings, Sparkles, Type, Hash, Shuffle, Mic, Bot, Users, MessageSquare, Info, PhoneCall, History } from "lucide-react";

export const TiktokIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
);

export const FacebookIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const MENU_GROUPS = [
  {
    id: "tiktok",
    title: "Công cụ TikTok",
    icon: TiktokIcon,
    href: "/tiktok",
    iconHoverClass: "group-hover:text-[var(--color-binance-light)]",
    items: [
      { 
        id: "downloader", type: "link", href: "/tiktok-downloader", icon: Download, label: "Tải Video",
        desc: "Tải video TikTok không logo nguyên bản",
        details: {
          what: "Công cụ cho phép bạn tải bất kỳ video TikTok nào về máy mà không bị dính Watermark (logo TikTok và ID người dùng).",
          how: "Sử dụng API chất lượng cao để bóc tách luồng video gốc trực tiếp từ máy chủ TikTok.",
          guide: "Chỉ cần dán đường link video vào ô trống và nhấn 'Tải về'. File MP4 sẽ được tải xuống với chất lượng cao nhất."
        }
      },
      { 
        id: "md5", type: "link", href: "/md5-changer", icon: Shuffle, label: "Đổi mã MD5 (Lách Reup)",
        desc: "Lách bản quyền thuật toán TikTok",
        details: {
          what: "Làm mới mã Hash MD5 của file video. Máy chủ TikTok sẽ nhận diện đây là một video hoàn toàn mới 100%.",
          how: "Công cụ tự động thêm vài byte rác ngẫu nhiên (không ảnh hưởng tới video) vào cuối file để thay đổi cấu trúc mã hóa gốc.",
          guide: "Kéo thả file video đã tải vào khung, nhấn 'Bắt đầu đổi mã' và tải file an toàn về."
        }
      },
      { 
        id: "title", type: "link", href: "/tiktok-title", icon: Sparkles, label: "Gợi ý Tiêu đề (Viral)",
        desc: "Phân tích và gợi ý tiêu đề bắt trend",
        details: {
          what: "Hệ thống AI tự động phân tích và đưa ra các mẫu tiêu đề giật tít, thu hút người xem nhất.",
          how: "Thu thập dữ liệu từ các video xu hướng hiện tại và kết hợp với các từ khóa bùng nổ (Hook words).",
          guide: "Nhập chủ đề video của bạn, AI sẽ tạo ra hàng chục mẫu tiêu đề để bạn tha hồ lựa chọn."
        }
      },
      { 
        id: "hashtag", type: "link", href: "/tiktok-hashtag", icon: Hash, label: "Sinh Hashtag TikTok",
        desc: "Tối ưu hóa khả năng phân phối (SEO)",
        details: {
          what: "Tạo danh sách các Hashtag đang thịnh hành và phù hợp nhất với ngách nội dung của bạn.",
          how: "Sử dụng cơ sở dữ liệu Hashtag được cập nhật liên tục từ các trend TikTok toàn cầu.",
          guide: "Nhập một vài từ khóa chính, hệ thống sẽ đề xuất cụm Hashtag hoàn hảo để copy & paste."
        }
      },
      { 
        id: "report", type: "action", actionId: "history", icon: Settings, label: "Lịch sử tạo", isPro: true,
        desc: "Lưu trữ và xuất báo cáo luồng",
        details: {
          what: "Theo dõi toàn bộ lịch sử các tác vụ bạn đã thực hiện trên hệ thống và xuất báo cáo tổng hợp.",
          how: "Dữ liệu được lưu trữ an toàn trên Cloud dành riêng cho tài khoản PRO.",
          guide: "Cần nâng cấp lên PRO và Đăng nhập để sử dụng tính năng xem và xuất lịch sử hoạt động."
        }
      }
    ]
  },
  {
    id: "otp",
    title: "Dịch vụ SIM & OTP",
    icon: PhoneCall,
    iconHoverClass: "group-hover:text-orange-400",
    items: [
      { 
        id: "thue-otp", type: "link", href: "/thue-otp", icon: PhoneCall, label: "Thuê Số Nhận OTP",
        desc: "Thuê số điện thoại ảo nhận OTP tự động",
        details: {
          what: "Dịch vụ thuê số điện thoại Việt Nam & Lào ảo để nhận tin nhắn SMS chứa mã xác nhận đăng ký tài khoản.",
          how: "Kết nối trực tiếp tới cổng API ViOTP để cấp số ngẫu nhiên hoặc theo đầu số mong muốn.",
          guide: "Chọn Quốc gia, chọn dịch vụ cần thuê, nhấp 'Thuê Số'. Điền số nhận được vào ứng dụng cần đăng ký và đợi mã OTP hiển thị tại danh sách bên dưới."
        }
      },
      {
        id: "otp-history", type: "link", href: "/thue-otp/lich-su", icon: History, label: "Lịch Sử Thuê Số",
        desc: "Tra cứu lịch sử thuê số ảo và tin nhắn",
        details: {
          what: "Bảng quản lý, lọc và xuất lịch sử các phiên thuê số nhận OTP trong tuần qua.",
          how: "Truy vấn từ kho dữ liệu ViOTP dựa trên ngày tháng, dịch vụ và trạng thái.",
          guide: "Nhập khoảng ngày cần tra cứu, chọn Dịch vụ và Trạng thái, sau đó nhấn 'Tìm'. Bạn có thể xuất báo cáo dạng Excel/CSV bằng nút màu xanh lá."
        }
      }
    ]
  },
  {
    id: "facebook",
    title: "Công cụ Facebook",
    icon: FacebookIcon,
    iconHoverClass: "group-hover:text-[#1877F2]",
    items: [
      { type: "link", href: "/fb-formatter", icon: Type, label: "Format Chữ Đậm" }
    ]
  },
  {
    id: "ai",
    title: "Công cụ Trí Tuệ Nhân Tạo",
    icon: Bot,
    iconHoverClass: "group-hover:text-[#10b981]",
    items: [
      { 
        id: "tts", type: "link", href: "/tiktok-tts", icon: Mic, label: "Tạo Giọng Nói AI",
        desc: "Chuyển văn bản thành giọng đọc tự nhiên",
        details: {
          what: "Chuyển đổi văn bản thành giọng nói AI tự nhiên, chuẩn giọng Review/Tâm sự.",
          how: "Sử dụng công nghệ Text-to-Speech tiên tiến, hỗ trợ điều chỉnh tốc độ và tải file gốc MP3.",
          guide: "Nhập văn bản, chọn giọng đọc, ấn Nghe Thử để kiểm tra và sau đó Xuất File MP3."
        }
      }
    ]
  },
  {
    id: "community",
    title: "Cộng đồng",
    icon: Users,
    iconHoverClass: "group-hover:text-blue-400",
    items: [
      { 
        id: "forum", type: "link", href: "/dien-dan", icon: MessageSquare, label: "Diễn đàn trao đổi",
        desc: "Không gian giao lưu, chia sẻ kinh nghiệm",
        details: {
          what: "Nơi cộng đồng người dùng chia sẻ mẹo làm video, kịch bản hay và cùng nhau giải đáp thắc mắc.",
          how: "Diễn đàn cho phép đăng bài viết mới, bình luận và thả tim các bài viết hữu ích.",
          guide: "Truy cập diễn đàn, lướt đọc các chủ đề hoặc nhấn 'Đăng bài mới' để chia sẻ câu chuyện của bạn."
        }
      }
    ]
  },
  {
    id: "support",
    title: "Thông tin & Hỗ trợ",
    icon: Info,
    iconHoverClass: "group-hover:text-[var(--color-binance-yellow)]",
    items: [
      { 
        id: "profile", type: "link", href: "/ho-tro", icon: PhoneCall, label: "Hỗ trợ - Thông tin của tôi",
        desc: "Thông tin tác giả và liên hệ",
        details: {
          what: "Trang hồ sơ cá nhân và các phương thức liên hệ trực tiếp.",
          how: "Cung cấp Zalo, Telegram để hỗ trợ giải đáp thắc mắc và sử dụng công cụ.",
          guide: "Truy cập để xem thông tin và liên hệ khi cần."
        }
      }
    ]
  }
];
