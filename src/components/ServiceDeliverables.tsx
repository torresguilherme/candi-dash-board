import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Mail, Trash2, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SendDeliverableEmailDialog } from "./SendDeliverableEmailDialog";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

interface ServiceDeliverablesProps {
  clientId: string;
  serviceType: string;
  clientName: string;
  clientEmail: string;
  serviceLabel: string;
}

export const ServiceDeliverables = ({
  clientId,
  serviceType,
  clientName,
  clientEmail,
  serviceLabel,
}: ServiceDeliverablesProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [emailAttachment, setEmailAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = async () => {
    try {
      // First get the service id
      const { data: service } = await supabase
        .from("client_services")
        .select("id")
        .eq("client_id", clientId)
        .eq("service_type", serviceType)
        .maybeSingle();

      if (!service) {
        setAttachments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("service_attachments")
        .select("*")
        .eq("service_id", service.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [clientId, serviceType]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Get or create the service record
      let { data: service } = await supabase
        .from("client_services")
        .select("id")
        .eq("client_id", clientId)
        .eq("service_type", serviceType)
        .maybeSingle();

      if (!service) {
        const { data: newService, error: insertError } = await supabase
          .from("client_services")
          .insert({
            client_id: clientId,
            service_type: serviceType,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        service = newService;
      }

      // Upload file to storage
      const filePath = `${clientId}/${serviceType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("service-deliverables")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save attachment record
      const { error: dbError } = await supabase
        .from("service_attachments")
        .insert({
          service_id: service!.id,
          file_name: file.name,
          file_url: filePath,
          file_type: file.type || null,
        });

      if (dbError) throw dbError;

      toast.success("Arquivo enviado com sucesso!");
      fetchAttachments();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo: " + (error.message || "Tente novamente"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("service-deliverables")
        .createSignedUrl(attachment.file_url, 300);

      if (error) throw error;

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    try {
      // Delete from storage
      await supabase.storage
        .from("service-deliverables")
        .remove([attachment.file_url]);

      // Delete record
      const { error } = await supabase
        .from("service_attachments")
        .delete()
        .eq("id", attachment.id);

      if (error) throw error;

      toast.success("Arquivo removido!");
      fetchAttachments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao remover arquivo");
    }
  };

  const getFileIcon = (fileType: string | null) => {
    return <FileText className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-3 pt-3 border-t border-dashed">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Entregáveis / Arquivos</p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Anexar Arquivo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">Nenhum arquivo anexado</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(att.file_type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{att.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(att.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(att)}
                  title="Baixar"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEmailAttachment(att)}
                  title="Enviar por e-mail"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(att)}
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {emailAttachment && (
        <SendDeliverableEmailDialog
          open={!!emailAttachment}
          onOpenChange={(open) => !open && setEmailAttachment(null)}
          clientName={clientName}
          clientEmail={clientEmail}
          serviceLabel={serviceLabel}
          fileName={emailAttachment.file_name}
          fileUrl={emailAttachment.file_url}
        />
      )}
    </div>
  );
};
