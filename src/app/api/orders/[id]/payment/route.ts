import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsApp, whatsappTemplates } from "@/lib/whatsapp"
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
        console.error("Upload error:", uploadError)
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

    // Update order with payment info
    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus,
        paymentAmount: totalPaid.toString(),
        receiptUrl,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    // Return validation info
    const amountMatch = totalPaid >= orderPrice
    const difference = orderPrice - totalPaid

    // Send WhatsApp payment confirmation
    if (orderWithClient.clientPhone) {
      const clientName = orderWithClient.clientName || "Cliente"
      const message = whatsappTemplates.paymentConfirmed(
        clientName,
        paidAmount.toLocaleString("es-AR"),
        amountMatch ? undefined : difference.toLocaleString("es-AR")
      )

      // Send in background, don't block response
      sendWhatsApp({
        to: orderWithClient.clientPhone,
        message,
      }).catch((err) => console.error("WhatsApp send error:", err))
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
    console.error("Error registering payment:", error)
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
    console.error("Error fetching payment:", error)
    return NextResponse.json(
      { error: "Error al obtener pago" },
      { status: 500 }
    )
  }
}
