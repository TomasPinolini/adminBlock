import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientRelationships, clients } from "@/lib/db/schema"
import { createRelationshipSchema } from "@/lib/validations/relationships"
import { desc, eq, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const personId = searchParams.get("personId")

    if (!companyId && !personId) {
      return NextResponse.json(
        { error: "companyId o personId requerido" },
        { status: 400 }
      )
    }

    // Build the query based on what parameter is provided
    if (companyId) {
      // Get all individuals linked to this company
      const relationships = await db
        .select({
          id: clientRelationships.id,
          personId: clientRelationships.personId,
          companyId: clientRelationships.companyId,
          role: clientRelationships.role,
          notes: clientRelationships.notes,
          createdAt: clientRelationships.createdAt,
          person: {
            id: clients.id,
            name: clients.name,
            phone: clients.phone,
            instagramHandle: clients.instagramHandle,
          },
        })
        .from(clientRelationships)
        .leftJoin(clients, eq(clientRelationships.personId, clients.id))
        .where(eq(clientRelationships.companyId, companyId))
        .orderBy(desc(clientRelationships.createdAt))

      return NextResponse.json(relationships)
    }

    if (personId) {
      // Get all companies this person is linked to
      const relationships = await db
        .select({
          id: clientRelationships.id,
          personId: clientRelationships.personId,
          companyId: clientRelationships.companyId,
          role: clientRelationships.role,
          notes: clientRelationships.notes,
          createdAt: clientRelationships.createdAt,
          company: {
            id: clients.id,
            name: clients.name,
            phone: clients.phone,
            instagramHandle: clients.instagramHandle,
          },
        })
        .from(clientRelationships)
        .leftJoin(clients, eq(clientRelationships.companyId, clients.id))
        .where(eq(clientRelationships.personId, personId))
        .orderBy(desc(clientRelationships.createdAt))

      return NextResponse.json(relationships)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching relationships:", error)
    return NextResponse.json(
      { error: "Error al obtener relaciones" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createRelationshipSchema.parse(body)

    // Check if relationship already exists
    const existing = await db
      .select()
      .from(clientRelationships)
      .where(
        and(
          eq(clientRelationships.personId, validated.personId),
          eq(clientRelationships.companyId, validated.companyId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Esta persona ya está vinculada a esta empresa" },
        { status: 400 }
      )
    }

    const [newRelationship] = await db
      .insert(clientRelationships)
      .values(validated)
      .returning()

    return NextResponse.json(newRelationship, { status: 201 })
  } catch (error) {
    console.error("Error creating relationship:", error)
    return NextResponse.json(
      { error: "Error al crear relación" },
      { status: 500 }
    )
  }
}
