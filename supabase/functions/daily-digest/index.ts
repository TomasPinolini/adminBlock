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

    // Get admin email from app_settings
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "admin.email")
      .single();

    const adminEmail = setting?.value;
    if (!adminEmail) {
      return new Response(
        JSON.stringify({ error: "No admin email configured (admin.email)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Today's date in Argentina (UTC-3)
    const now = new Date();
    const argTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = argTime.toISOString().split("T")[0];
    const yesterdayStr = new Date(argTime.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // 1. Orders due today
    const { data: dueToday } = await supabase
      .from("orders")
      .select("id, service_type, description, price, clients(name)")
      .eq("due_date", todayStr)
      .eq("is_archived", false)
      .not("status", "in", '("delivered","cancelled")')
      .order("created_at", { ascending: false });

    // 2. Overdue orders
    const { data: overdue } = await supabase
      .from("orders")
      .select("id, service_type, description, price, due_date, clients(name)")
      .lt("due_date", todayStr)
      .eq("is_archived", false)
      .not("status", "in", '("delivered","cancelled")')
      .order("due_date", { ascending: true });

    // 3. Pending payments (has price, not fully paid)
    const { data: pendingPayments } = await supabase
      .from("orders")
      .select("id, service_type, price, payment_status, payment_amount, clients(name)")
      .not("price", "is", null)
      .neq("payment_status", "paid")
      .eq("is_archived", false)
      .not("status", "in", '("cancelled")')
      .order("created_at", { ascending: false });

    // 4. Completed yesterday
    const { data: completedYesterday } = await supabase
      .from("orders")
      .select("id, service_type, price, clients(name)")
      .eq("status", "delivered")
      .gte("updated_at", `${yesterdayStr}T00:00:00`)
      .lt("updated_at", `${todayStr}T00:00:00`)
      .order("updated_at", { ascending: false });

    // Build HTML email
    const dueTodayCount = dueToday?.length ?? 0;
    const overdueCount = overdue?.length ?? 0;
    const pendingCount = pendingPayments?.length ?? 0;
    const completedCount = completedYesterday?.length ?? 0;

    const formatPrice = (p: string | null) =>
      p ? `$${Number(p).toLocaleString("es-AR")}` : "-";

    const getClientName = (order: any) =>
      order.clients?.name ?? "Cliente desconocido";

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333;">
      <h1 style="color: #1a1a2e; border-bottom: 3px solid #4361ee; padding-bottom: 10px;">
        📋 Resumen Diario — ${todayStr}
      </h1>

      ${overdueCount > 0 ? `
      <div style="background: #fff3f3; border-left: 4px solid #e74c3c; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <h2 style="color: #e74c3c; margin: 0 0 8px;">⚠️ Vencidos (${overdueCount})</h2>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f0d0d0;">
            <th style="text-align: left; padding: 4px 8px;">Cliente</th>
            <th style="text-align: left; padding: 4px 8px;">Servicio</th>
            <th style="text-align: left; padding: 4px 8px;">Vencimiento</th>
            <th style="text-align: right; padding: 4px 8px;">Precio</th>
          </tr>
          ${(overdue ?? []).map((o: any) => `
          <tr style="border-bottom: 1px solid #f0d0d0;">
            <td style="padding: 4px 8px;">${getClientName(o)}</td>
            <td style="padding: 4px 8px;">${o.service_type}</td>
            <td style="padding: 4px 8px;">${o.due_date}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatPrice(o.price)}</td>
          </tr>`).join("")}
        </table>
      </div>` : ""}

      ${dueTodayCount > 0 ? `
      <div style="background: #fff8e6; border-left: 4px solid #f39c12; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <h2 style="color: #f39c12; margin: 0 0 8px;">📅 Vencen Hoy (${dueTodayCount})</h2>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f0e0b0;">
            <th style="text-align: left; padding: 4px 8px;">Cliente</th>
            <th style="text-align: left; padding: 4px 8px;">Servicio</th>
            <th style="text-align: right; padding: 4px 8px;">Precio</th>
          </tr>
          ${(dueToday ?? []).map((o: any) => `
          <tr style="border-bottom: 1px solid #f0e0b0;">
            <td style="padding: 4px 8px;">${getClientName(o)}</td>
            <td style="padding: 4px 8px;">${o.service_type}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatPrice(o.price)}</td>
          </tr>`).join("")}
        </table>
      </div>` : ""}

      ${pendingCount > 0 ? `
      <div style="background: #f0f4ff; border-left: 4px solid #4361ee; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <h2 style="color: #4361ee; margin: 0 0 8px;">💰 Pagos Pendientes (${pendingCount})</h2>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #d0d8f0;">
            <th style="text-align: left; padding: 4px 8px;">Cliente</th>
            <th style="text-align: left; padding: 4px 8px;">Servicio</th>
            <th style="text-align: right; padding: 4px 8px;">Precio</th>
            <th style="text-align: right; padding: 4px 8px;">Pagado</th>
          </tr>
          ${(pendingPayments ?? []).map((o: any) => `
          <tr style="border-bottom: 1px solid #d0d8f0;">
            <td style="padding: 4px 8px;">${getClientName(o)}</td>
            <td style="padding: 4px 8px;">${o.service_type}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatPrice(o.price)}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatPrice(o.payment_amount)}</td>
          </tr>`).join("")}
        </table>
      </div>` : ""}

      ${completedCount > 0 ? `
      <div style="background: #f0faf0; border-left: 4px solid #27ae60; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <h2 style="color: #27ae60; margin: 0 0 8px;">✅ Completados Ayer (${completedCount})</h2>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #c0e0c0;">
            <th style="text-align: left; padding: 4px 8px;">Cliente</th>
            <th style="text-align: left; padding: 4px 8px;">Servicio</th>
            <th style="text-align: right; padding: 4px 8px;">Precio</th>
          </tr>
          ${(completedYesterday ?? []).map((o: any) => `
          <tr style="border-bottom: 1px solid #c0e0c0;">
            <td style="padding: 4px 8px;">${getClientName(o)}</td>
            <td style="padding: 4px 8px;">${o.service_type}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatPrice(o.price)}</td>
          </tr>`).join("")}
        </table>
      </div>` : ""}

      ${dueTodayCount === 0 && overdueCount === 0 && pendingCount === 0 && completedCount === 0 ? `
      <div style="background: #f8f8f8; padding: 20px; text-align: center; border-radius: 4px; margin: 16px 0;">
        <p style="color: #888; font-size: 16px;">Sin novedades para hoy 🎉</p>
      </div>` : ""}

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">AdminBlock — Resumen automático diario</p>
    </div>`;

    // Send via Resend
    const subject = overdueCount > 0
      ? `⚠️ AdminBlock: ${overdueCount} vencido(s), ${dueTodayCount} para hoy`
      : dueTodayCount > 0
        ? `📅 AdminBlock: ${dueTodayCount} pedido(s) vencen hoy`
        : `📋 AdminBlock: Resumen del ${todayStr}`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: adminEmail,
        subject,
        html,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      return new Response(
        JSON.stringify({ error: emailData.message || "Error de Resend", details: emailData }),
        { status: emailRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_to: adminEmail,
        summary: { dueToday: dueTodayCount, overdue: overdueCount, pendingPayments: pendingCount, completedYesterday: completedCount },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
