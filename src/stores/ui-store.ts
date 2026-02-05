import { create } from "zustand"
import { OrderStatus, ServiceType, Client } from "@/lib/db/schema"

export type QuickFilter = "overdue" | "due_today" | null

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Orders filters
  statusFilter: OrderStatus | "all"
  serviceFilter: ServiceType | "all"
  quickFilter: QuickFilter
  setStatusFilter: (status: OrderStatus | "all") => void
  setServiceFilter: (service: ServiceType | "all") => void
  setQuickFilter: (filter: QuickFilter) => void
  resetFilters: () => void

  // Modals
  createOrderModalOpen: boolean
  setCreateOrderModalOpen: (open: boolean) => void
  createClientModalOpen: boolean
  setCreateClientModalOpen: (open: boolean) => void
  editingClient: Client | null
  setEditingClient: (client: Client | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Orders filters
  statusFilter: "all",
  serviceFilter: "all",
  quickFilter: null,
  setStatusFilter: (status) => set({ statusFilter: status, quickFilter: null }),
  setServiceFilter: (service) => set({ serviceFilter: service }),
  setQuickFilter: (filter) => set({ quickFilter: filter, statusFilter: "all" }),
  resetFilters: () => set({ statusFilter: "all", serviceFilter: "all", quickFilter: null }),

  // Modals
  createOrderModalOpen: false,
  setCreateOrderModalOpen: (open) => set({ createOrderModalOpen: open }),
  createClientModalOpen: false,
  setCreateClientModalOpen: (open) => set({ createClientModalOpen: open }),
  editingClient: null,
  setEditingClient: (client) => set({ editingClient: client, createClientModalOpen: client !== null }),
}))
