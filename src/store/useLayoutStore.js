import { create } from 'zustand';

export const useLayoutStore = create((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ isSidebarCollapsed: val }),

  isMobileMenuOpen: false,
  setMobileMenuOpen: (val) => set({ isMobileMenuOpen: val }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  isCoinModalOpen: false,
  openCoinModal: () => set({ isCoinModalOpen: true }),
  closeCoinModal: () => set({ isCoinModalOpen: false }),
}));
