import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CandidateForm, CandidateFormData } from "@/components/CandidateForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Index = () => {
  const [submitting, setSubmitting] = useState(false);
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

      if (data.resume instanceof File) {
        resumeUrl = await uploadResume(data.resume, candidateId);
      }

      const { error } = await supabase
        .from('candidates')
        .insert({
          id: candidateId,
          user_id: null,
          name: data.name,
          email: data.email,
          phone: data.phone,
          area: data.area,
          city: data.city,
          linkedin_url: data.linkedin_url || null,
          resume_url: resumeUrl,
        });

      if (error) throw error;

      // Send data to webhook
      try {
        await fetch('https://n8n.neurogrid.com.br/webhook-test/lrb', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: candidateId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            area: data.area,
            city: data.city,
            linkedin_url: data.linkedin_url || null,
            resume_url: resumeUrl,
            registration_date: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Error sending to webhook:', webhookError);
        // Don't throw - we don't want to fail the submission if webhook fails
      }

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

  const scrollToForm = () => {
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LRB Assessoria" className="h-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
      </main>
    </div>
  );
};

export default Index;
