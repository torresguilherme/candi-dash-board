import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData, ClientForm } from "@/components/ClientForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  MapPin, 
  Briefcase, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingSkeleton } from "@/components/admin/LoadingSkeleton";
import { ClientTable, Client } from "@/components/ClientTable";
import { ScrollArea } from "@/components/ui/scroll-area";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
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

  // Calculate statistics
  const stats = {
    total: clients.length,
    areas: new Set(clients.map(c => c.area_of_interest).filter(Boolean)).size,
    cities: new Set(clients.map(c => c.region).filter(Boolean)).size,
    inProcess: clients.filter(c => c.status === "Em Processo" || c.status === "Em Análise").length,
    incomplete: clients.filter(c => !c.cpf || !c.phone || !c.resume_url).length,
    active: clients.filter(c => c.status === "Ativo" || c.status === "Aprovado").length,
    newClients: clients.filter(c => c.status === "Novo").length,
    totalValue: clients.reduce((sum, c) => sum + (c.contract_value || 0), 0),
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

        {/* Statistics Cards - Top Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total de Clientes"
            value={stats.total}
            icon={Users}
            colorClass="text-primary bg-primary/10"
          />
          <StatsCard
            title="Clientes Ativos"
            value={stats.active}
            icon={CheckCircle2}
            colorClass="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950"
          />
          <StatsCard
            title="Em Processo"
            value={stats.inProcess}
            icon={Clock}
            colorClass="text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950"
          />
          <StatsCard
            title="Novos"
            value={stats.newClients}
            icon={TrendingUp}
            colorClass="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950"
          />
          <StatsCard
            title="Cadastros Incompletos"
            value={stats.incomplete}
            icon={AlertTriangle}
            colorClass="text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950"
          />
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.areas}</p>
                <p className="text-sm text-muted-foreground">Áreas de Atuação</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.cities}</p>
                <p className="text-sm text-muted-foreground">Cidades</p>
              </div>
            </CardContent>
          </Card>
          {stats.totalValue > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
                  <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.totalValue)}
                  </p>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Clients Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-card to-muted/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Lista de Clientes</CardTitle>
                <CardDescription>
                  Visualize, edite e gerencie todos os clientes cadastrados
                </CardDescription>
              </div>
              <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto sm:hidden">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {clients.length === 0 ? (
              <EmptyState onAddCandidate={() => setIsAddingClient(true)} />
            ) : (
              <ClientTable
                clients={clients}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkDelete={handleBulkDelete}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
