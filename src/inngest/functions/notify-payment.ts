import { inngest } from "../client"
import { sendWhatsApp, whatsappTemplates } from "@/lib/whatsapp"

// Send WhatsApp when payment is registered
export const notifyPayment = inngest.createFunction(
  {
    id: "notify-payment",
    name: "Notify Payment Registered",
  },
  { event: "order/payment.registered" },
  async ({ event, step }) => {
    const { clientPhone, clientName, amount, remaining, isPaidInFull } = event.data

    // Skip if no phone number
    if (!clientPhone) {
      return { skipped: true, reason: "No client phone number" }
    }

    // Build confirmation message
    const message = whatsappTemplates.paymentConfirmed(
      clientName,
      Number(amount).toLocaleString("es-AR"),
      isPaidInFull ? undefined : Number(remaining).toLocaleString("es-AR")
    )

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
      amount,
      isPaidInFull,
      messageSid: result.sid,
    }
  }
)
