import { useAuthStore } from '@/store/useAuthStore';

/** Cập nhật coin trong Zustand store mà không fetch lại DB */
export function setStoreCoins(newBalance) {
  useAuthStore.setState((state) => ({
    profile: state.profile ? { ...state.profile, coins: newBalance } : state.profile,
  }));
}

/** Đồng bộ coin từ DB về store */
export async function syncCoins() {
  const { user, fetchProfile } = useAuthStore.getState();
  if (!user) return null;
  await fetchProfile(user.id);
  return useAuthStore.getState().profile?.coins ?? null;
}

/** Lấy số coin hiện tại từ store (không fetch DB) */
export function getCoins() {
  return useAuthStore.getState().profile?.coins ?? 0;
}
