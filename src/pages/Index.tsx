import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CandidateForm, CandidateFormData } from "@/components/CandidateForm";
import { CandidateTable } from "@/components/CandidateTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  status: string;
  city: string;
  resume_url: string | null;
  registration_date: string;
}

const Index = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
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

  const handleAddCandidate = async (data: CandidateFormData) => {
    if (!user) return;

    try {
      const candidateId = crypto.randomUUID();
      let resumeUrl = null;

      // Upload resume if provided
      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, candidateId);
      }

      const { error } = await supabase
        .from('candidates')
        .insert({
          id: candidateId,
          user_id: user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          area: data.area,
          status: data.status,
          city: data.city,
          resume_url: resumeUrl,
          registration_date: data.registrationDate.toISOString().split('T')[0],
        });

      if (error) throw error;

      toast({
        title: "Candidato cadastrado com sucesso!",
        description: "Os dados foram salvos no sistema.",
      });

      fetchCandidates();
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Erro ao cadastrar candidato",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCandidate = async (id: string, data: CandidateFormData) => {
    if (!user || !isAdmin) return;

    try {
      let resumeUrl = undefined;

      // Upload new resume if provided
      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, user.id, id);
      }

      const updateData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        area: data.area,
        status: data.status,
        city: data.city,
        registration_date: data.registrationDate.toISOString().split('T')[0],
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

  const transformCandidates = (dbCandidates: Candidate[]) => {
    return dbCandidates.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      area: c.area,
      status: c.status,
      city: c.city,
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

  if (!user) {
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
                  LRB Assessoria
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema profissional para organizar seus processos seletivos
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Cadastrar Novo Candidato</CardTitle>
              <CardDescription>
                Preencha os dados do candidato no formulário abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateForm 
                onSubmit={handleAddCandidate} 
                existingEmails={candidates.map(c => c.email)}
              />
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Candidatos Cadastrados</CardTitle>
                <CardDescription>
                  {candidates.length === 0
                    ? "Nenhum candidato cadastrado"
                    : `${candidates.length} candidato${candidates.length !== 1 ? "s" : ""} no sistema`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CandidateTable
                  candidates={transformCandidates(candidates)}
                  onEdit={handleEditCandidate}
                  onDelete={handleDeleteCandidate}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
