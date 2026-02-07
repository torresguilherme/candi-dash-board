/**
 * Webhook utility for exporting client data to external system
 */

const EXPORT_WEBHOOK_URL = "https://n8n.neurogrid.com.br/webhook-test/clientesvagasperson";

interface ClientExportData {
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
  contract_end_date?: string | null;
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
}

type EventType = "client_created" | "client_updated" | "client_deleted" | "client_status_changed" | "clients_full_export";

/**
 * Sends a single client data to the webhook (for create/update/delete events)
 */
export async function sendClientChangeToWebhook(
  client: ClientExportData, 
  event: EventType,
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch(EXPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: client,
        ...additionalData,
      }),
    });

    if (!response.ok) {
      console.error("Client change webhook response not ok:", response.status, response.statusText);
    } else {
      console.log(`Client ${event} sent to webhook successfully`);
    }
  } catch (error) {
    // Log but don't throw - webhook failure shouldn't block client operations
    console.error("Failed to send client change to webhook:", error);
  }
}

/**
 * Sends multiple clients status change to the webhook
 */
export async function sendBulkStatusChangeToWebhook(
  clientIds: string[],
  newStatus: string,
  clients: ClientExportData[]
): Promise<void> {
  try {
    const affectedClients = clients.filter(c => clientIds.includes(c.id));
    
    const response = await fetch(EXPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "client_status_changed",
        timestamp: new Date().toISOString(),
        new_status: newStatus,
        total_affected: affectedClients.length,
        data: affectedClients.map(c => ({ ...c, status: newStatus })),
      }),
    });

    if (!response.ok) {
      console.error("Bulk status webhook response not ok:", response.status, response.statusText);
    } else {
      console.log("Bulk status change sent to webhook successfully");
    }
  } catch (error) {
    console.error("Failed to send bulk status change to webhook:", error);
  }
}

/**
 * Sends all clients data to the export webhook
 */
export async function sendAllClientsToWebhook(clients: ClientExportData[]): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(EXPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "clients_full_export",
        timestamp: new Date().toISOString(),
        total_clients: clients.length,
        data: clients,
      }),
    });

    if (!response.ok) {
      console.error("Export webhook response not ok:", response.status, response.statusText);
      return { 
        success: false, 
        message: `Erro ao enviar: ${response.status} ${response.statusText}` 
      };
    }
    
    console.log("All clients data sent to export webhook successfully");
    return { 
      success: true, 
      message: `${clients.length} cliente(s) enviado(s) com sucesso!` 
    };
  } catch (error) {
    console.error("Failed to send clients to export webhook:", error);
    return { 
      success: false, 
      message: "Falha na conexão com o webhook" 
    };
  }
}
