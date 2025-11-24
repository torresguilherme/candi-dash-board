import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CandidateForm, CandidateFormData } from "@/components/CandidateForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const uploadResume = async (file: File, candidateId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `public/${candidateId}.${fileExt}`;

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
    setSubmitting(true);
    
    try {
      const candidateId = crypto.randomUUID();
      let resumeUrl = null;

      // Upload resume if provided
      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, candidateId);
      }

      // Public UUID for non-authenticated submissions
      const publicUserId = '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase
        .from('candidates')
        .insert({
          id: candidateId,
          user_id: publicUserId,
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
        title: "Candidatura enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Erro ao enviar candidatura",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
                  Faça sua candidatura e junte-se ao nosso time
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              <LogIn className="h-4 w-4 mr-2" />
              Área Administrativa
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Candidatura</CardTitle>
              <CardDescription>
                Preencha seus dados para se candidatar às nossas vagas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateForm 
                onSubmit={handleAddCandidate}
                submitButtonText={submitting ? "Enviando..." : "Enviar Candidatura"}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
