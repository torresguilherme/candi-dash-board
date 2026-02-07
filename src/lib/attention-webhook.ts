/**
 * Webhook utility for sending attention alerts for clients needing follow-up
 */

const ATTENTION_WEBHOOK_URL = "https://webhook.neurogrid.com.br/webhook/atencao-clientes";

export type AttentionLevel = "warm" | "urgent" | "super_urgent";

interface ClientAttentionData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  rg?: string | null;
  cpf?: string | null;
  education?: string | null;
  area_of_interest?: string | null;
  region?: string | null;
  linkedin_url?: string | null;
  resume_url?: string | null;
  photo_url?: string | null;
  contract_number?: string | null;
  contract_start_date?: string | null;
  contract_duration_months?: number | null;
  contract_value?: number | null;
  payment_method?: string | null;
  installments_count?: number | null;
  installments_due_day?: number | null;
  notes?: string | null;
  status?: string;
  next_step?: string | null;
  next_step_date?: string | null;
  next_step_assigned_to?: string | null;
  last_interaction_at?: string | null;
  created_at?: string;
  updated_at?: string;
  attention_level: AttentionLevel;
  days_without_interaction: number;
}

export function getAttentionLevel(daysDiff: number): AttentionLevel | null {
  if (daysDiff >= 7) return "super_urgent";
  if (daysDiff >= 6) return "urgent";
  if (daysDiff >= 3) return "warm";
  return null;
}

export function getAttentionLevelLabel(level: AttentionLevel): string {
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
 * Sends attention alert for a client to the webhook
 */
export async function sendAttentionWebhook(clientData: ClientAttentionData): Promise<boolean> {
  try {
    const response = await fetch(ATTENTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "attention_needed",
        timestamp: new Date().toISOString(),
        attention_level: clientData.attention_level,
        attention_level_label: getAttentionLevelLabel(clientData.attention_level),
        days_without_interaction: clientData.days_without_interaction,
        data: clientData,
      }),
    });

    if (!response.ok) {
      console.error("Attention webhook response not ok:", response.status, response.statusText);
      return false;
    }
    
    console.log("Attention alert sent to webhook successfully");
    return true;
  } catch (error) {
    console.error("Failed to send attention alert to webhook:", error);
    return false;
  }
}

/**
 * Send multiple attention alerts to the webhook
 */
export async function sendBulkAttentionWebhook(clients: ClientAttentionData[]): Promise<{ success: number; failed: number }> {
  try {
    const response = await fetch(ATTENTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "bulk_attention_needed",
        timestamp: new Date().toISOString(),
        total_clients: clients.length,
        summary: {
          warm: clients.filter(c => c.attention_level === "warm").length,
          urgent: clients.filter(c => c.attention_level === "urgent").length,
          super_urgent: clients.filter(c => c.attention_level === "super_urgent").length,
        },
        data: clients,
      }),
    });

    if (!response.ok) {
      console.error("Bulk attention webhook response not ok:", response.status, response.statusText);
      return { success: 0, failed: clients.length };
    }
    
    console.log("Bulk attention alerts sent to webhook successfully");
    return { success: clients.length, failed: 0 };
  } catch (error) {
    console.error("Failed to send bulk attention alerts to webhook:", error);
    return { success: 0, failed: clients.length };
  }
}

/**
 * Test the webhook with sample data
 */
export async function testAttentionWebhook(): Promise<boolean> {
  const testData: ClientAttentionData = {
    id: "test-client-id",
    full_name: "Cliente Teste",
    email: "teste@exemplo.com",
    phone: "(11) 99999-9999",
    status: "Ativo",
    attention_level: "urgent",
    days_without_interaction: 6,
    last_interaction_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(ATTENTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "webhook_test",
        timestamp: new Date().toISOString(),
        message: "Este é um teste do webhook de atenção necessária",
        test_data: testData,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Webhook test failed:", error);
    return false;
  }
}
