import { inngest } from "../client"
import { sendWhatsApp, whatsappTemplates } from "@/lib/whatsapp"
import { serviceTypeLabels } from "@/lib/validations/orders"
import type { ServiceType } from "@/lib/db/schema"

// Send WhatsApp when order status changes to specific states
export const notifyOrderStatus = inngest.createFunction(
  {
    id: "notify-order-status",
    name: "Notify Order Status Change",
  },
  { event: "order/status.changed" },
  async ({ event, step }) => {
    const { newStatus, clientPhone, clientName, serviceType, price } = event.data

    // Only send notifications for certain status changes
    const notifyStatuses = ["ready", "quoted", "in_progress"]
    if (!notifyStatuses.includes(newStatus)) {
      return { skipped: true, reason: `Status ${newStatus} doesn't trigger notification` }
    }

    // Skip if no phone number
    if (!clientPhone) {
      return { skipped: true, reason: "No client phone number" }
    }

    // Build the message based on status
    const serviceLabel = serviceTypeLabels[serviceType as ServiceType] || serviceType

    let message: string
    switch (newStatus) {
      case "ready":
        message = whatsappTemplates.orderReady(clientName, serviceLabel)
        break
      case "quoted":
        if (!price) {
          return { skipped: true, reason: "Quote status but no price set" }
        }
        message = whatsappTemplates.quoteReady(
          clientName,
          serviceLabel,
          Number(price).toLocaleString("es-AR")
        )
        break
      case "in_progress":
        message = whatsappTemplates.orderInProgress(clientName, serviceLabel)
        break
      default:
        return { skipped: true, reason: "Unknown status" }
    }

    // Send the WhatsApp message
    const result = await step.run("send-whatsapp", async () => {
      return await sendWhatsApp({
        to: clientPhone,
        message,
      })
    })

    return {
      sent: true,
      to: clientPhone,
      status: newStatus,
      messageSid: result.sid,
    }
  }
)
