import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CandidateFormData } from "@/components/CandidateForm";
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
  XCircle,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CandidateForm } from "@/components/CandidateForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingSkeleton } from "@/components/admin/LoadingSkeleton";
import { CandidateTable, Candidate } from "@/components/CandidateTable";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  area_of_interest: string | null;
  status: string;
  region: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  cpf: string | null;
  photo_url: string | null;
  education: string | null;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
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
        title: "Erro ao carregar candidatos",
        description: "Não foi possível carregar a lista de candidatos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const uploadResume = async (file: File, userId: string, candidateId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${candidateId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleEditCandidate = async (id: string, data: CandidateFormData) => {
    if (!user || !isAdmin) return;

    try {
      let resumeUrl = undefined;

      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, id);
      }

      const updateData: any = {
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        area_of_interest: data.area,
        region: data.city,
        linkedin_url: data.linkedin_url || null,
      };

      if (resumeUrl) {
        updateData.resume_url = resumeUrl;
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Candidato atualizado com sucesso!",
      });

      fetchClients();
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      toast({
        title: "Erro ao atualizar candidato",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Candidato excluído com sucesso!",
      });

      fetchClients();
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Erro ao excluir candidato",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddCandidate = async (data: CandidateFormData) => {
    if (!user || !isAdmin) return;

    try {
      let resumeUrl = null;

      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, crypto.randomUUID());
      }

      const { error } = await supabase
        .from('clients')
        .insert({
          full_name: data.name,
          email: data.email,
          phone: data.phone,
          area_of_interest: data.area,
          region: data.city,
          linkedin_url: data.linkedin_url || null,
          resume_url: resumeUrl,
          user_id: user.id,
          status: "Novo",
        });

      if (error) throw error;

      toast({
        title: "Candidato adicionado com sucesso!",
      });

      setIsAddingCandidate(false);
      fetchClients();
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Erro ao adicionar candidato",
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
      console.error('Error deleting candidates:', error);
      toast({
        title: "Erro ao excluir candidatos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const transformClients = (dbClients: Client[]): Candidate[] => {
    return dbClients.map(c => ({
      id: c.id,
      name: c.full_name,
      email: c.email,
      phone: c.phone || "",
      area: c.area_of_interest || "Não informado",
      status: c.status,
      city: c.region || "Não informado",
      linkedin_url: c.linkedin_url,
      resume_url: c.resume_url,
      registrationDate: new Date(c.created_at),
    }));
  };

  // Calculate statistics
  const stats = {
    total: clients.length,
    areas: new Set(clients.map(c => c.area_of_interest).filter(Boolean)).size,
    cities: new Set(clients.map(c => c.region).filter(Boolean)).size,
    inProcess: clients.filter(c => c.status === "Em Análise" || c.status === "Entrevista Agendada").length,
    incomplete: clients.filter(c => !c.cpf || !c.phone || !c.resume_url).length,
    approved: clients.filter(c => c.status === "Aprovado").length,
    rejected: clients.filter(c => c.status === "Rejeitado").length,
    newCandidates: clients.filter(c => c.status === "Novo").length,
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
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Gerencie candidatos e clientes do sistema
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total de Candidatos"
            value={stats.total}
            icon={Users}
            colorClass="text-primary bg-primary/10"
          />
          <StatsCard
            title="Áreas Diferentes"
            value={stats.areas}
            icon={Briefcase}
            colorClass="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950"
          />
          <StatsCard
            title="Cidades Diferentes"
            value={stats.cities}
            icon={MapPin}
            colorClass="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950"
          />
          <StatsCard
            title="Em Processo"
            value={stats.inProcess}
            icon={Clock}
            colorClass="text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950"
          />
          <StatsCard
            title="Cadastros Incompletos"
            value={stats.incomplete}
            icon={AlertTriangle}
            colorClass="text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950"
          />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newCandidates}</p>
                <p className="text-xs text-muted-foreground">Novos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProcess}</p>
                <p className="text-xs text-muted-foreground">Em Análise</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejeitados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Lista de Candidatos</CardTitle>
                <CardDescription>
                  Visualize, edite e gerencie todos os candidatos cadastrados
                </CardDescription>
              </div>
              <Dialog open={isAddingCandidate} onOpenChange={setIsAddingCandidate}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Candidato
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Candidato</DialogTitle>
                  </DialogHeader>
                  <CandidateForm onSubmit={handleAddCandidate} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <EmptyState onAddCandidate={() => setIsAddingCandidate(true)} />
            ) : (
              <CandidateTable
                candidates={transformClients(clients)}
                onEdit={handleEditCandidate}
                onDelete={handleDeleteCandidate}
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
