import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contacts, clients, clientRelationships, orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// One-time migration: convert contacts to individual clients with relationships
// Run this once by visiting /api/migrate-contacts
export async function GET() {
  try {
    // Get all contacts
    const allContacts = await db.select().from(contacts)

    if (allContacts.length === 0) {
      return NextResponse.json({
        message: "No contacts to migrate",
        migrated: 0
      })
    }

    let migrated = 0
    const results: { contactName: string; newClientId: string; relationshipId: string }[] = []

    for (const contact of allContacts) {
      // Create a new individual client for this contact
      const [newClient] = await db
        .insert(clients)
        .values({
          clientType: "individual",
          name: contact.name,
          phone: contact.phone,
          instagramHandle: contact.instagramHandle,
          notes: contact.notes,
        })
        .returning()

      // Create relationship between the new individual and the company
      const [relationship] = await db
        .insert(clientRelationships)
        .values({
          personId: newClient.id,
          companyId: contact.clientId, // The company this contact belonged to
          role: contact.role,
          notes: null,
        })
        .returning()

      // Update orders that reference this contact to use personId
      await db
        .update(orders)
        .set({ personId: newClient.id })
        .where(eq(orders.contactId, contact.id))

      results.push({
        contactName: contact.name,
        newClientId: newClient.id,
        relationshipId: relationship.id,
      })

      migrated++
    }

    return NextResponse.json({
      message: `Successfully migrated ${migrated} contacts to individual clients`,
      migrated,
      results,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    )
  }
}
