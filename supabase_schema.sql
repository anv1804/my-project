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

-- 8. Bảng otp_rentals — lưu lịch sử thuê số của từng user
CREATE TABLE IF NOT EXISTS public.otp_rentals (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  request_id   TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  service_id   INT,
  service_name TEXT,
  country      TEXT,
  coin_cost    INT DEFAULT 0,
  status       SMALLINT DEFAULT 0, -- 0=chờ, 1=thành công, 2=hết hạn
  code         TEXT,
  sms_content  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.otp_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rentals"   ON public.otp_rentals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own rentals" ON public.otp_rentals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rentals" ON public.otp_rentals FOR UPDATE USING (auth.uid() = user_id);

-- 9. Bảng forum_posts (nếu chưa có)
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
GRANT EXECUTE ON FUNCTION public.deduct_coins(UUID, BIGINT) TO authenticated;
-- add_coins và complete_coin_transaction KHÔNG expose ra client — chỉ gọi qua service_role

-- ================================================================
-- SECURITY MIGRATION — Chạy trong Supabase Dashboard → SQL Editor
-- ================================================================

-- [CRITICAL] Thu hồi quyền gọi trực tiếp từ client
REVOKE EXECUTE ON FUNCTION public.add_coins(UUID, BIGINT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.add_coins(UUID, BIGINT) FROM anon;
REVOKE EXECUTE ON FUNCTION complete_coin_transaction(TEXT, BIGINT) FROM anon;
REVOKE EXECUTE ON FUNCTION complete_coin_transaction(TEXT, BIGINT) FROM authenticated;

-- [CRITICAL] Sửa complete_coin_transaction — atomic + dùng amount từ DB
CREATE OR REPLACE FUNCTION complete_coin_transaction(p_reference TEXT, p_transfer_amount BIGINT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_amount  BIGINT;
  v_coins   BIGINT;
BEGIN
  IF p_transfer_amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Số tiền không hợp lệ');
  END IF;

  -- Atomic: chỉ xử lý nếu status='pending' và chưa hết hạn
  UPDATE public.coin_transactions
  SET status = 'completed', completed_at = now()
  WHERE reference = p_reference
    AND status = 'pending'
    AND expires_at > now()
  RETURNING user_id, amount INTO v_user_id, v_amount;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Giao dịch không tồn tại, đã xử lý, hoặc hết hạn');
  END IF;

  -- Cộng theo amount đã lưu trong DB — không tin p_transfer_amount từ caller
  UPDATE public.users
  SET coins = coins + v_amount
  WHERE id = v_user_id
  RETURNING coins INTO v_coins;

  RETURN json_build_object('success', true, 'user_id', v_user_id, 'coins', v_coins, 'coins_added', v_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [CRITICAL] Thêm validation p_amount > 0 và kiểm tra caller vào deduct_coins
CREATE OR REPLACE FUNCTION public.deduct_coins(p_user_id UUID, p_amount BIGINT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_coins BIGINT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Số coin không hợp lệ');
  END IF;
  -- Chỉ cho phép user trừ coin của chính mình
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Không có quyền');
  END IF;

  UPDATE public.users
  SET coins = coins - p_amount
  WHERE id = p_user_id AND coins >= p_amount
  RETURNING coins INTO v_coins;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Không đủ coin');
  END IF;
  RETURN json_build_object('success', true, 'coins', v_coins);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [CRITICAL] Thêm validation vào add_coins + block gọi từ client
CREATE OR REPLACE FUNCTION public.add_coins(p_user_id UUID, p_amount BIGINT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_coins BIGINT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Số coin không hợp lệ');
  END IF;
  -- Hàm này chỉ được gọi từ service_role (webhook, server refund)
  -- auth.uid() IS NOT NULL nghĩa là đang có user session → reject
  IF auth.uid() IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  UPDATE public.users
  SET coins = coins + p_amount
  WHERE id = p_user_id
  RETURNING coins INTO v_coins;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Không tìm thấy user');
  END IF;
  RETURN json_build_object('success', true, 'coins', v_coins);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [HIGH] Thêm constraint chống coin âm
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS users_coins_non_negative CHECK (coins >= 0);

-- [HIGH] Thêm cột refunded vào otp_rentals (nếu chưa có)
ALTER TABLE public.otp_rentals ADD COLUMN IF NOT EXISTS refunded BOOLEAN NOT NULL DEFAULT false;

-- [MEDIUM] Index tối ưu query
CREATE INDEX IF NOT EXISTS idx_otp_rentals_user_status ON public.otp_rentals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_otp_rentals_user_phone ON public.otp_rentals(user_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_reference ON public.coin_transactions(reference, status);

-- ================================================================
-- Bảng smm_orders — lưu lịch sử đơn hàng SMM từ trumlike.vip
-- ================================================================
CREATE TABLE IF NOT EXISTS public.smm_orders (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  order_id     BIGINT, -- ID đơn hàng nhận từ trumlike.vip
  service_id   INT NOT NULL,
  service_name TEXT NOT NULL,
  platform     TEXT,
  category     TEXT,
  link         TEXT NOT NULL,
  quantity     INT NOT NULL,
  coin_cost    BIGINT NOT NULL,
  charge       TEXT, -- Chi phí thực tế trả cho trumlike (để theo dõi lợi nhuận)
  status       TEXT NOT NULL DEFAULT 'Pending', -- Pending, In progress, Completed, Canceled, Partial, etc.
  start_count  INT DEFAULT 0,
  remains      INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.smm_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own smm_orders"   ON public.smm_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own smm_orders" ON public.smm_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own smm_orders" ON public.smm_orders FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_smm_orders_user_status ON public.smm_orders(user_id, status);

-- ================================================================
-- Kiểm tra kết quả
-- ================================================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
