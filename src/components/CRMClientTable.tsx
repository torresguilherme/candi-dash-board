import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  ExternalLink,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FolderOpen,
  MessageCircle,
  Mail,
  FileText,
  AlertCircle,
  Plus,
  Phone,
  Briefcase,
  GraduationCap,
  FileCheck,
  DollarSign,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getServiceLabel } from "@/hooks/useClientServices";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CandidateFolderDialog } from "./CandidateFolderDialog";
import { CandidateAvatar } from "./admin/CandidateAvatar";
import { ClientForm, ClientFormData } from "./ClientForm";
import { TemperatureBadge, getTemperature, getRelativeTime } from "./admin/TemperatureBadge";
import { QuickFilters, QuickFilterType } from "./admin/QuickFilters";
import { InteractionLogDialog } from "./admin/InteractionLogDialog";
import { EmailDialog } from "./EmailDialog";
import { Badge } from "@/components/ui/badge";
import { differenceInHours } from "date-fns";

export interface CRMClient {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  area_of_interest: string | null;
  status: string;
  region: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  cpf: string | null;
  rg: string | null;
  address: string | null;
  photo_url: string | null;
  education: string | null;
  contract_value: number | null;
  contract_number: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  payment_method: string | null;
  installments_count: number | null;
  installments_due_date: string | null;
  notes: string | null;
  last_interaction_at: string | null;
  next_step: string | null;
  next_step_date: string | null;
}

interface CRMClientTableProps {
  clients: CRMClient[];
  onEdit: (id: string, data: ClientFormData) => void | Promise<void>;
  onDelete: (id: string) => void;
  onBulkStatusChange?: (ids: string[], newStatus: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRefresh: () => void;
}

type SortField = "full_name" | "created_at" | "last_interaction_at";
type SortOrder = "asc" | "desc";

export const CRMClientTable = ({
  clients,
  onEdit,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
  onRefresh,
}: CRMClientTableProps) => {
  const [editingClient, setEditingClient] = useState<CRMClient | null>(null);
  const [editingServices, setEditingServices] = useState<Record<string, any>>({});
  const [loadingServices, setLoadingServices] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [sortField, setSortField] = useState<SortField>("last_interaction_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [viewingClient, setViewingClient] = useState<CRMClient | null>(null);
  const [viewingServices, setViewingServices] = useState<any[]>([]);
  const [loadingViewServices, setLoadingViewServices] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [folderClient, setFolderClient] = useState<CRMClient | null>(null);
  const [loggingClient, setLoggingClient] = useState<CRMClient | null>(null);
  const [emailClient, setEmailClient] = useState<CRMClient | null>(null);
  const itemsPerPage = 10;

  // Fetch services for a client
  const fetchClientServices = async (clientId: string) => {
    const { data } = await supabase
      .from("client_services")
      .select("*")
      .eq("client_id", clientId);
    return data || [];
  };

  // Open edit dialog and load services
  const openEditDialog = async (client: CRMClient) => {
    setEditingClient(client);
    setEditingServices({});
    setLoadingServices(true);
    
    try {
      const servicesData = await fetchClientServices(client.id);
      
      // Course service types
      const courseTypes = ["cnv", "persona_in_foco", "pnl_practitioner"];
      
      // Convert services array to form format (separate services and courses)
      const servicesMap: Record<string, boolean> = {};
      const coursesMap: Record<string, boolean> = {};
      const serviceDatesMap: Record<string, string> = {};
      
      servicesData.forEach((s) => {
        if (courseTypes.includes(s.service_type)) {
          coursesMap[s.service_type] = true;
        } else {
          servicesMap[s.service_type] = true;
        }
        if (s.scheduled_date) serviceDatesMap[`${s.service_type}_scheduled`] = s.scheduled_date;
        if (s.delivered_date) serviceDatesMap[`${s.service_type}_delivered`] = s.delivered_date;
      });
      
      setEditingServices({ services: servicesMap, courses: coursesMap, service_dates: serviceDatesMap });
    } finally {
      setLoadingServices(false);
    }
  };

  // Open view drawer and load services
  const openViewDrawer = async (client: CRMClient) => {
    setViewingClient(client);
    setViewingServices([]);
    setLoadingViewServices(true);
    
    try {
      const services = await fetchClientServices(client.id);
      setViewingServices(services);
    } finally {
      setLoadingViewServices(false);
    }
  };

  const isIncomplete = (client: CRMClient) => {
    return !client.cpf || !client.phone || !client.resume_url;
  };

  const isNewLead = (client: CRMClient) => {
    const hours = differenceInHours(new Date(), new Date(client.created_at));
    return hours <= 24;
  };

  const filterCounts = useMemo(() => {
    return {
      all: clients.length,
      hot: clients.filter((c) => getTemperature(c.last_interaction_at) === "hot").length,
      warm: clients.filter((c) => getTemperature(c.last_interaction_at) === "warm").length,
      cold: clients.filter((c) => getTemperature(c.last_interaction_at) === "cold").length,
      new: clients.filter((c) => isNewLead(c)).length,
      noNextStep: clients.filter((c) => !c.next_step).length,
    };
  }, [clients]);

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch =
        client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.includes(searchQuery));

      if (!matchesSearch) return false;

      switch (quickFilter) {
        case "hot":
          return getTemperature(client.last_interaction_at) === "hot";
        case "warm":
          return getTemperature(client.last_interaction_at) === "warm";
        case "cold":
          return getTemperature(client.last_interaction_at) === "cold";
        case "new":
          return isNewLead(client);
        case "no-next-step":
          return !client.next_step;
        default:
          return true;
      }
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === "full_name") {
        comparison = (a.full_name || "").localeCompare(b.full_name || "");
      } else if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "last_interaction_at") {
        const aTime = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0;
        const bTime = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0;
        comparison = aTime - bTime;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [clients, searchQuery, quickFilter, sortField, sortOrder]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClients.slice(startIndex, endIndex);
  }, [filteredAndSortedClients, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = async (data: ClientFormData) => {
    if (!editingClient) return;

    try {
      await onEdit(editingClient.id, data);
      setEditingClient(null);
    } catch {
      // keep dialog open so user can correct and try again
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
      toast.success("Cliente excluído com sucesso!");
    }
  };

  const handleDownloadResume = async (resumeUrl: string, clientName: string) => {
    try {
      const response = await fetch(resumeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `curriculo-${clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Currículo baixado com sucesso!");
    } catch {
      toast.error("Erro ao baixar currículo");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(paginatedClients.map((c) => c.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedClients);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedClients(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedClients.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedClients));
      setSelectedClients(new Set());
      toast.success(`${selectedClients.size} cliente(s) excluído(s) com sucesso!`);
    }
  };

  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedClients.size > 0 && onBulkStatusChange) {
      onBulkStatusChange(Array.from(selectedClients), newStatus);
      setSelectedClients(new Set());
      toast.success(`Status de ${selectedClients.size} cliente(s) atualizado!`);
    }
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Temperatura", "Última Interação", "Próximo Passo"];
    const rows = filteredAndSortedClients.map((c) => [
      c.full_name,
      c.email,
      c.phone || "",
      getTemperature(c.last_interaction_at),
      getRelativeTime(c.last_interaction_at),
      c.next_step || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-clientes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Lista exportada com sucesso!");
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá ${name}, tudo bem?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  if (clients.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 mb-6">
        {/* Bulk Actions Bar */}
        {selectedClients.size > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-medium">{selectedClients.size} cliente(s) selecionado(s)</p>
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Alterar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Em Processo">Em Processo</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClients(new Set())}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <QuickFilters activeFilter={quickFilter} onFilterChange={setQuickFilter} counts={filterCounts} />

        {/* Search and Export */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Button variant="outline" onClick={exportToCSV} className="h-10">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {filteredAndSortedClients.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedClients.length)} de{" "}
            {filteredAndSortedClients.length} cliente{filteredAndSortedClients.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {filteredAndSortedClients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-muted/20">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12 h-12">
                    <Checkbox
                      checked={
                        paginatedClients.length > 0 && paginatedClients.every((c) => selectedClients.has(c.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-24">Saúde</TableHead>
                  <TableHead className="min-w-[220px]">
                    <button
                      onClick={() => handleSort("full_name")}
                      className="flex items-center gap-1 font-semibold hover:text-foreground"
                    >
                      Cliente
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[140px]">
                    <button
                      onClick={() => handleSort("last_interaction_at")}
                      className="flex items-center gap-1 font-semibold hover:text-foreground"
                    >
                      Última Interação
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[160px]">Próximo Passo</TableHead>
                  <TableHead className="text-center">Ações Rápidas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => {
                  const incomplete = isIncomplete(client);
                  const isNew = isNewLead(client);

                  return (
                    <TableRow
                      key={client.id}
                      className="hover:bg-muted/20 group border-b border-border/50"
                    >
                      <TableCell className="py-4">
                        <Checkbox
                          checked={selectedClients.has(client.id)}
                          onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <TemperatureBadge lastInteractionAt={client.last_interaction_at} />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <CandidateAvatar name={client.full_name} photoUrl={client.photo_url} size="md" />
                            {incomplete && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center cursor-help">
                                    <AlertCircle className="h-3 w-3 text-white" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Cadastro incompleto</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openViewDrawer(client)}
                                className="font-medium hover:text-primary transition-colors truncate"
                              >
                                {client.full_name}
                              </button>
                              {isNew && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                                  NOVO
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <p className="text-sm font-medium">{getRelativeTime(client.last_interaction_at)}</p>
                      </TableCell>
                      <TableCell className="py-4">
                        {client.next_step ? (
                          <Badge variant="outline" className="text-xs">
                            {client.next_step}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Não definido</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick action buttons - always visible */}
                          {client.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                                  onClick={() => openWhatsApp(client.phone!, client.full_name)}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>WhatsApp</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                onClick={() => setEmailClient(client)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>E-mail</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-purple-600 hover:bg-purple-100 hover:text-purple-700"
                                onClick={() => setLoggingClient(client)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Registrar Interação</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10"
                                onClick={() => openViewDrawer(client)}
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                                onClick={() => setFolderClient(client)}
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Documentos</TooltipContent>
                          </Tooltip>

                          {client.resume_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                                  onClick={() => window.open(client.resume_url!, "_blank", "noopener,noreferrer")}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver Currículo</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={() => openEditDialog(client)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeletingId(client.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden space-y-3">
            {paginatedClients.map((client) => {
              const incomplete = isIncomplete(client);
              const isNew = isNewLead(client);

              return (
                <div key={client.id} className="rounded-xl border bg-card p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedClients.has(client.id)}
                      onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="relative">
                      <CandidateAvatar name={client.full_name} photoUrl={client.photo_url} size="lg" />
                      {incomplete && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <AlertCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => openViewDrawer(client)}
                          className="font-semibold text-base hover:text-primary block truncate"
                        >
                          {client.full_name}
                        </button>
                        {isNew && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                            NOVO
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    </div>
                    <TemperatureBadge lastInteractionAt={client.last_interaction_at} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm pl-10">
                    <div>
                      <p className="text-muted-foreground text-xs">Última Interação</p>
                      <p className="font-medium">{getRelativeTime(client.last_interaction_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Próximo Passo</p>
                      <p>{client.next_step || "—"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t pl-10">
                    {client.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWhatsApp(client.phone!, client.full_name)}
                        className="flex-1 text-green-600 hover:bg-green-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailClient(client)}
                      className="flex-1 text-blue-600 hover:bg-blue-50"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      E-mail
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setLoggingClient(client)}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Log
                    </Button>
                  </div>

                  <div className="flex gap-1 pl-10">
                    <Button variant="ghost" size="sm" onClick={() => openViewDrawer(client)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(client)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(client.id)}
                      className="text-destructive ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-9"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <span className="sm:hidden text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* View Client Drawer */}
      <Drawer open={!!viewingClient} onOpenChange={() => setViewingClient(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Detalhes do Cliente</DrawerTitle>
          </DrawerHeader>
          {viewingClient && (
            <div className="px-4 pb-6 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-4 pb-4 border-b">
                <CandidateAvatar name={viewingClient.full_name} photoUrl={viewingClient.photo_url} size="lg" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{viewingClient.full_name}</h3>
                  <p className="text-muted-foreground">{viewingClient.email}</p>
                </div>
                <TemperatureBadge lastInteractionAt={viewingClient.last_interaction_at} />
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Dados de Contato
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Telefone:</span> {viewingClient.phone || "—"}</div>
                  <div><span className="text-muted-foreground">CPF:</span> {viewingClient.cpf || "—"}</div>
                  <div><span className="text-muted-foreground">RG:</span> {viewingClient.rg || "—"}</div>
                  <div><span className="text-muted-foreground">Região:</span> {viewingClient.region || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {viewingClient.address || "—"}</div>
                  <div><span className="text-muted-foreground">Formação:</span> {viewingClient.education || "—"}</div>
                  <div><span className="text-muted-foreground">Área:</span> {viewingClient.area_of_interest || "—"}</div>
                  {viewingClient.linkedin_url && (
                    <div className="col-span-2">
                      <a href={viewingClient.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Ver LinkedIn <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados do Contrato */}
              {(viewingClient.contract_number || viewingClient.contract_value) && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Contrato
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Nº Contrato:</span> {viewingClient.contract_number || "—"}</div>
                    <div><span className="text-muted-foreground">Valor:</span> {viewingClient.contract_value ? `R$ ${viewingClient.contract_value.toLocaleString("pt-BR")}` : "—"}</div>
                    <div><span className="text-muted-foreground">Início:</span> {viewingClient.contract_start_date ? format(new Date(viewingClient.contract_start_date), "dd/MM/yyyy") : "—"}</div>
                    <div><span className="text-muted-foreground">Fim:</span> {viewingClient.contract_end_date ? format(new Date(viewingClient.contract_end_date), "dd/MM/yyyy") : "—"}</div>
                    <div><span className="text-muted-foreground">Pagamento:</span> {viewingClient.payment_method || "—"}</div>
                    <div><span className="text-muted-foreground">Parcelas:</span> {viewingClient.installments_count || "—"}</div>
                  </div>
                </div>
              )}

              {/* Serviços Contratados */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Serviços Contratados
                </h4>
                {loadingViewServices ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando serviços...</span>
                  </div>
                ) : viewingServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingServices.map((s) => (
                      <Badge key={s.id} variant={s.delivered_date ? "default" : "secondary"} className="text-xs">
                        {s.delivered_date ? <FileCheck className="h-3 w-3 mr-1" /> : null}
                        {getServiceLabel(s.service_type)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum serviço contratado</p>
                )}
              </div>

              {/* Observações */}
              {viewingClient.notes && (
                <div className="space-y-2 pt-3 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewingClient.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => { setViewingClient(null); setFolderClient(viewingClient); }}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Documentos
                </Button>
                {viewingClient.resume_url && (
                  <Button variant="outline" onClick={() => window.open(viewingClient.resume_url!, "_blank", "noopener,noreferrer")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Currículo
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setLoggingClient(viewingClient)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Interação
                </Button>
                <Button variant="outline" onClick={() => openEditDialog(viewingClient)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {editingClient && loadingServices ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Carregando dados do cliente...</p>
              </div>
            ) : editingClient ? (
              <ClientForm
                onSubmit={handleEdit}
                defaultValues={{
                  full_name: editingClient.full_name,
                  email: editingClient.email,
                  phone: editingClient.phone || "",
                  address: editingClient.address || "",
                  rg: editingClient.rg || "",
                  cpf: editingClient.cpf || "",
                  education: editingClient.education || "",
                  area_of_interest: editingClient.area_of_interest || "",
                  region: editingClient.region || "",
                  linkedin_url: editingClient.linkedin_url || "",
                  contract_number: editingClient.contract_number || "",
                  contract_start_date: editingClient.contract_start_date || "",
                  contract_end_date: editingClient.contract_end_date || "",
                  contract_value: editingClient.contract_value ? String(editingClient.contract_value * 100) : "",
                  payment_method: editingClient.payment_method || "",
                  installments_count: editingClient.installments_count ? String(editingClient.installments_count) : "",
                  installments_due_date: editingClient.installments_due_date || "",
                  notes: editingClient.notes || "",
                  services: {
                    career_mentoring: editingServices.services?.career_mentoring || false,
                    market_mapping: editingServices.services?.market_mapping || false,
                    support_material: editingServices.services?.support_material || false,
                    interview_pitch: editingServices.services?.interview_pitch || false,
                    resume_restructuring: editingServices.services?.resume_restructuring || false,
                    behavioral_assessment: editingServices.services?.behavioral_assessment || false,
                    brain_preference: editingServices.services?.brain_preference || false,
                    company_referral: editingServices.services?.company_referral || false,
                    linkedin_service: editingServices.services?.linkedin_service || false,
                    personal_marketing: editingServices.services?.personal_marketing || false,
                  },
                  courses: {
                    cnv: editingServices.courses?.cnv || false,
                    persona_in_foco: editingServices.courses?.persona_in_foco || false,
                    pnl_practitioner: editingServices.courses?.pnl_practitioner || false,
                  },
                  service_dates: editingServices.service_dates || {},
                }}
                existingPhotoUrl={editingClient.photo_url}
                currentEmail={editingClient.email}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder Dialog */}
      {folderClient && (
        <CandidateFolderDialog
          open={!!folderClient}
          onOpenChange={() => setFolderClient(null)}
          candidateId={folderClient.id}
          candidateName={folderClient.full_name}
          candidateEmail={folderClient.email}
        />
      )}

      {/* Interaction Log Dialog */}
      {loggingClient && (
        <InteractionLogDialog
          open={!!loggingClient}
          onOpenChange={() => setLoggingClient(null)}
          clientId={loggingClient.id}
          clientName={loggingClient.full_name}
          onSuccess={onRefresh}
        />
      )}

      {/* Email Dialog */}
      {emailClient && (
        <EmailDialog
          open={!!emailClient}
          onOpenChange={() => setEmailClient(null)}
          clientName={emailClient.full_name}
          clientEmail={emailClient.email}
        />
      )}
    </TooltipProvider>
  );
};
