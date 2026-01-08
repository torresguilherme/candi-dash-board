import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportExcelDialogProps {
  onImportComplete: () => void;
  userId: string;
}

interface ExcelRow {
  "Nome completo"?: string;
  "E-mail"?: string;
  "Telefone"?: string;
  "Área de Interrese"?: string;
  "Cidade"?: string;
  "Linkedin"?: string;
  "Dia do envio Curriculo"?: string;
  "Envio de Curriculo"?: string;
  [key: string]: any;
}

export function ImportExcelDialog({ onImportComplete, userId }: ImportExcelDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
      
      setPreview(jsonData.slice(0, 5)); // Preview first 5 rows
    } catch (error) {
      console.error("Error reading Excel file:", error);
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o arquivo Excel. Verifique se o formato está correto.",
        variant: "destructive",
      });
      setFile(null);
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    let success = 0;
    let failed = 0;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      for (const row of jsonData) {
        try {
          // Map Excel columns to database fields
          const clientData = {
            full_name: row["Nome completo"] || "",
            email: row["E-mail"] || "",
            phone: row["Telefone"] || null,
            area_of_interest: row["Área de Interrese"] || row["Área de Interesse"] || null,
            region: row["Cidade"] || null,
            linkedin_url: row["Linkedin"] || null,
            resume_url: row["Envio de Curriculo"] || null,
            notes: row["Dia do envio Curriculo"] ? `Data de envio do currículo: ${row["Dia do envio Curriculo"]}` : null,
            user_id: userId,
            status: "Novo",
          };

          // Validate required fields
          if (!clientData.full_name || !clientData.email) {
            failed++;
            continue;
          }

          const { error } = await supabase.from("clients").insert(clientData);

          if (error) {
            console.error("Error inserting client:", error);
            failed++;
          } else {
            success++;
          }
        } catch (error) {
          console.error("Error processing row:", error);
          failed++;
        }
      }

      setImportResult({ success, failed });
      
      if (success > 0) {
        toast({
          title: "Importação concluída!",
          description: `${success} cliente(s) importado(s) com sucesso.${failed > 0 ? ` ${failed} falharam.` : ""}`,
        });
        onImportComplete();
      } else {
        toast({
          title: "Nenhum cliente importado",
          description: "Verifique se o arquivo contém dados válidos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Upload className="h-5 w-5 mr-2" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Clientes do Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* File upload area */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            {file ? (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">Clique para trocar o arquivo</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">Arraste ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground">Suporta arquivos .xlsx e .xls</p>
              </div>
            )}
          </div>

          {/* Column mapping info */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Colunas esperadas no Excel:</p>
            <div className="grid grid-cols-2 gap-1 text-muted-foreground">
              <span>• Nome completo</span>
              <span>• E-mail</span>
              <span>• Telefone</span>
              <span>• Área de Interesse</span>
              <span>• Cidade</span>
              <span>• Linkedin</span>
              <span>• Dia do envio Curriculo</span>
              <span>• Envio de Curriculo (URL)</span>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <p className="font-medium mb-2">Prévia dos dados ({preview.length} primeiras linhas):</p>
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Nome</th>
                        <th className="text-left py-2 px-2">E-mail</th>
                        <th className="text-left py-2 px-2">Telefone</th>
                        <th className="text-left py-2 px-2">Cidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-2">{row["Nome completo"] || "-"}</td>
                          <td className="py-2 px-2">{row["E-mail"] || "-"}</td>
                          <td className="py-2 px-2">{row["Telefone"] || "-"}</td>
                          <td className="py-2 px-2">{row["Cidade"] || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              {importResult.success > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span>{importResult.success} importados</span>
                </div>
              )}
              {importResult.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{importResult.failed} falharam</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
