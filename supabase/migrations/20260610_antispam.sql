-- ============================================================
-- Anti-Spam System Migration
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- 1. Bảng lưu danh sách tài khoản bị khoá tạm thời
CREATE TABLE IF NOT EXISTS public.spam_bans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip            TEXT,
  fingerprint   TEXT,
  browser_ua    TEXT,
  banned_until  TIMESTAMPTZ NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index để check nhanh theo 3 chiều: user, IP, fingerprint
CREATE INDEX IF NOT EXISTS idx_spam_bans_user    ON public.spam_bans (user_id, banned_until);
CREATE INDEX IF NOT EXISTS idx_spam_bans_ip      ON public.spam_bans (ip, banned_until);
CREATE INDEX IF NOT EXISTS idx_spam_bans_fp      ON public.spam_bans (fingerprint, banned_until);

-- RLS: chỉ service_role được đọc/ghi (server-side only)
ALTER TABLE public.spam_bans ENABLE ROW LEVEL SECURITY;

-- Admin (service_role) có full access
CREATE POLICY "service_role full access" ON public.spam_bans
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 2. Hàm tự dọn ban đã hết hạn (tuỳ chọn, dùng với pg_cron)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_bans()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.spam_bans WHERE banned_until < now();
$$;

-- Nếu đã bật pg_cron extension, chạy thêm lệnh này để tự dọn mỗi giờ:
-- SELECT cron.schedule('cleanup-spam-bans', '0 * * * *', 'SELECT public.cleanup_expired_bans()');
