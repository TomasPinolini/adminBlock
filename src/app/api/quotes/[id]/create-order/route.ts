import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { quotes, quoteMaterials, orders, orderMaterials, clients, services } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"
import { isEmailAutoEnabled } from "@/lib/settings"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the quote
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1)

    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      )
    }

    if (quote.orderId) {
      return NextResponse.json(
        { error: "Esta cotización ya tiene un pedido asociado" },
        { status: 400 }
      )
    }

    if (!quote.clientId) {
      return NextResponse.json(
        { error: "La cotización debe tener un cliente para crear un pedido" },
        { status: 400 }
      )
    }

    // Get quote materials
    const qMaterials = await db
      .select()
      .from(quoteMaterials)
      .where(eq(quoteMaterials.quoteId, id))

    // Create the order
    const [newOrder] = await db
      .insert(orders)
      .values({
        clientId: quote.clientId,
        serviceType: quote.serviceType || "copiado",
        status: "quoted" as const,
        description: quote.description,
        price: quote.totalPrice,
      })
      .returning()

    // Copy line items to order
    if (qMaterials.length > 0) {
      await db.insert(orderMaterials).values(
        qMaterials.map((m) => ({
          orderId: newOrder.id,
          lineType: m.lineType || "material",
          materialId: m.materialId,
          description: m.description,
          supplierId: m.supplierId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          subtotal: m.subtotal,
        }))
      )
    }

    // Update quote with order reference
    await db
      .update(quotes)
      .set({
        orderId: newOrder.id,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id))

    // Send quote email if auto email for quoted is enabled
    if (quote.clientId && quote.totalPrice) {
      try {
        const [client] = await db.select({ name: clients.name, email: clients.email }).from(clients).where(eq(clients.id, quote.clientId)).limit(1)
        if (client?.email) {
          const isEnabled = await isEmailAutoEnabled("quoted")
          if (isEnabled) {
            const [svc] = await db.select({ displayName: services.displayName }).from(services).where(eq(services.name, newOrder.serviceType)).limit(1)
            const serviceLabel = svc?.displayName || newOrder.serviceType
            const clientName = client.name || "Cliente"
            const priceStr = Number(quote.totalPrice).toLocaleString("es-AR")

            const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`
            fetch(edgeFnUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                to: client.email,
                subject: `Cotización ${serviceLabel} - AdminBlock`,
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>¡Hola ${clientName}!</h2><p>La cotización para <strong>${serviceLabel.toLowerCase()}</strong> es de:</p><p style="font-size:28px;font-weight:bold;text-align:center;margin:20px 0">$${priceStr}</p><p>Avisame si querés que avancemos.</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"/><p style="font-size:12px;color:#999">AdminBlock</p></div>`,
              }),
            }).then(async (res) => {
              if (!res.ok) {
                const body = await res.json().catch(() => null)
                console.error("[EMAIL] Quote email error:", res.status, body)
              } else {
                console.log("[EMAIL] Quote email sent to", client.email)
              }
            }).catch((err) => console.error("[EMAIL] Quote email exception:", err))
          }
        }
      } catch (emailErr) {
        console.error("[EMAIL] Failed to send quote email:", emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
    })
  } catch (error) {
    logApiError("/api/quotes/[id]/create-order", "POST", error)
    return NextResponse.json(
      { error: "Error al crear pedido desde cotización" },
      { status: 500 }
    )
  }
}
