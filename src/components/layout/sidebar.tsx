"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Calculator,
  FileBarChart,
  Settings as SettingsIcon,
  BookCopy,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    mobileLabel: "Inicio",
    icon: LayoutDashboard,
    showOnMobile: true,
  },
  {
    href: "/orders",
    label: "Pedidos",
    icon: ClipboardList,
    showOnMobile: true,
  },
  {
    href: "/termocopiados",
    label: "Termocopiados",
    mobileLabel: "Termo",
    icon: BookCopy,
    showOnMobile: true,
  },
  {
    href: "/clients",
    label: "Directorio",
    mobileLabel: "Clientes",
    icon: Users,
    showOnMobile: true,
  },
  {
    href: "/quotes",
    label: "Cotizador",
    mobileLabel: "Cotizar",
    icon: Calculator,
    showOnMobile: true,
  },
  {
    href: "/calendar",
    label: "Calendario",
    icon: CalendarDays,
    showOnMobile: false,
  },
  {
    href: "/reports",
    label: "Reportes",
    icon: FileBarChart,
    showOnMobile: false,
  },
  {
    href: "/settings",
    label: "Ajustes",
    icon: SettingsIcon,
    showOnMobile: false,
  },
]

// Desktop sidebar - collapsed (icons only), expands on hover
export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Spacer — reserves the collapsed width in the flex layout */}
      <div className="hidden lg:block w-16 shrink-0" />

      {/* Actual sidebar — positioned over content so it doesn't push layout */}
      <aside className="group/sidebar hidden lg:flex fixed inset-y-0 left-0 z-40 w-16 hover:w-64 flex-col border-r bg-background transition-[width] duration-200 ease-in-out overflow-hidden">
        {/* Header */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Block" className="h-8 shrink-0" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 group-hover/sidebar:p-4 transition-[padding] duration-200">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
            AdminBlock v0.1.0
          </p>
        </div>
      </aside>
    </>
  )
}

// Mobile bottom navigation - visible only on mobile
export function MobileNav() {
  const pathname = usePathname()
  const mobileItems = navItems.filter((item) => item.showOnMobile)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {mobileItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "text-primary")} />
              <span>{item.mobileLabel || item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
