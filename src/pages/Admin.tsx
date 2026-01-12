import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData, ClientForm } from "@/components/ClientForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  UserPlus, 
  AlertTriangle,
  Calendar,
  Sparkles,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EngagementStatsCard } from "@/components/admin/EngagementStatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingSkeleton } from "@/components/admin/LoadingSkeleton";
import { CRMClientTable, CRMClient } from "@/components/CRMClientTable";
import { EngagementChart } from "@/components/admin/EngagementChart";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { getTemperature } from "@/components/admin/TemperatureBadge";
import { ServiceAlertsCard } from "@/components/admin/ServiceAlertsCard";
import { differenceInDays, differenceInHours } from "date-fns";
import { getUserFriendlyError } from "@/lib/error-utils";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"attention" | "today" | "leads" | "health" | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/");
      } else if (!isAdmin) {
        navigate("/cadastro");
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área",
          variant: "destructive",
        });
      }
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchClients();
    }
  }, [user, isAdmin]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // client-photos bucket is private; generate signed URLs for display
      const withSignedPhotos = await Promise.all(
        (data || []).map(async (client) => {
          const raw = client.photo_url as string | null;
          if (!raw) return client;

          let path: string | null = null;

          if (raw.startsWith("http")) {
            const idx = raw.indexOf("client-photos/");
            if (idx !== -1) {
              path = raw.substring(idx + "client-photos/".length);
            }
          } else {
            // we store the storage path for new uploads
            path = raw;
          }

          if (!path) return client;

          const { data: signed, error: signErr } = await supabase.storage
            .from("client-photos")
            .createSignedUrl(path, 60 * 60);

          if (signErr || !signed?.signedUrl) return client;
          return { ...client, photo_url: signed.signedUrl };
        })
      );

      setClients(withSignedPhotos as any);
    } catch (error: unknown) {
      console.error("Error fetching clients");
      toast({
        title: "Erro ao carregar clientes",
        description: getUserFriendlyError(error, "Não foi possível carregar a lista de clientes. Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const saveClientServices = async (clientId: string, data: ClientFormData) => {
    const services = data.services || {};
    const serviceDates = data.service_dates || {};

    const serviceTypes = [
      "career_mentoring",
      "market_mapping",
      "support_material",
      "interview_pitch",
      "resume_restructuring",
      "behavioral_assessment",
      "brain_preference",
      "company_referral",
      "linkedin_service",
      "personal_marketing",
    ] as const;

    for (const serviceType of serviceTypes) {
      const isActive = services[serviceType];
      const scheduledKey = `${serviceType}_scheduled` as keyof typeof serviceDates;
      const deliveredKey = `${serviceType}_delivered` as keyof typeof serviceDates;

      const scheduledDate = serviceDates[scheduledKey] || null;
      const deliveredDate = serviceDates[deliveredKey] || null;

      // Check if service already exists
      const { data: existing, error: existingErr } = await supabase
        .from("client_services")
        .select("id")
        .eq("client_id", clientId)
        .eq("service_type", serviceType)
        .maybeSingle();

      if (existingErr) throw existingErr;

      if (isActive) {
        if (existing) {
          const { error: updErr } = await supabase
            .from("client_services")
            .update({
              scheduled_date: scheduledDate,
              delivered_date: deliveredDate,
              is_active: !deliveredDate,
            })
            .eq("id", existing.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase.from("client_services").insert({
            client_id: clientId,
            service_type: serviceType,
            scheduled_date: scheduledDate,
            delivered_date: deliveredDate,
            is_active: !deliveredDate,
          });
          if (insErr) throw insErr;
        }
      } else if (existing) {
        const { error: delErr } = await supabase.from("client_services").delete().eq("id", existing.id);
        if (delErr) throw delErr;
      }
    }
  };

  const uploadResume = async (file: File, userId: string, clientId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${clientId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleEditClient = async (id: string, data: ClientFormData) => {
    if (!user || !isAdmin) return;

    try {
      let resumeUrl: string | undefined = undefined;
      let photoPath: string | undefined = undefined;

      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, id);
      }

      if (data.photo instanceof File) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(data.photo.type)) {
          throw new Error("Formato de foto não suportado. Use JPG, PNG ou WebP.");
        }

        const ext = data.photo.type === "image/png" ? "png" : data.photo.type === "image/webp" ? "webp" : "jpg";
        const photoName = `${user.id}/${id}-photo.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("client-photos")
          .upload(photoName, data.photo, { upsert: true, contentType: data.photo.type });

        if (uploadErr) throw uploadErr;
        photoPath = photoName; // store path; we sign it when loading clients
      }

      const updateData: any = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        rg: data.rg || null,
        cpf: data.cpf || null,
        education: data.education || null,
        area_of_interest: data.area_of_interest || null,
        region: data.region || null,
        linkedin_url: data.linkedin_url || null,
        contract_number: data.contract_number || null,
        contract_start_date: data.contract_start_date || null,
        contract_end_date: data.contract_end_date || null,
        contract_value: data.contract_value ? parseFloat(data.contract_value) / 100 : null,
        payment_method: data.payment_method || null,
        installments_count: data.installments_count ? parseInt(data.installments_count) : null,
        installments_due_date: data.installments_due_date || null,
        notes: data.notes || null,
      };

      if (resumeUrl) updateData.resume_url = resumeUrl;
      if (photoPath) updateData.photo_url = photoPath;

      const { error } = await supabase.from("clients").update(updateData).eq("id", id);
      if (error) throw error;

      // Save services with dates (and propagate any errors)
      await saveClientServices(id, data);

      toast({ title: "Cliente atualizado com sucesso!" });
      await fetchClients();
    } catch (error: unknown) {
      console.error("Error updating client");
      toast({
        title: "Erro ao atualizar cliente",
        description: getUserFriendlyError(error, "Não foi possível atualizar o cliente. Tente novamente."),
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Cliente excluído com sucesso!",
      });

      fetchClients();
    } catch (error: unknown) {
      console.error('Error deleting client');
      toast({
        title: "Erro ao excluir cliente",
        description: getUserFriendlyError(error, "Não foi possível excluir o cliente. Tente novamente."),
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async (data: ClientFormData) => {
    if (!user || !isAdmin) return;

    try {
      const clientId = crypto.randomUUID();
      let resumeUrl: string | null = null;
      let photoPath: string | null = null;

      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, clientId);
      }

      if (data.photo instanceof File) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(data.photo.type)) {
          throw new Error("Formato de foto não suportado. Use JPG, PNG ou WebP.");
        }

        const ext = data.photo.type === "image/png" ? "png" : data.photo.type === "image/webp" ? "webp" : "jpg";
        const photoName = `${user.id}/${clientId}-photo.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("client-photos")
          .upload(photoName, data.photo, { upsert: true, contentType: data.photo.type });

        if (uploadErr) throw uploadErr;
        photoPath = photoName; // store path; we sign it when loading clients
      }

      const { error } = await supabase.from("clients").insert({
        id: clientId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        rg: data.rg || null,
        cpf: data.cpf || null,
        education: data.education || null,
        area_of_interest: data.area_of_interest || null,
        region: data.region || null,
        linkedin_url: data.linkedin_url || null,
        resume_url: resumeUrl,
        photo_url: photoPath,
        contract_number: data.contract_number || null,
        contract_start_date: data.contract_start_date || null,
        contract_end_date: data.contract_end_date || null,
        contract_value: data.contract_value ? parseFloat(data.contract_value) / 100 : null,
        payment_method: data.payment_method || null,
        installments_count: data.installments_count ? parseInt(data.installments_count) : null,
        installments_due_date: data.installments_due_date || null,
        notes: data.notes || null,
        user_id: user.id,
        status: "Novo",
      });

      if (error) throw error;

      // Save services with dates
      await saveClientServices(clientId, data);

      toast({ title: "Cliente adicionado com sucesso!" });
      setIsAddingClient(false);
      await fetchClients();
    } catch (error: unknown) {
      console.error("Error adding client");
      toast({
        title: "Erro ao adicionar cliente",
        description: getUserFriendlyError(error, "Não foi possível adicionar o cliente. Tente novamente."),
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) throw error;

      fetchClients();
      toast({
        title: "Status atualizado com sucesso!",
      });
    } catch (error: unknown) {
      console.error('Error updating status');
      toast({
        title: "Erro ao atualizar status",
        description: getUserFriendlyError(error, "Não foi possível atualizar o status. Tente novamente."),
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', ids);

      if (error) throw error;

      fetchClients();
      toast({
        title: "Clientes excluídos com sucesso!",
      });
    } catch (error: unknown) {
      console.error('Error deleting clients');
      toast({
        title: "Erro ao excluir clientes",
        description: getUserFriendlyError(error, "Não foi possível excluir os clientes. Tente novamente."),
        variant: "destructive",
      });
    }
  };

  // Calculate CRM engagement statistics
  const stats = useMemo(() => {
    const needsAttention = clients.filter(c => getTemperature(c.last_interaction_at) === "cold").length;
    const newLeads = clients.filter(c => {
      const hours = differenceInHours(new Date(), new Date(c.created_at));
      return hours <= 24;
    }).length;
    const hotClients = clients.filter(c => getTemperature(c.last_interaction_at) === "hot").length;
    const healthScore = clients.length > 0 ? Math.round((hotClients / clients.length) * 100) : 0;

    return {
      needsAttention,
      newLeads,
      todayTasks: clients.filter(c => c.next_step_date && differenceInDays(new Date(c.next_step_date), new Date()) === 0).length,
      healthScore,
    };
  }, [clients]);

  // Filter clients based on active filter
  const filteredClients = useMemo(() => {
    if (!activeFilter) return clients;

    switch (activeFilter) {
      case "attention":
        return clients.filter(c => getTemperature(c.last_interaction_at) === "cold");
      case "today":
        return clients.filter(c => c.next_step_date && differenceInDays(new Date(c.next_step_date), new Date()) === 0);
      case "leads":
        return clients.filter(c => {
          const hours = differenceInHours(new Date(), new Date(c.created_at));
          return hours <= 24;
        });
      case "health":
        return clients.filter(c => getTemperature(c.last_interaction_at) === "hot");
      default:
        return clients;
    }
  }, [clients, activeFilter]);

  const handleCardClick = (filter: "attention" | "today" | "leads" | "health") => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  if (loading || loadingClients) {
    return <LoadingSkeleton />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader onSignOut={signOut} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard de Clientes</h2>
            <p className="text-muted-foreground">
              Gerencie sua base de clientes da Person Corp
            </p>
          </div>
          <div className="flex gap-2">
            <ImportExcelDialog onImportComplete={fetchClients} userId={user.id} />
            <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
              <DialogTrigger asChild>
                <Button size="lg" className="hidden sm:flex">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 pt-4">
                  <ClientForm onSubmit={handleAddClient} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* CRM Engagement Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <EngagementStatsCard
            title="Atenção Necessária"
            value={stats.needsAttention}
            icon={AlertTriangle}
            description={activeFilter === "attention" ? "Clique para limpar filtro" : "Sem contato há +7 dias"}
            variant="danger"
            onClick={() => handleCardClick("attention")}
          />
          <EngagementStatsCard
            title="Tarefas Hoje"
            value={stats.todayTasks}
            icon={Calendar}
            description={activeFilter === "today" ? "Clique para limpar filtro" : "Próximos passos agendados"}
            variant="warning"
            onClick={() => handleCardClick("today")}
          />
          <EngagementStatsCard
            title="Novos Leads"
            value={stats.newLeads}
            icon={Sparkles}
            description={activeFilter === "leads" ? "Clique para limpar filtro" : "Últimas 24 horas"}
            variant="info"
            onClick={() => handleCardClick("leads")}
          />
          <EngagementStatsCard
            title="Health Score"
            value={`${stats.healthScore}%`}
            icon={Activity}
            description={activeFilter === "health" ? "Clique para limpar filtro" : "Clientes engajados"}
            variant={stats.healthScore >= 70 ? "success" : stats.healthScore >= 40 ? "warning" : "danger"}
            onClick={() => handleCardClick("health")}
          />
        </div>

        {/* Service Alerts and Engagement Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceAlertsCard onRefresh={fetchClients} />
          {clients.length > 0 && <EngagementChart clients={clients} />}
        </div>

        {/* CRM Client Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-card to-muted/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  CRM de Clientes
                  {activeFilter && (
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => setActiveFilter(null)}
                    >
                      {activeFilter === "attention" && "Atenção Necessária"}
                      {activeFilter === "today" && "Tarefas Hoje"}
                      {activeFilter === "leads" && "Novos Leads"}
                      {activeFilter === "health" && "Clientes Engajados"}
                      <span className="ml-1">×</span>
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeFilter 
                    ? `Exibindo ${filteredClients.length} de ${clients.length} clientes`
                    : "Gerencie relacionamentos e acompanhe o engajamento dos clientes"
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {clients.length === 0 ? (
              <EmptyState onAddCandidate={() => setIsAddingClient(true)} />
            ) : (
              <CRMClientTable
                clients={filteredClients}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkDelete={handleBulkDelete}
                onRefresh={fetchClients}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
