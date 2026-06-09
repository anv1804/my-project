import { create } from 'zustand';
import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isLoginModalOpen: false,
  loginModalMessage: 'Vui lòng đăng nhập để tiếp tục',

  // Khởi tạo — gọi 1 lần khi app mount
  init: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, isLoading: false });
    if (session?.user) {
      get().fetchProfile(session.user.id);
      get().subscribeProfile(session.user.id);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });
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
        set({ profile: null });
        get().unsubscribeProfile();
        if (event === 'SIGNED_OUT') toast.success('Đã đăng xuất thành công!');
      }
    });
  },

  subscribeProfile: (userId) => {
    // Unsubscribe cũ nếu có
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
      })
      .subscribe();
    set({ _profileChannel: channel });
  },

  unsubscribeProfile: () => {
    const ch = get()._profileChannel;
    if (ch) { supabase.removeChannel(ch); set({ _profileChannel: null }); }
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url, role, bio, coins, created_at, updated_at')
      .eq('id', userId)
      .single();
    if (data) set({ profile: data });
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
    set({ user: null, profile: null, session: null });
  },

  openLoginModal: (message = 'Vui lòng đăng nhập để tiếp tục') =>
    set({ isLoginModalOpen: true, loginModalMessage: message }),

  closeLoginModal: () => set({ isLoginModalOpen: false }),
}));
