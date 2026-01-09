import { useState, useMemo } from "react";
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
} from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [sortField, setSortField] = useState<SortField>("last_interaction_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [viewingClient, setViewingClient] = useState<CRMClient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [folderClient, setFolderClient] = useState<CRMClient | null>(null);
  const [loggingClient, setLoggingClient] = useState<CRMClient | null>(null);
  const [emailClient, setEmailClient] = useState<CRMClient | null>(null);
  const itemsPerPage = 10;

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
                                onClick={() => setViewingClient(client)}
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
                                onClick={() => setViewingClient(client)}
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
                                onClick={() => setEditingClient(client)}
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
                          onClick={() => setViewingClient(client)}
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
                    <Button variant="ghost" size="sm" onClick={() => setViewingClient(client)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingClient(client)}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-base">{viewingClient.phone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Interação</p>
                  <p className="text-base">{getRelativeTime(viewingClient.last_interaction_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Próximo Passo</p>
                  <p className="text-base">{viewingClient.next_step || "Não definido"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Área</p>
                  <p className="text-base">{viewingClient.area_of_interest || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Região</p>
                  <p className="text-base">{viewingClient.region || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                  {viewingClient.linkedin_url ? (
                    <a href={viewingClient.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline flex items-center gap-1">
                      Ver Perfil <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-base">Não informado</p>
                  )}
                </div>
              </div>

              {/* Document Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setViewingClient(null);
                    setFolderClient(viewingClient);
                  }}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Ver Documentos
                </Button>
                {viewingClient.resume_url && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(viewingClient.resume_url!, "_blank", "noopener,noreferrer")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Currículo
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => setLoggingClient(viewingClient)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Interação
                </Button>
                <Button variant="outline" onClick={() => setEditingClient(viewingClient)}>
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
            {editingClient && (
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
                }}
                existingPhotoUrl={editingClient.photo_url}
                currentEmail={editingClient.email}
              />
            )}
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
