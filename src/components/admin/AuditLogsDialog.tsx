import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, User, Clock, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

interface AuditLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
  create: { label: "Adicionou", icon: "➕", color: "text-green-600 bg-green-50" },
  update: { label: "Editou", icon: "✏️", color: "text-blue-600 bg-blue-50" },
  delete: { label: "Removeu", icon: "🗑️", color: "text-red-600 bg-red-50" },
  view: { label: "Visualizou", icon: "👁️", color: "text-gray-600 bg-gray-50" },
  import: { label: "Importou", icon: "📥", color: "text-purple-600 bg-purple-50" },
  export: { label: "Exportou", icon: "📤", color: "text-orange-600 bg-orange-50" },
};

const entityLabels: Record<string, string> = {
  client: "cliente",
  service: "serviço",
  document: "documento",
  meeting: "reunião",
  interaction: "interação",
  submission: "candidatura",
};

const formatActionMessage = (action: string, entityType: string, entityName?: string | null) => {
  const actionInfo = actionLabels[action] || { label: action, icon: "📋", color: "text-gray-600 bg-gray-50" };
  const entity = entityLabels[entityType] || entityType;
  const name = entityName ? `"${entityName}"` : `um ${entity}`;
  return `${actionInfo.icon} ${actionInfo.label} ${name}`;
};

export const AuditLogsDialog = ({ open, onOpenChange }: AuditLogsDialogProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesEntity = filterEntity === "all" || log.entity_type === filterEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Atividades
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="create">Adições</SelectItem>
              <SelectItem value="update">Edições</SelectItem>
              <SelectItem value="delete">Remoções</SelectItem>
              <SelectItem value="import">Importações</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[450px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade encontrada
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const actionInfo = actionLabels[log.action] || {
                  label: log.action,
                  icon: "📋",
                  color: "text-gray-600 bg-gray-50",
                };

                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${actionInfo.color} transition-colors`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {formatActionMessage(log.action, log.entity_type, log.entity_name)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user_email?.split('@')[0] || "Usuário"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
