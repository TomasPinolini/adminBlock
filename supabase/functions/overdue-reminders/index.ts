// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Today in Argentina (UTC-3)
    const now = new Date();
    const argTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = argTime.toISOString().split("T")[0];

    // Find overdue orders with client email, not archived, not delivered/cancelled
    const { data: overdueOrders, error } = await supabase
      .from("orders")
      .select("id, service_type, description, price, due_date, last_reminder_sent, clients(name, email)")
      .lt("due_date", todayStr)
      .eq("is_archived", false)
      .not("status", "in", '("delivered","cancelled")')
      .order("due_date", { ascending: true });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Filter: only orders where client has email AND we haven't sent a reminder today
    const toRemind = (overdueOrders ?? []).filter((order: any) => {
      const clientEmail = order.clients?.email;
      if (!clientEmail) return false;
      // Skip if we already sent a reminder today
      if (order.last_reminder_sent === todayStr) return false;
      return true;
    });

    let sentCount = 0;
    const errors: string[] = [];

    for (const order of toRemind) {
      const clientName = (order.clients?.name ?? "Cliente").split(" ")[0];
      const clientEmail = order.clients?.email;
      const serviceType = order.service_type ?? "pedido";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Hola ${clientName}!</h2>
          <p style="font-size: 16px; color: #555;">
            Te escribimos para recordarte que tenés un pedido pendiente de retirar:
          </p>
          <div style="background: #fff8e6; border-left: 4px solid #f39c12; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="font-size: 16px; color: #333; margin: 0;">
              <strong>${serviceType}</strong>
              ${order.description ? `<br/><span style="color: #666; font-size: 14px;">${order.description}</span>` : ""}
            </p>
          </div>
          <p style="font-size: 16px; color: #555;">
            ¡Te esperamos!
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">AdminBlock</p>
        </div>
      `;

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: clientEmail,
            subject: `Recordatorio: tu ${serviceType} está listo — AdminBlock`,
            html,
          }),
        });

        if (emailRes.ok) {
          // Mark reminder as sent today
          await supabase
            .from("orders")
            .update({ last_reminder_sent: todayStr })
            .eq("id", order.id);
          sentCount++;
        } else {
          const errData = await emailRes.json();
          errors.push(`${clientEmail}: ${errData.message || "Error de Resend"}`);
        }
      } catch (e: any) {
        errors.push(`${clientEmail}: ${e.message || "Error de envío"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        overdue_total: overdueOrders?.length ?? 0,
        eligible: toRemind.length,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
