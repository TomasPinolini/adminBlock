// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Archive orders that are delivered + paid and older than 30 days
    const { data, error } = await supabase.rpc("auto_archive_orders");

    if (error) {
      // Fallback: direct query if RPC doesn't exist
      const { data: result, error: queryError } = await supabase
        .from("orders")
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq("status", "delivered")
        .eq("payment_status", "paid")
        .eq("is_archived", false)
        .lt("paid_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .select("id");

      if (queryError) {
        return new Response(
          JSON.stringify({ error: queryError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const count = result?.length ?? 0;
      return new Response(
        JSON.stringify({
          success: true,
          archived: count,
          message: `${count} pedido(s) archivado(s) automáticamente`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        archived: data,
        message: `${data} pedido(s) archivado(s) automáticamente`,
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
