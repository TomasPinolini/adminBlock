import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { notifyOrderStatus } from "@/inngest/functions/notify-order-status"
import { notifyPayment } from "@/inngest/functions/notify-payment"

// Serve the Inngest API with all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [notifyOrderStatus, notifyPayment],
})
