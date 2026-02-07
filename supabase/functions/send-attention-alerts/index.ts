import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { differenceInDays } from "https://esm.sh/date-fns@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ATTENTION_WEBHOOK_URL = "https://webhook.neurogrid.com.br/webhook/atencao-clientes";

type AttentionLevel = "warm" | "urgent" | "super_urgent";

function getAttentionLevel(daysDiff: number): AttentionLevel | null {
  if (daysDiff >= 7) return "super_urgent";
  if (daysDiff >= 6) return "urgent";
  if (daysDiff >= 3) return "warm";
  return null;
}

function getAttentionLevelLabel(level: AttentionLevel): string {
  switch (level) {
    case "warm":
      return "Morno (3+ dias)";
    case "urgent":
      return "Urgente (6+ dias)";
    case "super_urgent":
      return "Super Urgente (7+ dias)";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin or editor role
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    if (rolesError) {
      console.error("Error checking user roles:", rolesError);
      return new Response(
        JSON.stringify({ success: false, error: "Error checking permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasAccess = roles?.some(r => r.role === "admin" || r.role === "editor");
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all clients
    const { data: clients, error } = await supabase
      .from("clients")
      .select("*");

    if (error) {
      throw error;
    }

    // Filter clients that need attention (3+ days without interaction)
    const clientsNeedingAttention = (clients || [])
      .map((client) => {
        const daysDiff = client.last_interaction_at
          ? differenceInDays(new Date(), new Date(client.last_interaction_at))
          : 999;

        const attentionLevel = getAttentionLevel(daysDiff);

        if (attentionLevel) {
          return {
            ...client,
            attention_level: attentionLevel,
            days_without_interaction: daysDiff,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (clientsNeedingAttention.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No clients need attention",
          clients_sent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to webhook
    const response = await fetch(ATTENTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "scheduled_attention_check",
        timestamp: new Date().toISOString(),
        total_clients: clientsNeedingAttention.length,
        summary: {
          warm: clientsNeedingAttention.filter((c: any) => c.attention_level === "warm").length,
          urgent: clientsNeedingAttention.filter((c: any) => c.attention_level === "urgent").length,
          super_urgent: clientsNeedingAttention.filter((c: any) => c.attention_level === "super_urgent").length,
        },
        data: clientsNeedingAttention,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook response not ok: ${response.status}`);
    }

    console.log(`Successfully sent ${clientsNeedingAttention.length} clients to attention webhook by user ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Attention alerts sent successfully",
        clients_sent: clientsNeedingAttention.length,
        summary: {
          warm: clientsNeedingAttention.filter((c: any) => c.attention_level === "warm").length,
          urgent: clientsNeedingAttention.filter((c: any) => c.attention_level === "urgent").length,
          super_urgent: clientsNeedingAttention.filter((c: any) => c.attention_level === "super_urgent").length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending attention alerts:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
