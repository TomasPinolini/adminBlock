"use client"

export const dynamic = "force-dynamic"

import { TermocopiadoForm } from "@/components/termocopiados/termocopiado-form"
import { TermocopiadoList } from "@/components/termocopiados/termocopiado-list"
import { useTermocopiados } from "@/hooks/use-termocopiados"
import { DollarSign, Hash } from "lucide-react"

export default function TermocopiadosPage() {
  const { data, isLoading } = useTermocopiados()

  const entries = data?.entries ?? []
  const summary = data?.summary ?? { todayCount: 0, todayTotal: "0" }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header with daily summary */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Termocopiados</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Registro rápido de termocopiados
          </p>
        </div>

        {/* Daily stats */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Hoy</p>
              <p className="text-lg font-bold leading-none">{summary.todayCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total hoy</p>
              <p className="text-lg font-bold leading-none">
                ${Number(summary.todayTotal).toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inline form (always visible) */}
      <TermocopiadoForm />

      {/* Recent entries list */}
      <TermocopiadoList entries={entries} isLoading={isLoading} />
    </div>
  )
}
