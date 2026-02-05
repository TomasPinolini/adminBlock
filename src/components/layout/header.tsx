"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function Header() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex h-14 lg:h-16 items-center justify-between border-b bg-background px-4">
      {/* Mobile title */}
      <h1 className="text-lg font-bold lg:hidden">AdminBlock</h1>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="h-9 px-3"
      >
        <LogOut className="h-4 w-4 lg:mr-2" />
        <span className="hidden lg:inline">Salir</span>
      </Button>
    </header>
  )
}
