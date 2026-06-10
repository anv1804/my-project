'use client'

import { useState } from 'react'
import { fetchTikTokVideo } from './actions'
import { Download, Search, Loader2, PlayCircle, Music, Shuffle } from 'lucide-react'

export default function TikTokDownloader() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const res = await fetchTikTokVideo(formData)

    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setResult(res.video)
    }
    
    setLoading(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
      <div className="space-y-8">
        {/* Header section */}
        <div className="flex flex-col gap-2 mb-8 pb-4 border-b border-[var(--color-binance-border)]">
          <h1 className="text-xl sm:text-3xl font-bold text-[var(--color-binance-yellow)] flex items-center gap-2 sm:gap-3">
            <Download size={22} className="shrink-0" />
            Tải Video TikTok / Douyin
          </h1>
          <p className="text-[var(--color-binance-gray)] text-sm sm:text-base">
            Tải video gốc chất lượng cao không chứa logo hay hình mờ (watermark).
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] p-6 sm:p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[var(--color-binance-gray)]" />
              </div>
              <input
                type="url"
                name="url"
                placeholder="Dán đường link TikTok / Douyin vào đây..."
                required
                className="block w-full pl-12 pr-4 py-4 rounded-xl bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] text-[var(--color-binance-light)] placeholder-[var(--color-binance-gray)] focus:outline-none focus:border-[var(--color-binance-yellow)] focus:ring-1 focus:ring-[var(--color-binance-yellow)] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-binance-yellow)] text-black font-bold shadow-[0_4px_14px_rgba(240,185,11,0.2)] hover:bg-[var(--color-binance-yellow-hover)] transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span>{loading ? 'Đang xử lý...' : 'Tải Xuống'}</span>
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <span className="font-bold">Lỗi:</span> {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-yellow)]/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_20px_rgba(240,185,11,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover / Video Preview */}
              <div className="md:w-5/12 relative rounded-xl overflow-hidden border border-[var(--color-binance-border)] bg-black flex items-center justify-center">
                <video 
                  src={result.playUrl} 
                  poster={result.cover}
                  controls
                  className="w-full max-h-[500px] object-contain aspect-[9/16]"
                >
                  Trình duyệt của bạn không hỗ trợ thẻ video.
                </video>
              </div>
              
              {/* Info & Download Links */}
              <div className="md:w-7/12 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-[var(--color-binance-dark)] p-4 rounded-xl border border-[var(--color-binance-border)]">
                    <img 
                      src={result.authorAvatar} 
                      alt={result.author} 
                      className="w-12 h-12 rounded-full border border-[var(--color-binance-border)]"
                    />
                    <div>
                      <p className="font-bold text-[var(--color-binance-light)]">{result.author}</p>
                      <p className="text-xs text-[var(--color-binance-gray)]">TikTok Creator</p>
                    </div>
                  </div>
                  
                  <div className="bg-[var(--color-binance-dark)] p-4 rounded-xl border border-[var(--color-binance-border)]">
                    <p className="text-[var(--color-binance-light)] text-sm leading-relaxed line-clamp-4">
                      {result.title}
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <a
                    href={`/api/download?url=${encodeURIComponent(result.playUrl)}&ext=mp4`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--color-binance-yellow)] text-black font-bold hover:bg-[var(--color-binance-yellow-hover)] transition-colors shadow-lg hover:shadow-[0_0_15px_rgba(240,185,11,0.3)]"
                  >
                    <Download className="w-5 h-5" />
                    Tải Video Trực Tiếp (MP4)
                  </a>
                  
                  {result.musicUrl && (
                    <a
                      href={`/api/download?url=${encodeURIComponent(result.musicUrl)}&ext=mp3`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] text-[var(--color-binance-light)] font-medium hover:bg-[var(--color-binance-border)]/50 transition-colors"
                    >
                      <Music className="w-5 h-5" />
                      Tải Nhạc Nền Trực Tiếp (MP3)
                    </a>
                  )}

                  {/* Nút Flow tiếp theo: Tải & Đổi MD5 cùng lúc */}
                  <div className="pt-4 mt-4 border-t border-[var(--color-binance-border)]">
                    <p className="text-sm text-[var(--color-binance-gray)] mb-3 text-center">Dành cho Reup (Chống quét bản quyền):</p>
                    <a
                      href={`/api/download?url=${encodeURIComponent(result.playUrl)}&ext=mp4&md5=true`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transform hover:scale-[1.02]"
                    >
                      <Shuffle className="w-5 h-5" />
                      Tải Video & Đổi Mã MD5 (Tự động)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
