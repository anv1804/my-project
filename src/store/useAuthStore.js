import { create } from 'zustand';
import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const PROFILE_KEY = 'cached_profile';

const loadCachedProfile = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
};

const saveProfileCache = (profile) => {
  if (typeof window === 'undefined') return;
  if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  else localStorage.removeItem(PROFILE_KEY);
};

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: loadCachedProfile(), // load ngay từ cache, không đợi DB
  session: null,
  isLoading: true,
  isLoginModalOpen: false,
  loginModalMessage: 'Vui lòng đăng nhập để tiếp tục',

  init: () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false });
      return;
    }

    // INITIAL_SESSION fires synchronously on subscription — không cần getSession()
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });

      if (event === 'INITIAL_SESSION') {
        set({ isLoading: false });
        if (session?.user) {
          get().fetchProfile(session.user.id);
          get().subscribeProfile(session.user.id);
        } else {
          saveProfileCache(null);
          set({ profile: null });
        }
        return;
      }

      if (session?.user) {
        get().fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          get().subscribeProfile(session.user.id);
          const name = session.user.user_metadata?.full_name
            || session.user.user_metadata?.display_name
            || session.user.email?.split('@')[0]
            || 'bạn';
          toast.success(`Chào mừng ${name} đã đăng nhập!`);
        }
      } else {
        saveProfileCache(null);
        set({ profile: null });
        get().unsubscribeProfile();
        if (event === 'SIGNED_OUT') toast.success('Đã đăng xuất thành công!');
      }
    });
  },

  subscribeProfile: (userId) => {
    get().unsubscribeProfile();
    const channel = supabase
      .channel(`profile-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        set({ profile: payload.new });
        saveProfileCache(payload.new);
      })
      .subscribe();
    set({ _profileChannel: channel });
  },

  unsubscribeProfile: () => {
    const ch = get()._profileChannel;
    if (ch) { supabase.removeChannel(ch); set({ _profileChannel: null }); }
  },

  fetchProfile: async (userId) => {
    // ensure_user_profile tạo record cho Google OAuth user nếu chưa có
    await supabase.rpc('ensure_user_profile');
    const { data } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url, role, bio, coins, created_at, updated_at')
      .eq('id', userId)
      .single();
    if (data) {
      set({ profile: data });
      saveProfileCache(data);
    }
  },

  signInWithGoogle: async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) throw error;
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUpWithEmail: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    saveProfileCache(null);
    set({ user: null, profile: null, session: null });
  },

  openLoginModal: (message = 'Vui lòng đăng nhập để tiếp tục') =>
    set({ isLoginModalOpen: true, loginModalMessage: message }),

  closeLoginModal: () => set({ isLoginModalOpen: false }),
}));
