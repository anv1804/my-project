'use server'

export async function fetchTikTokVideo(formData) {
  const url = formData.get('url')
  if (!url) return { error: 'Vui lòng nhập đường dẫn TikTok / Douyin' }

  try {
    // Sử dụng API miễn phí từ tikwm.com để get video no watermark
    // Chú ý: Đây là API bên thứ 3, dùng cho mục đích demo/cá nhân rất tốt
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        url: url,
        hd: '1' // Lấy video HD nếu có
      })
    })

    const data = await res.json()

    if (data.code === 0) {
      const baseUrl = 'https://www.tikwm.com';
      const makeAbsolute = (url) => {
        if (!url) return url;
        if (url.startsWith('//')) return 'https:' + url;
        if (url.startsWith('/')) return baseUrl + url;
        return url;
      };

      return {
        success: true,
        video: {
          title: data.data.title,
          cover: makeAbsolute(data.data.cover),
          author: data.data.author?.nickname,
          authorAvatar: makeAbsolute(data.data.author?.avatar),
          playUrl: makeAbsolute(data.data.play || data.data.hdplay), // Ưu tiên bản thường (H.264) để tránh lỗi đen màn hình trên web
          musicUrl: makeAbsolute(data.data.music),
        }
      }
    } else {
      return { error: data.msg || 'Không thể lấy thông tin video. Vui lòng kiểm tra lại URL.' }
    }
  } catch (error) {
    return { error: 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.' }
  }
}
