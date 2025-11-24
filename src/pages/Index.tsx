import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CandidateForm, CandidateFormData } from "@/components/CandidateForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import heroBackground from "@/assets/hero-background.jpg";

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
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${heroBackground})`,
        }}
      >
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-10">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  LRB ASSESSORIA
                </h1>
              </div>
              <Button 
                onClick={scrollToForm}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
              >
                Quero me recolocar
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="font-serif-display text-7xl md:text-8xl font-bold mb-8 tracking-tight">
            HEADHUNTER
          </h2>
          <p className="text-2xl md:text-3xl mb-12 text-white/90 max-w-3xl mx-auto">
            Trilhas personalizadas para desenvolver você e sua equipe
          </p>
          <Button 
            onClick={scrollToForm}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg px-12 py-6 rounded-full"
          >
            Cadastre sua candidatura
          </Button>
        </div>
      </section>

      {/* Form Section */}
      <section id="form-section" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-2">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold">Cadastrar Candidatura</CardTitle>
                <CardDescription className="text-lg mt-2">
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
        </div>
      </section>
    </div>
  );
};

export default Index;
