import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the order with client info
    const [orderWithClient] = await db
      .select({
        order: orders,
        clientName: clients.name,
        clientEmail: clients.email,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))

    if (!orderWithClient) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    const order = orderWithClient.order
    const orderPrice = Number(order.price || 0)
    const previousPaid = Number(order.paymentAmount || 0)
    const remainingAmount = orderPrice - previousPaid

    if (remainingAmount <= 0) {
      return NextResponse.json(
        { error: "Este pedido ya esta pagado" },
        { status: 400 }
      )
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      logApiError("/api/orders/[id]/mercadopago", "POST", new Error("MERCADO_PAGO_ACCESS_TOKEN not configured"))
      return NextResponse.json(
        { error: "Mercado Pago no esta configurado" },
        { status: 500 }
      )
    }

    // Build payer info
    const payer: Record<string, string> = {}
    if (orderWithClient.clientName) {
      payer.name = orderWithClient.clientName
    }
    if (orderWithClient.clientEmail) {
      payer.email = orderWithClient.clientEmail
    }

    // Create Mercado Pago checkout preference
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Pedido - ${order.serviceType}`,
            quantity: 1,
            unit_price: remainingAmount,
          },
        ],
        external_reference: order.id,
        payer,
      }),
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text().catch(() => "Unknown error")
      logApiError("/api/orders/[id]/mercadopago", "POST", new Error(`Mercado Pago API error: ${mpResponse.status} - ${errorData}`))
      return NextResponse.json(
        { error: "Error al crear link de pago en Mercado Pago" },
        { status: 502 }
      )
    }

    const mpData = await mpResponse.json()

    return NextResponse.json({
      init_point: mpData.init_point,
      amount: remainingAmount,
    })
  } catch (error) {
    logApiError("/api/orders/[id]/mercadopago", "POST", error)
    return NextResponse.json(
      { error: "Error al generar link de pago" },
      { status: 500 }
    )
  }
}
