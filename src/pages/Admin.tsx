import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientTable, Client } from "@/components/ClientTable";
import { ClientFormData } from "@/components/ClientForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, LogOut, UserPlus, MapPin, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientForm } from "@/components/ClientForm";

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

      const transformedClients: Client[] = (data || []).map(c => ({
        id: c.id,
        full_name: c.full_name,
        email: c.email,
        phone: c.phone,
        area_of_interest: c.area_of_interest,
        status: c.status,
        region: c.region,
        linkedin_url: c.linkedin_url,
        resume_url: c.resume_url,
        photo_url: c.photo_url,
        registrationDate: new Date(c.created_at || new Date()),
        contract_number: c.contract_number,
      }));

      setClients(transformedClients);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
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

      toast({ title: "Cliente excluído com sucesso!" });
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
      const { error } = await supabase
        .from('clients')
        .insert({
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
          contract_value: data.contract_value ? parseFloat(data.contract_value) : null,
          payment_method: data.payment_method || null,
          installments_count: data.installments_count ? parseInt(data.installments_count) : null,
          installments_due_date: data.installments_due_date || null,
          notes: data.notes || null,
          user_id: user.id,
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
    } catch (error: any) {
      console.error('Error deleting clients:', error);
      toast({
        title: "Erro ao excluir clientes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || loadingClients) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Person Corp - Área Administrativa
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerenciar clientes do sistema
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/cadastro")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastro
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total de Clientes</CardDescription>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl">{clients.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Áreas Diferentes</CardDescription>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <CardTitle className="text-3xl">
                {new Set(clients.map(c => c.area_of_interest).filter(Boolean)).size}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Regiões Diferentes</CardDescription>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <MapPin className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-3xl">
                {new Set(clients.map(c => c.region).filter(Boolean)).size}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  Gerencie todos os clientes cadastrados no sistema
                </CardDescription>
              </div>
              <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                  </DialogHeader>
                  <ClientForm onSubmit={handleAddClient} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <ClientTable
              clients={clients}
              onEdit={() => {}}
              onDelete={handleDeleteClient}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
