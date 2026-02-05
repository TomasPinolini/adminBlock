import { create } from "zustand"
import { OrderStatus, ServiceType } from "@/lib/db/schema"

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Orders filters
  statusFilter: OrderStatus | "all"
  serviceFilter: ServiceType | "all"
  setStatusFilter: (status: OrderStatus | "all") => void
  setServiceFilter: (service: ServiceType | "all") => void
  resetFilters: () => void

  // Modals
  createOrderModalOpen: boolean
  setCreateOrderModalOpen: (open: boolean) => void
  createClientModalOpen: boolean
  setCreateClientModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Orders filters
  statusFilter: "all",
  serviceFilter: "all",
  setStatusFilter: (status) => set({ statusFilter: status }),
  setServiceFilter: (service) => set({ serviceFilter: service }),
  resetFilters: () => set({ statusFilter: "all", serviceFilter: "all" }),

  // Modals
  createOrderModalOpen: false,
  setCreateOrderModalOpen: (open) => set({ createOrderModalOpen: open }),
  createClientModalOpen: false,
  setCreateClientModalOpen: (open) => set({ createClientModalOpen: open }),
}))
