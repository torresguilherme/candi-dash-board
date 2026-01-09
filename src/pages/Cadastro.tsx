import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CandidateForm, CandidateFormData } from "@/components/CandidateForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { getUserFriendlyError, sanitizeForExternalApi } from "@/lib/error-utils";

const Cadastro = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const uploadResume = async (file: File, submissionId: string) => {
    const fileExt = file.name.split(".").pop();
    // Use public-submissions folder for unauthenticated uploads
    const fileName = `public-submissions/${submissionId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Return just the path, not a public URL (bucket is now private)
    return fileName;
  };

  const handleAddCandidate = async (data: CandidateFormData) => {
    setSubmitting(true);

    try {
      const submissionId = crypto.randomUUID();
      let resumePath = null;

      if (data.resume instanceof File) {
        resumePath = await uploadResume(data.resume, submissionId);
      }

      // Insert into public_submissions table (designed for unauthenticated access)
      const { error } = await supabase.from("public_submissions").insert({
        id: submissionId,
        full_name: data.name,
        email: data.email,
        phone: data.phone || null,
        area_of_interest: data.area || null,
        region: data.city || null,
        linkedin_url: data.linkedin_url || null,
        resume_path: resumePath,
        status: "pending",
      });

      if (error) throw error;

      // Send sanitized data to webhook
      try {
        const sanitizedData = sanitizeForExternalApi({
          id: submissionId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          area: data.area,
          city: data.city,
          linkedin_url: data.linkedin_url || null,
          resume_path: resumePath,
          registration_date: new Date().toISOString(),
        });

        await fetch("https://webhook.neurogrid.com.br/webhook/lrb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sanitizedData),
        });
      } catch (webhookError) {
        // Log webhook errors but don't expose to user
        console.error("Webhook notification failed");
      }

      setSubmitted(true);
    } catch (error: unknown) {
      console.error("Submission failed");
      toast({
        title: "Erro ao enviar candidatura",
        description: getUserFriendlyError(error, "Não foi possível enviar sua candidatura. Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Person Corp" className="h-10" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl">Cadastro Enviado com Sucesso!</CardTitle>
              <CardDescription className="text-base mt-2">
                Recebemos sua candidatura e entraremos em contato em breve.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full sm:w-auto"
              >
                Novo Cadastro
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Person Corp" className="h-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Candidatura</CardTitle>
            <CardDescription>Preencha seus dados para se candidatar às nossas vagas</CardDescription>
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

export default Cadastro;
