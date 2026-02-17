"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/ui-store"

export function SearchTrigger() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCommandPaletteOpen(true)}
      className="hidden sm:inline-flex h-9 gap-2 text-muted-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="text-sm">Buscar...</span>
      <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        Ctrl K
      </kbd>
    </Button>
  )
}
