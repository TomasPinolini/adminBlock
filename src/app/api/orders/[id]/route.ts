import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients, orderComments, services } from "@/lib/db/schema"
import { updateOrderSchema } from "@/lib/validations/orders"
import { eq, desc } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppBackground, whatsappTemplates } from "@/lib/whatsapp"
import { isWhatsAppAutoEnabled, isEmailAutoEnabled } from "@/lib/settings"
import { logApiError } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [order] = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        serviceType: orders.serviceType,
        status: orders.status,
        description: orders.description,
        price: orders.price,
        dueDate: orders.dueDate,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          phone: clients.phone,
          email: clients.email,
          cuit: clients.cuit,
        },
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Get comments
    const comments = await db
      .select()
      .from(orderComments)
      .where(eq(orderComments.orderId, id))
      .orderBy(desc(orderComments.createdAt))

    return NextResponse.json({ ...order, comments })
  } catch (error) {
    logApiError("/api/orders/[id]", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener pedido" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateOrderSchema.parse(body)

    // Get current order with client info to check for status change
    const [currentOrderWithClient] = await db
      .select({
        order: orders,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))

    const currentOrder = currentOrderWithClient?.order

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [updatedOrder] = await db
      .update(orders)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Log activity - check if it was a status change
    const isStatusChange = validated.status && currentOrder?.status !== validated.status
    await logActivity({
      type: isStatusChange ? "order_status_changed" : "order_updated",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: isStatusChange
        ? `Estado cambiado: ${currentOrder?.status} → ${validated.status}`
        : "Pedido actualizado",
      metadata: isStatusChange
        ? { from: currentOrder?.status, to: validated.status }
        : validated,
    })

    // Send WhatsApp notification for specific status changes
    if (isStatusChange && currentOrderWithClient?.clientPhone) {
      const clientName = currentOrderWithClient.clientName || "Cliente"
      // Look up display name from services table
      const [svc] = await db.select({ displayName: services.displayName }).from(services).where(eq(services.name, updatedOrder.serviceType)).limit(1)
      const serviceLabel = svc?.displayName || updatedOrder.serviceType
      const notifyStatuses = ["ready", "quoted", "in_progress"]

      if (notifyStatuses.includes(validated.status!)) {
        // Check if auto-notification is enabled for this status
        const isAutoEnabled = await isWhatsAppAutoEnabled(validated.status!)
        
        if (isAutoEnabled) {
          let message: string | null = null

          switch (validated.status) {
            case "ready":
              message = whatsappTemplates.orderReady(clientName, serviceLabel)
              break
            case "quoted":
              if (updatedOrder.price) {
                message = whatsappTemplates.quoteReady(
                  clientName,
                  serviceLabel,
                  Number(updatedOrder.price).toLocaleString("es-AR")
                )
              }
              break
            case "in_progress":
              message = whatsappTemplates.orderInProgress(clientName, serviceLabel)
              break
          }

          if (message) {
            // Send in background, don't block response
            sendWhatsAppBackground({
              to: currentOrderWithClient.clientPhone,
              message,
            })
          }
        }
      }
    }

    // Send Email notification when status changes to "ready"
    if (isStatusChange && validated.status === "ready" && currentOrderWithClient?.clientEmail) {
      const isEmailEnabled = await isEmailAutoEnabled("ready")
      if (isEmailEnabled) {
        const clientName = currentOrderWithClient.clientName || "Cliente"
        const [svcEmail] = await db.select({ displayName: services.displayName }).from(services).where(eq(services.name, updatedOrder.serviceType)).limit(1)
        const serviceLabelEmail = svcEmail?.displayName || updatedOrder.serviceType

        const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`
        fetch(edgeFnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: currentOrderWithClient.clientEmail,
            subject: `Tu ${serviceLabelEmail} está listo - AdminBlock`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>¡Hola ${clientName}!</h2><p>Tu <strong>${serviceLabelEmail.toLowerCase()}</strong> ya está listo para retirar.</p><p>¡Te esperamos!</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"/><p style="font-size:12px;color:#999">AdminBlock</p></div>`,
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => null)
            console.error("[EMAIL] Ready email error:", res.status, body)
          } else {
            console.log("[EMAIL] Ready email sent to", currentOrderWithClient.clientEmail)
          }
        }).catch((err) => console.error("[EMAIL] Ready email exception:", err))
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    logApiError("/api/orders/[id]", "PATCH", error)
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [deletedOrder] = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning()

    if (!deletedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Log activity
    await logActivity({
      type: "order_deleted",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: `Pedido eliminado: ${deletedOrder.serviceType}`,
      metadata: { serviceType: deletedOrder.serviceType },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/orders/[id]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar pedido" },
      { status: 500 }
    )
  }
}
