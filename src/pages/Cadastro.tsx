import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientForm, ClientFormData } from "@/components/ClientForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Cadastro = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, bucket: string, clientId: string, folder: string = "") => {
    const fileExt = file.name.split(".").pop();
    const fileName = folder ? `${folder}/${clientId}.${fileExt}` : `public/${clientId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return publicUrl;
  };

  const handleAddClient = async (data: ClientFormData) => {
    setSubmitting(true);

    try {
      const clientId = crypto.randomUUID();
      let resumeUrl = null;
      let photoUrl = null;

      if (data.resume instanceof File) {
        resumeUrl = await uploadFile(data.resume, "resumes", clientId);
      }

      if (data.photo instanceof File) {
        photoUrl = await uploadFile(data.photo, "client-photos", clientId);
      }

      const { error } = await supabase.from("clients").insert({
        id: clientId,
        user_id: null,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        rg: data.rg || null,
        cpf: data.cpf || null,
        photo_url: photoUrl,
        education: data.education || null,
        area_of_interest: data.area_of_interest || null,
        region: data.region || null,
        resume_url: resumeUrl,
        linkedin_url: data.linkedin_url || null,
      });

      if (error) throw error;

      // Send data to webhook
      try {
        await fetch("https://webhook.neurogrid.com.br/webhook/lrb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: clientId,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            rg: data.rg,
            cpf: data.cpf,
            education: data.education,
            area_of_interest: data.area_of_interest,
            region: data.region,
            linkedin_url: data.linkedin_url || null,
            resume_url: resumeUrl,
            photo_url: photoUrl,
            registration_date: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error("Error sending to webhook:", webhookError);
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        title: "Erro ao enviar cadastro",
        description: error.message,
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
            <ClientForm
              onSubmit={handleAddClient}
              submitButtonText={submitting ? "Enviando..." : "Enviar Candidatura"}
              isPublicForm={true}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Cadastro;
