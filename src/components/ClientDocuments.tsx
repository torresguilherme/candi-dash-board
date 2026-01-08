import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

interface ClientDocumentsProps {
  clientId: string;
}

export function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar documentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("candidate-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("candidate-documents")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("client_documents")
        .insert({
          client_id: clientId,
          file_name: file.name,
          file_path: publicUrl,
          file_size: file.size,
        });

      if (insertError) throw insertError;

      toast({ title: "Documento enviado com sucesso!" });
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      const { error } = await supabase
        .from("client_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast({ title: "Documento excluído!" });
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <Input
            type="file"
            className="cursor-pointer"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum documento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{doc.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)} •{" "}
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
