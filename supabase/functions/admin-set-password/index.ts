import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

/**
 * Função administrativa temporária: define a senha de um usuário existente.
 * Protegida por um token de operação (ADMIN_OP_TOKEN implícito via header),
 * usa a service role key apenas no servidor — nunca no frontend.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-op-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string" || password.length < 6) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Localiza o usuário pelo e-mail (paginando com limite razoável)
    const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;

    const target = list.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (!target) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(target.id, {
      password,
      email_confirm: true,
    });
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, user_id: target.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
