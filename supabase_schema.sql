-- ================================================================
-- AnvTools — Users Table + Roles
-- Chạy trong Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Tạo enum cho role người dùng
CREATE TYPE user_role AS ENUM ('user', 'pro', 'admin');

-- 2. Bảng users mở rộng từ auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  role         user_role NOT NULL DEFAULT 'user',
  bio          TEXT,
  coins        BIGINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Trigger tự động tạo user record khi đăng ký (Google/Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at   = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Bật Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Ai cũng đọc được thông tin cơ bản
CREATE POLICY "Public read users"
  ON public.users FOR SELECT
  USING (true);

-- Chỉ tự mình mới sửa thông tin của mình
CREATE POLICY "User can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Admin có thể xem và sửa tất cả
CREATE POLICY "Admin full access"
  ON public.users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- 7. Grant quyền cho anon và authenticated roles
GRANT SELECT ON public.users TO anon, authenticated;
GRANT UPDATE (display_name, avatar_url, bio) ON public.users TO authenticated;

-- ================================================================
-- Migration: thêm cột coins (chạy nếu bảng đã tồn tại)
-- ================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coins BIGINT NOT NULL DEFAULT 0;

-- ================================================================
-- RPC functions: trừ/hoàn coin atomic
-- Chạy trong Supabase Dashboard → SQL Editor
-- ================================================================

-- Trừ coin: atomic, không cho âm. Trả về {success, coins} hoặc {success:false, message}
CREATE OR REPLACE FUNCTION deduct_coins(p_user_id UUID, p_amount BIGINT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_coins BIGINT;
BEGIN
  UPDATE public.users
  SET coins = coins - p_amount
  WHERE id = p_user_id AND coins >= p_amount
  RETURNING coins INTO v_coins;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Không đủ coin');
  END IF;

  RETURN json_build_object('success', true, 'coins', v_coins);
END; $$;

-- Hoàn coin: cộng trực tiếp. Trả về {success, coins}
CREATE OR REPLACE FUNCTION add_coins(p_user_id UUID, p_amount BIGINT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_coins BIGINT;
BEGIN
  UPDATE public.users
  SET coins = coins + p_amount
  WHERE id = p_user_id
  RETURNING coins INTO v_coins;

  RETURN json_build_object('success', true, 'coins', v_coins);
END; $$;

-- 8. Bảng forum_posts (nếu chưa có)
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL CHECK (char_length(title) >= 5),
  content      TEXT NOT NULL CHECK (char_length(content) >= 10),
  likes_count  INT DEFAULT 0 NOT NULL,
  views_count  INT DEFAULT 0 NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read forum_posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Auth users can insert posts" ON public.forum_posts FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY "Authors can update own posts" ON public.forum_posts FOR UPDATE
  TO authenticated USING ((SELECT auth.uid()) = author_id) WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY "Authors can delete own posts" ON public.forum_posts FOR DELETE
  TO authenticated USING ((SELECT auth.uid()) = author_id);

GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;

-- Bật Realtime cho Forum
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;

-- ================================================================
-- Bảng coin_transactions: theo dõi lịch sử nạp coin qua VietQR
-- Chạy trong Supabase Dashboard → SQL Editor
-- ================================================================
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount       BIGINT NOT NULL CHECK (amount >= 10000),
  reference    TEXT UNIQUE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Người dùng chỉ xem giao dịch của mình
CREATE POLICY "Users can view own coin transactions"
  ON public.coin_transactions FOR SELECT
  TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Người dùng tạo đơn nạp của mình
CREATE POLICY "Users can insert own coin transactions"
  ON public.coin_transactions FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- Bật Realtime để frontend nhận cập nhật tức thì
ALTER PUBLICATION supabase_realtime ADD TABLE public.coin_transactions;

-- ================================================================
-- RPC: hoàn tất giao dịch nạp coin (gọi từ SePay webhook)
-- SECURITY DEFINER → bỏ qua RLS, chạy với quyền postgres
-- ================================================================
CREATE OR REPLACE FUNCTION complete_coin_transaction(p_reference TEXT, p_transfer_amount BIGINT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_coins   BIGINT;
BEGIN
  -- Tìm giao dịch pending với reference khớp
  SELECT user_id INTO v_user_id
  FROM public.coin_transactions
  WHERE reference = p_reference AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Không tìm thấy giao dịch pending');
  END IF;

  -- Đánh dấu hoàn tất
  UPDATE public.coin_transactions
  SET status = 'completed', completed_at = now()
  WHERE reference = p_reference;

  -- Cộng coin theo số tiền thực nhận
  UPDATE public.users
  SET coins = coins + p_transfer_amount
  WHERE id = v_user_id
  RETURNING coins INTO v_coins;

  RETURN json_build_object('success', true, 'user_id', v_user_id, 'coins', v_coins);
END; $$;

-- Cho phép anon role gọi hàm này (bảo mật ở tầng ứng dụng qua SEPAY_WEBHOOK_SECRET)
GRANT EXECUTE ON FUNCTION complete_coin_transaction(TEXT, BIGINT) TO anon, authenticated;

-- ================================================================
-- Kiểm tra kết quả
-- ================================================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
