import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orderAttachments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { logApiError } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const attachments = await db
      .select()
      .from(orderAttachments)
      .where(eq(orderAttachments.orderId, id))
      .orderBy(desc(orderAttachments.createdAt))

    return NextResponse.json(attachments)
  } catch (error) {
    logApiError("/api/orders/[id]/comprobantes", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener comprobantes" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Archivo requerido" },
        { status: 400 }
      )
    }

    // Validate PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      )
    }

    // Validate size (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo es muy grande. Máximo 10MB." },
        { status: 400 }
      )
    }

    // Upload to Supabase storage
    const supabase = await createClient()
    const path = `${id}/${Date.now()}-${file.name}`

    const { data, error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(path, file, {
        cacheControl: "3600",
      })

    if (uploadError) {
      logApiError("/api/orders/[id]/comprobantes", "POST", new Error(uploadError.message), { step: "upload_file" })
      return NextResponse.json(
        { error: "Error al subir archivo", details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("comprobantes")
      .getPublicUrl(path)

    // Insert into DB
    const [attachment] = await db
      .insert(orderAttachments)
      .values({
        orderId: id,
        fileUrl: urlData.publicUrl,
        fileName: file.name,
      })
      .returning()

    return NextResponse.json(attachment)
  } catch (error) {
    logApiError("/api/orders/[id]/comprobantes", "POST", error)
    return NextResponse.json(
      { error: "Error al subir comprobante" },
      { status: 500 }
    )
  }
}
