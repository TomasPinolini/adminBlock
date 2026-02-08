import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppBackground, whatsappTemplates } from "@/lib/whatsapp"
import { isPaymentNotificationEnabled } from "@/lib/settings"
import { logApiError } from "@/lib/logger"
import { logActivity } from "@/lib/activity"
import type { PaymentStatus } from "@/lib/db/schema"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()

    const paymentAmount = formData.get("paymentAmount") as string
    const receipt = formData.get("receipt") as File | null
    const invoiceType = (formData.get("invoiceType") as string) || "none"
    const invoiceNumber = formData.get("invoiceNumber") as string | null

    if (!paymentAmount) {
      return NextResponse.json(
        { error: "El monto es requerido" },
        { status: 400 }
      )
    }

    // Get the order with client info
    const [orderWithClient] = await db
      .select({
        order: orders,
        clientName: clients.name,
        clientPhone: clients.phone,
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
    const paidAmount = Number(paymentAmount)
    const previousPaid = Number(order.paymentAmount || 0)
    const totalPaid = previousPaid + paidAmount

    // Determine payment status
    let paymentStatus: PaymentStatus = "pending"
    if (totalPaid >= orderPrice && orderPrice > 0) {
      paymentStatus = "paid"
    } else if (totalPaid > 0) {
      paymentStatus = "partial"
    }

    let receiptUrl = order.receiptUrl

    // Upload receipt if provided
    if (receipt && receipt.size > 0) {
      const supabase = await createClient()

      // Generate unique filename
      const fileExt = receipt.name.split(".").pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, receipt, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        logApiError("/api/orders/[id]/payment", "POST", new Error(uploadError.message), { step: "upload_receipt" })
        return NextResponse.json(
          { error: "Error al subir comprobante", details: uploadError.message },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName)

      receiptUrl = urlData.publicUrl
    }

    // Calculate IVA breakdown based on invoice type
    const IVA_RATE = 0.21
    let subtotal: string | null = null
    let taxAmount: string | null = null

    if (invoiceType === "A" && orderPrice > 0) {
      const sub = orderPrice / (1 + IVA_RATE)
      subtotal = sub.toFixed(2)
      taxAmount = (orderPrice - sub).toFixed(2)
    }

    // Update order with payment + invoice info
    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus,
        paymentAmount: totalPaid.toString(),
        receiptUrl,
        invoiceType: invoiceType as "A" | "B" | "none",
        invoiceNumber: invoiceNumber || null,
        subtotal,
        taxAmount,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    // Log activity
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    await logActivity({
      type: "payment_registered",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: `Pago registrado: $${paidAmount.toLocaleString("es-AR")} (${paymentStatus === "paid" ? "pagado" : "parcial"})${invoiceType !== "none" ? ` - Factura ${invoiceType}${invoiceNumber ? ` #${invoiceNumber}` : ""}` : ""}`,
      metadata: { amount: paidAmount, totalPaid, paymentStatus, invoiceType, invoiceNumber },
    })

    // Return validation info
    const amountMatch = totalPaid >= orderPrice
    const difference = orderPrice - totalPaid

    // Send WhatsApp payment confirmation (if enabled)
    if (orderWithClient.clientPhone) {
      const isEnabled = await isPaymentNotificationEnabled()
      
      if (isEnabled) {
        const clientName = orderWithClient.clientName || "Cliente"
        const message = whatsappTemplates.paymentConfirmed(
          clientName,
          paidAmount.toLocaleString("es-AR"),
          amountMatch ? undefined : difference.toLocaleString("es-AR")
        )

        // Send in background, don't block response
        sendWhatsAppBackground({
          to: orderWithClient.clientPhone,
          message,
        })
      }
    }

    return NextResponse.json({
      order: updatedOrder,
      validation: {
        orderPrice,
        totalPaid,
        amountMatch,
        difference: amountMatch ? 0 : difference,
        status: paymentStatus,
      },
    })
  } catch (error) {
    logApiError("/api/orders/[id]/payment", "POST", error)
    return NextResponse.json(
      { error: "Error al registrar pago" },
      { status: 500 }
    )
  }
}

// GET endpoint to check payment status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [order] = await db
      .select({
        id: orders.id,
        price: orders.price,
        paymentStatus: orders.paymentStatus,
        paymentAmount: orders.paymentAmount,
        receiptUrl: orders.receiptUrl,
        paidAt: orders.paidAt,
      })
      .from(orders)
      .where(eq(orders.id, id))

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    const orderPrice = Number(order.price || 0)
    const totalPaid = Number(order.paymentAmount || 0)

    return NextResponse.json({
      ...order,
      validation: {
        orderPrice,
        totalPaid,
        amountMatch: totalPaid >= orderPrice,
        difference: orderPrice - totalPaid,
        percentPaid: orderPrice > 0 ? Math.round((totalPaid / orderPrice) * 100) : 0,
      },
    })
  } catch (error) {
    logApiError("/api/orders/[id]/payment", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener pago" },
      { status: 500 }
    )
  }
}
