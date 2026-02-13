import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SendDeliverableEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientEmail: string;
  serviceLabel: string;
  fileName: string;
  fileUrl: string;
}

export const SendDeliverableEmailDialog = ({
  open,
  onOpenChange,
  clientName,
  clientEmail,
  serviceLabel,
  fileName,
  fileUrl,
}: SendDeliverableEmailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    `Olá ${clientName},\n\nSegue em anexo o documento referente à etapa "${serviceLabel}".\n\nAtenciosamente.`
  );

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Por favor, escreva uma mensagem");
      return;
    }

    try {
      setLoading(true);

      // Get a signed URL for the file
      const { data: signedData, error: signError } = await supabase.storage
        .from("service-deliverables")
        .createSignedUrl(fileUrl, 604800); // 7 days

      if (signError) throw signError;

      // Send via webhook (same pattern as EmailDialog)
      const formData = new FormData();
      formData.append("clientName", clientName);
      formData.append("clientEmail", clientEmail);
      formData.append("subject", `Entregável: ${serviceLabel} - ${fileName}`);
      formData.append("message", message);
      formData.append("fileUrl", signedData.signedUrl);
      formData.append("fileName", fileName);
      formData.append("timestamp", new Date().toISOString());

      const response = await fetch(
        "https://webhook.neurogrid.com.br/webhook/MensagemComArquivo",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Erro ao enviar");

      toast.success("Relatório enviado com sucesso para " + clientName);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending deliverable email:", error);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Enviar Relatório para {clientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="text-sm">
              <span className="font-medium">Para:</span> {clientName} ({clientEmail})
            </p>
            <p className="text-sm">
              <span className="font-medium">Arquivo:</span> {fileName}
            </p>
            <p className="text-sm">
              <span className="font-medium">Etapa:</span> {serviceLabel}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={loading}>
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
