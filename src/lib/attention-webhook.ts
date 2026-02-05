/**
 * Webhook utility for sending attention alerts for clients needing follow-up
 * 
 * SECURITY: This utility implements data minimization to comply with LGPD/GDPR.
 * Sensitive PII (CPF, RG, addresses, phone numbers, payment details) are NOT sent.
 */

const ATTENTION_WEBHOOK_URL = "https://webhook.neurogrid.com.br/webhook/atencao-clientes";

export type AttentionLevel = "warm" | "urgent" | "super_urgent";

/**
 * Full client attention data interface (for internal use)
 */
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

/**
 * Sanitized client data for webhook - excludes sensitive PII
 */
interface SanitizedAttentionData {
  id: string;
  full_name: string;
  email: string;
  education?: string | null;
  area_of_interest?: string | null;
  region?: string | null;
  linkedin_url?: string | null;
  status?: string;
  next_step?: string | null;
  next_step_date?: string | null;
  last_interaction_at?: string | null;
  created_at?: string;
  attention_level: AttentionLevel;
  days_without_interaction: number;
}

/**
 * Sanitizes client data by removing sensitive PII before external transmission.
 * Complies with LGPD data minimization requirements.
 */
function sanitizeForWebhook(clientData: ClientAttentionData): SanitizedAttentionData {
  return {
    id: clientData.id,
    full_name: clientData.full_name,
    email: clientData.email,
    education: clientData.education,
    area_of_interest: clientData.area_of_interest,
    region: clientData.region,
    linkedin_url: clientData.linkedin_url,
    status: clientData.status,
    next_step: clientData.next_step,
    next_step_date: clientData.next_step_date,
    last_interaction_at: clientData.last_interaction_at,
    created_at: clientData.created_at,
    attention_level: clientData.attention_level,
    days_without_interaction: clientData.days_without_interaction,
  };
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
 * 
 * SECURITY: Sensitive PII is automatically stripped before transmission.
 */
export async function sendAttentionWebhook(clientData: ClientAttentionData): Promise<boolean> {
  try {
    const sanitizedData = sanitizeForWebhook(clientData);
    
    const response = await fetch(ATTENTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "attention_needed",
        timestamp: new Date().toISOString(),
        attention_level: sanitizedData.attention_level,
        attention_level_label: getAttentionLevelLabel(sanitizedData.attention_level),
        days_without_interaction: sanitizedData.days_without_interaction,
        data: sanitizedData,
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
 * 
 * SECURITY: Sensitive PII is automatically stripped before transmission.
 */
export async function sendBulkAttentionWebhook(clients: ClientAttentionData[]): Promise<{ success: number; failed: number }> {
  try {
    const sanitizedClients = clients.map(sanitizeForWebhook);
    
    const response = await fetch(ATTENTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "bulk_attention_needed",
        timestamp: new Date().toISOString(),
        total_clients: sanitizedClients.length,
        summary: {
          warm: sanitizedClients.filter(c => c.attention_level === "warm").length,
          urgent: sanitizedClients.filter(c => c.attention_level === "urgent").length,
          super_urgent: sanitizedClients.filter(c => c.attention_level === "super_urgent").length,
        },
        data: sanitizedClients,
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
