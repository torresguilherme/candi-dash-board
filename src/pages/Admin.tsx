import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CandidateTable } from "@/components/CandidateTable";
import { CandidateFormData } from "@/components/CandidateForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, LogOut, Home, UserPlus, MapPin, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CandidateForm } from "@/components/CandidateForm";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  status: string;
  city: string;
  resume_url: string | null;
  linkedin_url: string | null;
  registration_date: string;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
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
      fetchCandidates();
    }
  }, [user, isAdmin]);

  const fetchCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCandidates(data || []);
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Erro ao carregar candidatos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingCandidates(false);
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
        name: data.name,
        email: data.email,
        phone: data.phone,
        area: data.area,
        city: data.city,
        linkedin_url: data.linkedin_url || null,
      };

      if (resumeUrl) {
        updateData.resume_url = resumeUrl;
      }

      const { error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Candidato atualizado com sucesso!",
      });

      fetchCandidates();
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
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Candidato excluído com sucesso!",
      });

      fetchCandidates();
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
        .from('candidates')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          area: data.area,
          city: data.city,
          linkedin_url: data.linkedin_url || null,
          resume_url: resumeUrl,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Candidato adicionado com sucesso!",
      });

      setIsAddingCandidate(false);
      fetchCandidates();
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
        .from('candidates')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) throw error;

      fetchCandidates();
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
        .from('candidates')
        .delete()
        .in('id', ids);

      if (error) throw error;

      fetchCandidates();
    } catch (error: any) {
      console.error('Error deleting candidates:', error);
      toast({
        title: "Erro ao excluir candidatos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const transformCandidates = (dbCandidates: Candidate[]) => {
    return dbCandidates.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      area: c.area,
      status: c.status,
      city: c.city,
      linkedin_url: c.linkedin_url,
      resume_url: c.resume_url,
      registrationDate: new Date(c.registration_date),
    }));
  };

  if (loading || loadingCandidates) {
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
                  LRB Assessoria - Área Administrativa
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerenciar candidatos do sistema
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                <Home className="h-4 w-4 mr-2" />
                Início
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total de Candidatos</CardDescription>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl">{candidates.length}</CardTitle>
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
                {new Set(candidates.map(c => c.area)).size}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Cidades Diferentes</CardDescription>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <MapPin className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-3xl">
                {new Set(candidates.map(c => c.city)).size}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Candidatos</CardTitle>
                <CardDescription>
                  Gerencie todos os candidatos cadastrados no sistema
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
            <CandidateTable
              candidates={transformCandidates(candidates)}
              onEdit={handleEditCandidate}
              onDelete={handleDeleteCandidate}
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
