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
  MoreHorizontal,
  Star,
  AlertCircle,
  CheckCircle,
  Ban
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CandidateFolderDialog } from "./CandidateFolderDialog";
import { CandidateAvatar } from "./admin/CandidateAvatar";
import { CandidateForm, CandidateFormData } from "./CandidateForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Client {
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
  photo_url: string | null;
  education: string | null;
  contract_value: number | null;
  rating?: number;
}

interface ClientTableProps {
  clients: Client[];
  onEdit: (id: string, data: CandidateFormData) => void;
  onDelete: (id: string) => void;
  onBulkStatusChange?: (ids: string[], newStatus: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

type SortField = "full_name" | "email" | "created_at";
type SortOrder = "asc" | "desc";

const RatingStars = ({ rating = 0 }: { rating?: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating 
              ? "fill-amber-400 text-amber-400" 
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
};

export const ClientTable = ({
  clients,
  onEdit,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
}: ClientTableProps) => {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [folderClient, setFolderClient] = useState<Client | null>(null);
  const itemsPerPage = 10;

  const uniqueAreas = useMemo(() => {
    const areas = [...new Set(clients.map(c => c.area_of_interest).filter(Boolean))].sort();
    return areas as string[];
  }, [clients]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Novo":
        return { color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", icon: null };
      case "Em Análise":
      case "Em Processo":
        return { color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: null };
      case "Ativo":
      case "Aprovado":
        return { color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", icon: CheckCircle };
      case "Inativo":
        return { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Ban };
      default:
        return { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: null };
    }
  };

  const isIncomplete = (client: Client) => {
    return !client.cpf || !client.phone || !client.resume_url;
  };

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch =
        client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.cpf && client.cpf.includes(searchQuery)) ||
        (client.phone && client.phone.includes(searchQuery));

      const matchesArea = areaFilter === "all" || client.area_of_interest === areaFilter;
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;

      return matchesSearch && matchesArea && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "full_name" || sortField === "email") {
        comparison = (a[sortField] || "").localeCompare(b[sortField] || "");
      } else if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [clients, searchQuery, areaFilter, statusFilter, sortField, sortOrder]);

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

  const handleEdit = (data: CandidateFormData) => {
    if (editingClient) {
      onEdit(editingClient.id, data);
      setEditingClient(null);
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo-${clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Currículo baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar currículo");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(paginatedClients.map(c => c.id)));
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
    const headers = ["Nome", "CPF", "Email", "Telefone", "Área", "Cidade", "Status", "Data de Cadastro"];
    const rows = filteredAndSortedClients.map(c => [
      c.full_name,
      c.cpf || "",
      c.email,
      c.phone || "",
      c.area_of_interest || "",
      c.region || "",
      c.status,
      format(new Date(c.created_at), "dd/MM/yyyy")
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Lista exportada com sucesso!");
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}, tudo bem?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const openEmail = (email: string, name: string) => {
    const subject = encodeURIComponent(`Person Corp - Contato`);
    const body = encodeURIComponent(`Olá ${name},\n\n`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
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
            <p className="text-sm font-medium">
              {selectedClients.size} cliente(s) selecionado(s)
            </p>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CPF ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {uniqueAreas.map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Em Processo">Em Processo</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV} className="h-10">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {filteredAndSortedClients.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedClients.length)} de {filteredAndSortedClients.length} cliente{filteredAndSortedClients.length !== 1 ? "s" : ""}
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
                      checked={paginatedClients.length > 0 && paginatedClients.every(c => selectedClients.has(c.id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[280px]">
                    <button
                      onClick={() => handleSort("full_name")}
                      className="flex items-center gap-1 font-semibold hover:text-foreground"
                    >
                      Cliente
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[200px]">Contato</TableHead>
                  <TableHead className="min-w-[180px]">Localização</TableHead>
                  <TableHead className="min-w-[120px]">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 font-semibold hover:text-foreground"
                    >
                      Cadastro
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client, index) => {
                  const statusConfig = getStatusConfig(client.status);
                  const incomplete = isIncomplete(client);
                  
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
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <CandidateAvatar name={client.full_name} photoUrl={client.photo_url} size="md" />
                            {incomplete && (
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center">
                                <AlertCircle className="h-3 w-3 text-white" />
                              </div>
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
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {!client.cpf ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                  Sem CPF
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {client.cpf}
                                </span>
                              )}
                              {incomplete && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                  Cadastro incompleto
                                </span>
                              )}
                            </div>
                            <RatingStars rating={client.rating || 0} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1.5">
                          <p className="text-sm truncate max-w-[180px]">{client.email}</p>
                          {client.phone && (
                            <p className="text-sm text-muted-foreground">{client.phone}</p>
                          )}
                          <div className="flex gap-1 pt-1">
                            {client.phone && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-green-600 hover:bg-green-100 hover:text-green-700"
                                    onClick={() => openWhatsApp(client.phone!, client.full_name)}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
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
                                  className="h-7 w-7 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                  onClick={() => openEmail(client.email, client.full_name)}
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>E-mail</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <p className="text-sm">{client.region || "—"}</p>
                          {client.area_of_interest && (
                            <p className="text-xs text-muted-foreground">{client.area_of_interest}</p>
                          )}
                          {client.education && (
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{client.education}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <p className="text-sm">{formatDate(client.created_at)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.icon && <statusConfig.icon className="h-3 w-3" />}
                          {client.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pr-2">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick action buttons */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setViewingClient(client)}
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar</TooltipContent>
                          </Tooltip>
                          
                          {client.resume_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDownloadResume(client.resume_url!, client.full_name)}
                                >
                                  <FileText className="h-4 w-4 text-orange-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Currículo</TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setFolderClient(client)}
                              >
                                <FolderOpen className="h-4 w-4 text-purple-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pasta</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
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

          {/* Tablet/Mobile View */}
          <div className="lg:hidden space-y-3">
            {paginatedClients.map((client) => {
              const statusConfig = getStatusConfig(client.status);
              const incomplete = isIncomplete(client);
              
              return (
                <div
                  key={client.id}
                  className="rounded-xl border bg-card p-4 space-y-4"
                >
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
                      <button
                        onClick={() => setViewingClient(client)}
                        className="font-semibold text-base hover:text-primary block truncate"
                      >
                        {client.full_name}
                      </button>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {!client.cpf ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
                            Sem CPF
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">
                            {client.cpf}
                          </span>
                        )}
                        {incomplete && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
                            Incompleto
                          </span>
                        )}
                      </div>
                      <RatingStars rating={client.rating || 0} />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusConfig.color}`}>
                      {client.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm pl-10">
                    <div>
                      <p className="text-muted-foreground text-xs">E-mail</p>
                      <p className="truncate">{client.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Telefone</p>
                      <p>{client.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Cidade</p>
                      <p>{client.region || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Cadastro</p>
                      <p>{formatDate(client.created_at)}</p>
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
                      onClick={() => openEmail(client.email, client.full_name)}
                      className="flex-1 text-blue-600 hover:bg-blue-50"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      E-mail
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
                    <Button variant="ghost" size="sm" onClick={() => setFolderClient(client)}>
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Pasta
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingId(client.id)} className="text-destructive ml-auto">
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
                <div>
                  <h3 className="font-semibold text-lg">{viewingClient.full_name}</h3>
                  <p className="text-muted-foreground">{viewingClient.email}</p>
                  <RatingStars rating={viewingClient.rating || 0} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF</p>
                  <p className="text-base font-mono">{viewingClient.cpf || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-base">{viewingClient.phone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                  <p className="text-base">{viewingClient.region || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Área de Interesse</p>
                  <p className="text-base">{viewingClient.area_of_interest || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Formação</p>
                  <p className="text-base">{viewingClient.education || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusConfig(viewingClient.status).color}`}>
                    {viewingClient.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                  <p className="text-base">{formatDate(viewingClient.created_at)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {viewingClient.phone && (
                  <Button variant="outline" onClick={() => openWhatsApp(viewingClient.phone!, viewingClient.full_name)}>
                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                    WhatsApp
                  </Button>
                )}
                <Button variant="outline" onClick={() => openEmail(viewingClient.email, viewingClient.full_name)}>
                  <Mail className="h-4 w-4 mr-2 text-blue-600" />
                  E-mail
                </Button>
                {viewingClient.linkedin_url && (
                  <Button variant="outline" onClick={() => window.open(viewingClient.linkedin_url!, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
                {viewingClient.resume_url && (
                  <Button variant="outline" onClick={() => handleDownloadResume(viewingClient.resume_url!, viewingClient.full_name)}>
                    <Download className="h-4 w-4 mr-2" />
                    Currículo
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFolderClient(viewingClient);
                    setViewingClient(null);
                  }}
                  className="flex-1"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Ver Pasta
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setEditingClient(viewingClient);
                    setViewingClient(null);
                  }}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <CandidateForm
              onSubmit={handleEdit}
              defaultValues={{
                name: editingClient.full_name,
                email: editingClient.email,
                phone: editingClient.phone || "",
                area: editingClient.area_of_interest || "",
                city: editingClient.region || "",
                linkedin_url: editingClient.linkedin_url || "",
              }}
              submitButtonText="Atualizar Cliente"
              existingEmails={clients.map(c => c.email)}
              currentEmail={editingClient.email}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      {folderClient && (
        <CandidateFolderDialog
          open={folderClient !== null}
          onOpenChange={(open) => !open && setFolderClient(null)}
          candidateId={folderClient.id}
          candidateName={folderClient.full_name}
          candidateEmail={folderClient.email}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};
