import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orderAttachments } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { logApiError } from "@/lib/logger"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params

    // Find the attachment
    const [attachment] = await db
      .select()
      .from(orderAttachments)
      .where(
        and(
          eq(orderAttachments.id, attachmentId),
          eq(orderAttachments.orderId, id)
        )
      )

    if (!attachment) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      )
    }

    // Extract storage path from the public URL (everything after /comprobantes/)
    const storagePath = attachment.fileUrl.split("/comprobantes/").pop()

    if (storagePath) {
      const supabase = await createClient()
      const { error: deleteError } = await supabase.storage
        .from("comprobantes")
        .remove([decodeURIComponent(storagePath)])

      if (deleteError) {
        logApiError("/api/orders/[id]/comprobantes/[attachmentId]", "DELETE", new Error(deleteError.message), { step: "delete_file" })
        // Continue with DB deletion even if storage deletion fails
      }
    }

    // Delete from DB
    await db
      .delete(orderAttachments)
      .where(eq(orderAttachments.id, attachmentId))

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/orders/[id]/comprobantes/[attachmentId]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar comprobante" },
      { status: 500 }
    )
  }
}
