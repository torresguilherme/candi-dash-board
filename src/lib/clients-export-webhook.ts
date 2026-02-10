/**
 * Webhook utility for exporting client data to external system
 */

import { supabase } from "@/integrations/supabase/client";

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

interface FileData {
  filename: string;
  content_type: string;
  base64: string;
}

type EventType = "client_created" | "client_updated" | "client_deleted" | "client_status_changed" | "clients_full_export";

/**
 * Fetches a file from Supabase storage and returns it as base64
 */
async function fetchFileAsBase64(bucket: string, path: string): Promise<FileData | null> {
  try {
    if (!path) return null;
    
    // If it's already a full URL, extract the path
    let filePath = path;
    if (path.startsWith("http")) {
      const idx = path.indexOf(`${bucket}/`);
      if (idx !== -1) {
        filePath = path.substring(idx + bucket.length + 1);
      } else {
        return null; // Can't extract path from URL
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error || !data) {
      console.error(`Error downloading file from ${bucket}/${filePath}:`, error);
      return null;
    }

    // Convert blob to base64
    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Extract filename from path
    const filename = filePath.split('/').pop() || 'file';
    
    return {
      filename,
      content_type: data.type || 'application/octet-stream',
      base64,
    };
  } catch (error) {
    console.error("Error fetching file as base64:", error);
    return null;
  }
}

/**
 * Enriches client data with actual file contents
 */
async function enrichClientWithFiles(client: ClientExportData): Promise<ClientExportData & { photo_file?: FileData; resume_file?: FileData }> {
  const enriched: ClientExportData & { photo_file?: FileData; resume_file?: FileData } = { ...client };

  // Fetch photo file
  if (client.photo_url) {
    const photoFile = await fetchFileAsBase64('client-photos', client.photo_url);
    if (photoFile) {
      enriched.photo_file = photoFile;
    }
  }

  // Fetch resume file
  if (client.resume_url) {
    const resumeFile = await fetchFileAsBase64('client-resumes', client.resume_url);
    if (resumeFile) {
      enriched.resume_file = resumeFile;
    }
  }

  return enriched;
}

/**
 * Sends a single client data to the webhook (for create/update/delete events)
 */
export async function sendClientChangeToWebhook(
  client: ClientExportData, 
  event: EventType,
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    // Enrich client with file contents
    const enrichedClient = await enrichClientWithFiles(client);

    const response = await fetch(EXPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: enrichedClient,
        ...additionalData,
      }),
    });

    if (!response.ok) {
      console.error("Client change webhook response not ok:", response.status, response.statusText);
    } else {
      console.log(`Client ${event} sent to webhook successfully (with files)`);
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
    
    // Enrich all affected clients with file contents
    const enrichedClients = await Promise.all(
      affectedClients.map(c => enrichClientWithFiles({ ...c, status: newStatus }))
    );
    
    const response = await fetch(EXPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "client_status_changed",
        timestamp: new Date().toISOString(),
        new_status: newStatus,
        total_affected: enrichedClients.length,
        data: enrichedClients,
      }),
    });

    if (!response.ok) {
      console.error("Bulk status webhook response not ok:", response.status, response.statusText);
    } else {
      console.log("Bulk status change sent to webhook successfully (with files)");
    }
  } catch (error) {
    console.error("Failed to send bulk status change to webhook:", error);
  }
}

/**
 * Fetches all related data for a list of clients
 */
async function fetchAllRelatedData(clientIds: string[]) {
  const [services, interactions, documents, meetings] = await Promise.all([
    supabase.from("client_services").select("*").in("client_id", clientIds),
    supabase.from("client_interactions").select("*").in("client_id", clientIds),
    supabase.from("client_documents").select("*").in("client_id", clientIds),
    supabase.from("candidate_meetings").select("*").in("candidate_id", clientIds),
  ]);

  // Fetch service_dates for all services
  const serviceIds = (services.data || []).map(s => s.id);
  const serviceDates = serviceIds.length > 0
    ? await supabase.from("service_dates").select("*").in("service_id", serviceIds)
    : { data: [] };

  return {
    services: services.data || [],
    interactions: interactions.data || [],
    documents: documents.data || [],
    meetings: meetings.data || [],
    serviceDates: serviceDates.data || [],
  };
}

/**
 * Sends all clients data to the export webhook with all related records
 */
export async function sendAllClientsToWebhook(clients: ClientExportData[]): Promise<{ success: boolean; message: string }> {
  try {
    const clientIds = clients.map(c => c.id);

    // Fetch all related data and enrich with files in parallel
    const [relatedData, enrichedClients] = await Promise.all([
      fetchAllRelatedData(clientIds),
      Promise.all(clients.map(c => enrichClientWithFiles(c))),
    ]);

    // Attach related data to each client
    const fullClients = enrichedClients.map(client => ({
      ...client,
      services: relatedData.services
        .filter(s => s.client_id === client.id)
        .map(service => ({
          ...service,
          dates: relatedData.serviceDates.filter(d => d.service_id === service.id),
        })),
      interactions: relatedData.interactions.filter(i => i.client_id === client.id),
      documents: relatedData.documents.filter(d => d.client_id === client.id),
      meetings: relatedData.meetings.filter(m => m.candidate_id === client.id),
    }));

    const response = await fetch(EXPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "clients_full_export",
        timestamp: new Date().toISOString(),
        total_clients: fullClients.length,
        data: fullClients,
      }),
    });

    if (!response.ok) {
      console.error("Export webhook response not ok:", response.status, response.statusText);
      return { 
        success: false, 
        message: `Erro ao enviar: ${response.status} ${response.statusText}` 
      };
    }
    
    console.log("All clients data sent to export webhook successfully (with files and related data)");
    return { 
      success: true, 
      message: `${fullClients.length} cliente(s) enviado(s) com sucesso!` 
    };
  } catch (error) {
    console.error("Failed to send clients to export webhook:", error);
    return { 
      success: false, 
      message: "Falha na conexão com o webhook" 
    };
  }
}
