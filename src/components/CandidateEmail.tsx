import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface CandidateEmailProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
}

export const CandidateEmail = ({ candidateId, candidateName, candidateEmail }: CandidateEmailProps) => {
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
  });

  const handleSendEmail = async () => {
    if (!emailData.subject.trim()) {
      toast.error("Por favor, informe o assunto do email");
      return;
    }

    if (!emailData.message.trim()) {
      toast.error("Por favor, escreva uma mensagem");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        candidateId,
        candidateName,
        candidateEmail,
        subject: emailData.subject,
        message: emailData.message,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("https://n8n.neurogrid.com.br/webhook-test/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar email");
      }

      toast.success("Email encaminhado com sucesso!");
      setEmailData({ subject: "", message: "" });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Destinatário: {candidateEmail}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Assunto *</Label>
              <Input
                id="email-subject"
                placeholder="Assunto do email"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Mensagem *</Label>
              <Textarea
                id="email-message"
                placeholder="Escreva sua mensagem aqui..."
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                rows={8}
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handleSendEmail} 
              disabled={loading}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
