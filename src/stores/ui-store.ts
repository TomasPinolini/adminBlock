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
  showArchived: boolean
  setStatusFilter: (status: OrderStatus | "all") => void
  setServiceFilter: (service: ServiceType | "all") => void
  setQuickFilter: (filter: QuickFilter) => void
  setShowArchived: (show: boolean) => void
  resetFilters: () => void

  // Modals
  createOrderModalOpen: boolean
  setCreateOrderModalOpen: (open: boolean) => void
  createClientModalOpen: boolean
  setCreateClientModalOpen: (open: boolean) => void
  editingClient: Client | null
  setEditingClient: (client: Client | null) => void
  viewingClientOrders: Client | null
  setViewingClientOrders: (client: Client | null) => void
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
  showArchived: false,
  setStatusFilter: (status) => set({ statusFilter: status, quickFilter: null }),
  setServiceFilter: (service) => set({ serviceFilter: service }),
  setQuickFilter: (filter) => set({ quickFilter: filter, statusFilter: "all" }),
  setShowArchived: (show) => set({ showArchived: show }),
  resetFilters: () => set({ statusFilter: "all", serviceFilter: "all", quickFilter: null, showArchived: false }),

  // Modals
  createOrderModalOpen: false,
  setCreateOrderModalOpen: (open) => set({ createOrderModalOpen: open }),
  createClientModalOpen: false,
  setCreateClientModalOpen: (open) => set({ createClientModalOpen: open }),
  editingClient: null,
  setEditingClient: (client) => set({ editingClient: client, createClientModalOpen: client !== null }),
  viewingClientOrders: null,
  setViewingClientOrders: (client) => set({ viewingClientOrders: client }),
}))
