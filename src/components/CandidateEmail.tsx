import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Paperclip, X } from "lucide-react";
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
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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

      // Convert attachments to base64
      const attachmentsData = await Promise.all(
        attachments.map(async (file) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]); // Remove data:mime;base64, prefix
            };
            reader.readAsDataURL(file);
          });

          return {
            filename: file.name,
            content: base64,
            contentType: file.type,
            size: file.size,
          };
        }),
      );

      const payload = {
        candidateId,
        candidateName,
        candidateEmail,
        subject: emailData.subject,
        message: emailData.message,
        attachments: attachmentsData,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("https://webhook.neurogrid.com.br/webhook/email", {
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
      setAttachments([]);
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

            <div className="space-y-2">
              <Label htmlFor="email-attachments">Anexos</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email-attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                  className="flex-1"
                />
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                      <span className="truncate flex-1">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        disabled={loading}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSendEmail} disabled={loading} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
