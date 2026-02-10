import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Exports all client data with related records as a CSV download
 */
export async function exportAllClientsAsCSV(): Promise<{ success: boolean; message: string }> {
  try {
    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .order("full_name");

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) {
      return { success: false, message: "Nenhum cliente encontrado." };
    }

    const clientIds = clients.map(c => c.id);

    // Fetch all related data in parallel
    const [services, interactions, documents, meetings] = await Promise.all([
      supabase.from("client_services").select("*").in("client_id", clientIds),
      supabase.from("client_interactions").select("*").in("client_id", clientIds),
      supabase.from("client_documents").select("*").in("client_id", clientIds),
      supabase.from("candidate_meetings").select("*").in("candidate_id", clientIds),
    ]);

    // Fetch service_dates
    const serviceIds = (services.data || []).map(s => s.id);
    const serviceDates = serviceIds.length > 0
      ? await supabase.from("service_dates").select("*").in("service_id", serviceIds)
      : { data: [] };

    // Build flat rows - one row per client with related data serialized
    const rows = clients.map(client => {
      const clientServices = (services.data || []).filter(s => s.client_id === client.id);
      const clientInteractions = (interactions.data || []).filter(i => i.client_id === client.id);
      const clientDocuments = (documents.data || []).filter(d => d.client_id === client.id);
      const clientMeetings = (meetings.data || []).filter(m => m.candidate_id === client.id);
      const clientServiceDates = (serviceDates.data || []).filter(d =>
        clientServices.some(s => s.id === d.service_id)
      );

      return {
        // Client fields
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone || "",
        cpf: client.cpf || "",
        rg: client.rg || "",
        address: client.address || "",
        education: client.education || "",
        area_of_interest: client.area_of_interest || "",
        region: client.region || "",
        linkedin_url: client.linkedin_url || "",
        photo_url: client.photo_url || "",
        resume_url: client.resume_url || "",
        status: client.status || "",
        contract_number: client.contract_number || "",
        contract_start_date: client.contract_start_date || "",
        contract_end_date: client.contract_end_date || "",
        contract_duration_months: client.contract_duration_months ?? "",
        contract_value: client.contract_value ?? "",
        payment_method: client.payment_method || "",
        installments_count: client.installments_count ?? "",
        installments_due_day: client.installments_due_day ?? "",
        notes: client.notes || "",
        next_step: client.next_step || "",
        next_step_date: client.next_step_date || "",
        next_step_assigned_to: client.next_step_assigned_to || "",
        last_interaction_at: client.last_interaction_at || "",
        created_at: client.created_at,
        updated_at: client.updated_at,
        // Related data as JSON strings
        services: clientServices.length > 0 ? JSON.stringify(clientServices.map(s => ({
          tipo: s.service_type,
          ativo: s.is_active,
          agendado: s.scheduled_date,
          entregue: s.delivered_date,
          notas: s.notes,
          datas: clientServiceDates
            .filter(d => d.service_id === s.id)
            .map(d => ({ tipo: d.date_type, data: d.scheduled_date, notas: d.notes })),
        }))) : "",
        interactions: clientInteractions.length > 0 ? JSON.stringify(clientInteractions.map(i => ({
          tipo: i.interaction_type,
          notas: i.notes,
          data: i.created_at,
        }))) : "",
        documents: clientDocuments.length > 0 ? JSON.stringify(clientDocuments.map(d => ({
          nome: d.file_name,
          caminho: d.file_path,
          tamanho: d.file_size,
          data: d.created_at,
        }))) : "",
        meetings: clientMeetings.length > 0 ? JSON.stringify(clientMeetings.map(m => ({
          data: m.meeting_date,
          notas: m.notes,
        }))) : "",
      };
    });

    // Generate CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(";"),
      ...rows.map(row =>
        headers.map(h => {
          const val = String((row as any)[h] ?? "");
          // Escape quotes and wrap in quotes if contains separator, quotes, or newlines
          if (val.includes(";") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(";")
      ),
    ];

    const csvContent = "\uFEFF" + csvLines.join("\r\n"); // BOM for Excel UTF-8
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clientes_export_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: `${rows.length} cliente(s) exportado(s) com sucesso!` };
  } catch (error) {
    console.error("Error exporting clients as CSV:", error);
    return { success: false, message: "Erro ao gerar o CSV." };
  }
}
