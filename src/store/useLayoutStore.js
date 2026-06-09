import { create } from 'zustand';

export const useLayoutStore = create((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ isSidebarCollapsed: val }),

  isCoinModalOpen: false,
  openCoinModal: () => set({ isCoinModalOpen: true }),
  closeCoinModal: () => set({ isCoinModalOpen: false }),
}));
