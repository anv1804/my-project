import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const ext = searchParams.get('ext') || 'mp4'
  const modifyMd5 = searchParams.get('md5') === 'true'
  
  if (!url) {
    return new NextResponse('Thiếu tham số URL', { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5'
      }
    })
    
    if (!response.ok) {
      return new NextResponse('Lỗi khi tải file', { status: response.status })
    }

    let body = response.body;

    // Tính năng: Đổi mã MD5 on-the-fly (chỉ áp dụng cho MP4)
    if (modifyMd5 && ext === 'mp4') {
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
        flush(controller) {
          // Chèn 16 byte ngẫu nhiên vào cuối file. Định dạng MP4 sẽ bỏ qua các byte rác ở cuối,
          // nhưng toàn bộ cấu trúc mã Hash MD5 của file sẽ bị thay đổi hoàn toàn!
          const randomBytes = new Uint8Array(16);
          crypto.getRandomValues(randomBytes);
          controller.enqueue(randomBytes);
        }
      });
      body = body.pipeThrough(transformStream);
    }

    // Đặt tên file ngẫu nhiên dựa trên thời gian
    const filename = `anvtools_${Date.now()}.${ext}`

    return new NextResponse(body, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': response.headers.get('content-type') || (ext === 'mp3' ? 'audio/mpeg' : 'video/mp4'),
      },
    })
  } catch (error) {
    return new NextResponse('Lỗi máy chủ', { status: 500 })
  }
}
