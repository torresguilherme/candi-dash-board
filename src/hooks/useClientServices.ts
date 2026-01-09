import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, isBefore, isToday, addDays } from "date-fns";

export interface ClientService {
  id: string;
  client_id: string;
  service_type: string;
  is_active: boolean;
  scheduled_date: string | null;
  delivered_date: string | null;
  notes: string | null;
  created_at: string;
  client?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export interface ServiceAlert {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  scheduledDate: string;
  daysUntilDue: number;
  status: "overdue" | "due_today" | "due_soon";
}

const SERVICE_LABELS: Record<string, string> = {
  career_mentoring: "Mentoria de Carreira",
  market_mapping: "Mapeamento de Mercado",
  support_material: "Material de Apoio",
  interview_pitch: "Pitch de Entrevista",
  resume_restructuring: "Reestruturação Curricular",
  behavioral_assessment: "Avaliação de Perfil Comportamental",
  brain_preference: "Avaliação Preferência Cerebral",
  company_referral: "Direcionamento para Empresas",
  linkedin_service: "LinkedIn",
  personal_marketing: "Marketing Pessoal",
  cnv: "CNV - Comunicação Não Violenta",
  persona_in_foco: "Persona in Foco",
  pnl_practitioner: "Formação em Practitioner em PNL",
};

export const getServiceLabel = (serviceType: string): string => {
  return SERVICE_LABELS[serviceType] || serviceType;
};

export const useClientServices = (clientId?: string) => {
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("client_services")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveService = async (
    clientId: string,
    serviceType: string,
    scheduledDate?: string | null,
    deliveredDate?: string | null,
    notes?: string | null
  ) => {
    try {
      // Check if service already exists
      const { data: existing } = await supabase
        .from("client_services")
        .select("id")
        .eq("client_id", clientId)
        .eq("service_type", serviceType)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("client_services")
          .update({
            scheduled_date: scheduledDate || null,
            delivered_date: deliveredDate || null,
            notes: notes || null,
            is_active: !deliveredDate,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("client_services").insert({
          client_id: clientId,
          service_type: serviceType,
          scheduled_date: scheduledDate || null,
          delivered_date: deliveredDate || null,
          notes: notes || null,
          is_active: !deliveredDate,
        });

        if (error) throw error;
      }

      await fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      throw error;
    }
  };

  const deleteService = async (clientId: string, serviceType: string) => {
    try {
      const { error } = await supabase
        .from("client_services")
        .delete()
        .eq("client_id", clientId)
        .eq("service_type", serviceType);

      if (error) throw error;
      await fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchServices();
  }, [clientId]);

  return { services, loading, fetchServices, saveService, deleteService };
};

export const useServiceAlerts = () => {
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      // Fetch pending services (with scheduled_date but no delivered_date)
      const { data: services, error } = await supabase
        .from("client_services")
        .select(`
          id,
          client_id,
          service_type,
          scheduled_date,
          clients!inner(full_name)
        `)
        .is("delivered_date", null)
        .not("scheduled_date", "is", null)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      const today = new Date();
      const alertList: ServiceAlert[] = [];

      for (const service of services || []) {
        if (!service.scheduled_date) continue;

        const scheduledDate = parseISO(service.scheduled_date);
        const daysUntilDue = differenceInDays(scheduledDate, today);

        let status: ServiceAlert["status"];
        if (isBefore(scheduledDate, today) && !isToday(scheduledDate)) {
          status = "overdue";
        } else if (isToday(scheduledDate)) {
          status = "due_today";
        } else if (daysUntilDue <= 7) {
          status = "due_soon";
        } else {
          continue; // Skip if more than 7 days away
        }

        alertList.push({
          id: service.id,
          clientId: service.client_id,
          clientName: (service.clients as any)?.full_name || "Cliente",
          serviceType: service.service_type,
          scheduledDate: service.scheduled_date,
          daysUntilDue,
          status,
        });
      }

      // Sort by urgency: overdue first, then due_today, then due_soon
      alertList.sort((a, b) => {
        const statusOrder = { overdue: 0, due_today: 1, due_soon: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.daysUntilDue - b.daysUntilDue;
      });

      setAlerts(alertList);
    } catch (error) {
      console.error("Error fetching service alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return { alerts, loading, fetchAlerts };
};
