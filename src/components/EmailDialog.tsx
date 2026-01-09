import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientEmail: string;
}

export const EmailDialog = ({ open, onOpenChange, clientName, clientEmail }: EmailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      toast.error("Por favor, informe o assunto do email");
      return;
    }

    if (!message.trim()) {
      toast.error("Por favor, escreva uma mensagem");
      return;
    }

    try {
      setLoading(true);

      // Create FormData to send files
      const formData = new FormData();
      formData.append("clientName", clientName);
      formData.append("clientEmail", clientEmail);
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("timestamp", new Date().toISOString());

      // Append each file
      attachments.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const response = await fetch("https://n8n.neurogrid.com.br/webhook-test/MensagemComArquivo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem");
      }

      toast.success("Mensagem enviada com sucesso!");
      setSubject("");
      setMessage("");
      setAttachments([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSubject("");
      setMessage("");
      setAttachments([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Para:</span> {clientName}
            </p>
            <p className="text-sm text-muted-foreground">{clientEmail}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Assunto *</Label>
            <Input
              id="email-subject"
              placeholder="Assunto da mensagem"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-message">Mensagem *</Label>
            <Textarea
              id="email-message"
              placeholder="Escreva sua mensagem aqui..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-attachments">Anexos</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <Input
                  id="email-attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </label>
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                    <span className="truncate flex-1 mr-2">{file.name}</span>
                    <span className="text-muted-foreground text-xs mr-2">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
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

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
