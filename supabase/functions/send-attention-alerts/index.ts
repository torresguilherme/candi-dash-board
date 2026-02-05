import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { differenceInDays } from "https://esm.sh/date-fns@3";

// Allowed origins for CORS - restrict to application domains only
const ALLOWED_ORIGINS = [
  "https://candi-dash-board.lovable.app",
  "https://id-preview--0228b737-97f0-49e8-86db-9bd4e9fc98c5.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null) {
  // Check if the origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovable.app")
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

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

/**
 * Sanitizes client data by removing sensitive PII before external transmission.
 * Complies with LGPD data minimization requirements.
 */
function sanitizeClientData(client: any) {
  return {
    id: client.id,
    full_name: client.full_name,
    email: client.email,
    education: client.education,
    area_of_interest: client.area_of_interest,
    region: client.region,
    linkedin_url: client.linkedin_url,
    status: client.status,
    next_step: client.next_step,
    next_step_date: client.next_step_date,
    last_interaction_at: client.last_interaction_at,
    created_at: client.created_at,
    attention_level: client.attention_level,
    days_without_interaction: client.days_without_interaction,
    // SECURITY: Explicitly excluding sensitive PII:
    // - cpf, rg, address, phone (identity/contact info)
    // - contract_value, payment_method, installments_count, installments_due_day (financial info)
    // - resume_url, photo_url (personal documents)
    // - notes (may contain sensitive information)
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
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

    // Sanitize client data to remove sensitive PII before sending to webhook
    const sanitizedClients = clientsNeedingAttention.map(sanitizeClientData);

    // Send to webhook with sanitized data
    const response = await fetch(ATTENTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "scheduled_attention_check",
        timestamp: new Date().toISOString(),
        total_clients: sanitizedClients.length,
        summary: {
          warm: sanitizedClients.filter((c: any) => c.attention_level === "warm").length,
          urgent: sanitizedClients.filter((c: any) => c.attention_level === "urgent").length,
          super_urgent: sanitizedClients.filter((c: any) => c.attention_level === "super_urgent").length,
        },
        data: sanitizedClients,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook response not ok: ${response.status}`);
    }

    console.log(`Successfully sent ${sanitizedClients.length} clients to attention webhook by user ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Attention alerts sent successfully",
        clients_sent: sanitizedClients.length,
        summary: {
          warm: sanitizedClients.filter((c: any) => c.attention_level === "warm").length,
          urgent: sanitizedClients.filter((c: any) => c.attention_level === "urgent").length,
          super_urgent: sanitizedClients.filter((c: any) => c.attention_level === "super_urgent").length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending attention alerts:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(null), "Content-Type": "application/json" } }
    );
  }
});
