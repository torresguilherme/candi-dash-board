import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Paperclip, X } from "lucide-react";

interface ClientEmailProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
}

interface Attachment {
  name: string;
  type: string;
  size: number;
  base64: string;
}

export function ClientEmail({ clientId, clientName, clientEmail }: ClientEmailProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        base64,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Preencha todos os campos",
        description: "Assunto e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://n8n.neurogrid.com.br/webhook-test/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          clientName,
          clientEmail,
          subject,
          message,
          attachments: attachments.map((a) => ({
            filename: a.name,
            mimeType: a.type,
            size: a.size,
            content: a.base64,
          })),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar email");
      }

      toast({
        title: "Email enviado!",
        description: `Email enviado para ${clientEmail}`,
      });

      setSubject("");
      setMessage("");
      setAttachments([]);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          Enviar email para: <span className="font-medium text-foreground">{clientEmail}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto do email"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          rows={6}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>Anexos</Label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <Input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <span>
                <Paperclip className="h-4 w-4 mr-2" />
                Anexar arquivos
              </span>
            </Button>
          </label>
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2 mt-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
              >
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-muted-foreground mx-2">
                  {formatFileSize(file.size)}
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

      <Button onClick={handleSend} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Enviar Email
          </>
        )}
      </Button>
    </div>
  );
}
