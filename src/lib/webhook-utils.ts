/**
 * Webhook utility for sending client data to external services
 */

const WEBHOOK_URL = "https://webhook.neurogrid.com.br/webhook/atualizarlista";

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
 * Sends new client data to the webhook
 * Runs in the background and doesn't block the main flow
 */
export async function sendClientToWebhook(clientData: ClientData): Promise<void> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "new_client",
        timestamp: new Date().toISOString(),
        data: clientData,
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
