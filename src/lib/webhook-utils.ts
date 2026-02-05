/**
 * Webhook utility for sending client data to external services
 * 
 * SECURITY: This utility implements data minimization to comply with LGPD/GDPR.
 * Sensitive PII (CPF, RG, addresses, phone numbers, payment details) are NOT sent.
 */

const WEBHOOK_URL = "https://webhook.neurogrid.com.br/webhook/atualizarlista";

/**
 * Minimal client data structure for webhook - excludes sensitive PII
 */
interface WebhookClientData {
  id: string;
  full_name: string;
  email: string;
  education?: string | null;
  area_of_interest?: string | null;
  region?: string | null;
  linkedin_url?: string | null;
  status?: string;
  created_at?: string;
}

/**
 * Full client data interface (for internal use)
 */
interface ClientData {
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
  created_at?: string;
}

/**
 * Sanitizes client data by removing sensitive PII before external transmission.
 * Complies with LGPD data minimization requirements.
 */
function sanitizeForWebhook(clientData: ClientData): WebhookClientData {
  return {
    id: clientData.id,
    full_name: clientData.full_name,
    email: clientData.email,
    education: clientData.education,
    area_of_interest: clientData.area_of_interest,
    region: clientData.region,
    linkedin_url: clientData.linkedin_url,
    status: clientData.status,
    created_at: clientData.created_at,
  };
}

/**
 * Sends new client data to the webhook
 * Runs in the background and doesn't block the main flow
 * 
 * SECURITY: Sensitive PII (CPF, RG, phone, address, payment info) is automatically
 * stripped before transmission to comply with LGPD data minimization requirements.
 */
export async function sendClientToWebhook(clientData: ClientData): Promise<void> {
  try {
    // Sanitize data to remove sensitive PII before external transmission
    const sanitizedData = sanitizeForWebhook(clientData);
    
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "new_client",
        timestamp: new Date().toISOString(),
        data: sanitizedData,
      }),
    });

    if (!response.ok) {
      console.error("Webhook response not ok:", response.status, response.statusText);
    } else {
      console.log("Client data sent to webhook successfully");
    }
  } catch (error) {
    // Log but don't throw - webhook failure shouldn't block client creation
    console.error("Failed to send client data to webhook:", error);
  }
}
