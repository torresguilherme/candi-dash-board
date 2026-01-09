import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData, ClientForm } from "@/components/ClientForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { getTemperature } from "@/components/admin/TemperatureBadge";
import { differenceInDays, differenceInHours } from "date-fns";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
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
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
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
      let resumeUrl = undefined;
      let photoUrl = undefined;

      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, id);
      }

      if (data.photo instanceof File) {
        const photoExt = data.photo.name.split('.').pop();
        const photoName = `${user.id}/${id}-photo.${photoExt}`;
        await supabase.storage.from('client-photos').upload(photoName, data.photo, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('client-photos').getPublicUrl(photoName);
        photoUrl = publicUrl;
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
      if (photoUrl) updateData.photo_url = photoUrl;

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Cliente atualizado com sucesso!" });
      fetchClients();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
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
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async (data: ClientFormData) => {
    if (!user || !isAdmin) return;

    try {
      const clientId = crypto.randomUUID();
      let resumeUrl = null;
      let photoUrl = null;

      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, clientId);
      }

      if (data.photo instanceof File) {
        const photoExt = data.photo.name.split('.').pop();
        const photoName = `${user.id}/${clientId}-photo.${photoExt}`;
        await supabase.storage.from('client-photos').upload(photoName, data.photo, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('client-photos').getPublicUrl(photoName);
        photoUrl = publicUrl;
      }

      const { error } = await supabase
        .from('clients')
        .insert({
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
          photo_url: photoUrl,
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

      toast({ title: "Cliente adicionado com sucesso!" });
      setIsAddingClient(false);
      fetchClients();
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: "Erro ao adicionar cliente",
        description: error.message,
        variant: "destructive",
      });
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
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
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
    } catch (error: any) {
      console.error('Error deleting clients:', error);
      toast({
        title: "Erro ao excluir clientes",
        description: error.message,
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
            description="Sem contato há +7 dias"
            variant="danger"
          />
          <EngagementStatsCard
            title="Tarefas Hoje"
            value={stats.todayTasks}
            icon={Calendar}
            description="Próximos passos agendados"
            variant="warning"
          />
          <EngagementStatsCard
            title="Novos Leads"
            value={stats.newLeads}
            icon={Sparkles}
            description="Últimas 24 horas"
            variant="info"
          />
          <EngagementStatsCard
            title="Health Score"
            value={`${stats.healthScore}%`}
            icon={Activity}
            description="Clientes engajados"
            variant={stats.healthScore >= 70 ? "success" : stats.healthScore >= 40 ? "warning" : "danger"}
          />
        </div>

        {/* CRM Client Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-card to-muted/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">CRM de Clientes</CardTitle>
                <CardDescription>
                  Gerencie relacionamentos e acompanhe o engajamento dos clientes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {clients.length === 0 ? (
              <EmptyState onAddCandidate={() => setIsAddingClient(true)} />
            ) : (
              <CRMClientTable
                clients={clients}
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
