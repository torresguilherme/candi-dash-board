import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Search, ArrowUpDown, FileText, ExternalLink, Download, Eye, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
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
import { CandidateForm, CandidateFormData } from "./CandidateForm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export interface Candidate extends CandidateFormData {
  id: string;
  status?: string;
  registrationDate?: Date;
  resume_url?: string | null;
  linkedin_url?: string | null;
}

interface CandidateTableProps {
  candidates: Candidate[];
  onEdit: (id: string, data: CandidateFormData) => void;
  onDelete: (id: string) => void;
  onBulkStatusChange?: (ids: string[], newStatus: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

type SortField = "name" | "email";
type SortOrder = "asc" | "desc";

export const CandidateTable = ({
  candidates,
  onEdit,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
}: CandidateTableProps) => {
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const itemsPerPage = 10;

  const uniqueCities = useMemo(() => {
    const cities = [...new Set(candidates.map(c => c.city))].sort();
    return cities;
  }, [candidates]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Novo":
        return "default";
      case "Em Análise":
        return "secondary";
      case "Entrevista Agendada":
        return "outline";
      case "Aprovado":
        return "default";
      case "Rejeitado":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Novo":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Em Análise":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Entrevista Agendada":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Aprovado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Rejeitado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getAreaColor = (area: string) => {
    const colors: Record<string, string> = {
      "Administrativo": "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
      "Atendimento ao Cliente": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
      "Comunicação": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "Compras": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "Design": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Engenharia": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Financeiro": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Jurídico": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "Logística": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      "Marketing": "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
      "Operações": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      "Produto": "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
      "Recursos Humanos": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200",
      "Tecnologia": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      "Vendas": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "Outros": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[area] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.phone.includes(searchQuery) ||
        candidate.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesArea = areaFilter === "all" || candidate.area === areaFilter;
      const matchesCity = cityFilter === "all" || candidate.city === cityFilter;
      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;

      return matchesSearch && matchesArea && matchesCity && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "name" || sortField === "email") {
        comparison = a[sortField].localeCompare(b[sortField]);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [candidates, searchQuery, areaFilter, cityFilter, statusFilter, sortField, sortOrder]);

  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedCandidates.slice(startIndex, endIndex);
  }, [filteredAndSortedCandidates, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCandidates.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (data: CandidateFormData) => {
    if (editingCandidate) {
      onEdit(editingCandidate.id, data);
      setEditingCandidate(null);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
      toast.success("Candidato excluído com sucesso!");
    }
  };

  const handleDownloadResume = async (resumeUrl: string, candidateName: string) => {
    try {
      const response = await fetch(resumeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo-${candidateName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
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
      setSelectedCandidates(new Set(paginatedCandidates.map(c => c.id)));
    } else {
      setSelectedCandidates(new Set());
    }
  };

  const handleSelectCandidate = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCandidates);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCandidates(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedCandidates.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedCandidates));
      setSelectedCandidates(new Set());
      toast.success(`${selectedCandidates.size} candidato(s) excluído(s) com sucesso!`);
    }
  };

  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedCandidates.size > 0 && onBulkStatusChange) {
      onBulkStatusChange(Array.from(selectedCandidates), newStatus);
      setSelectedCandidates(new Set());
      toast.success(`Status de ${selectedCandidates.size} candidato(s) atualizado para ${newStatus}!`);
    }
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Área", "Cidade", "Status", "Data de Registro"];
    const rows = filteredAndSortedCandidates.map(c => [
      c.name,
      c.email,
      c.phone,
      c.area,
      c.city,
      c.status || "Novo",
      c.registrationDate ? format(c.registrationDate, "dd/MM/yyyy") : ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidatos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Lista exportada com sucesso!");
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum candidato cadastrado ainda.</p>
        <p className="text-sm mt-2">Adicione o primeiro candidato usando o formulário ao lado.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 mb-6">
        {/* Bulk Actions Bar */}
        {selectedCandidates.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {selectedCandidates.size} candidato(s) selecionado(s)
            </p>
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alterar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Entrevista Agendada">Entrevista Agendada</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir selecionados
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedCandidates(new Set())}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, e-mail, telefone ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Área de interesse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              <SelectItem value="Administrativo">Administrativo</SelectItem>
              <SelectItem value="Atendimento ao Cliente">Atendimento ao Cliente</SelectItem>
              <SelectItem value="Comunicação">Comunicação</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Engenharia">Engenharia</SelectItem>
              <SelectItem value="Financeiro">Financeiro</SelectItem>
              <SelectItem value="Jurídico">Jurídico</SelectItem>
              <SelectItem value="Logística">Logística</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operações">Operações</SelectItem>
              <SelectItem value="Produto">Produto</SelectItem>
              <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
              <SelectItem value="Tecnologia">Tecnologia</SelectItem>
              <SelectItem value="Vendas">Vendas</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {uniqueCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Em Análise">Em Análise</SelectItem>
              <SelectItem value="Entrevista Agendada">Entrevista Agendada</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV} className="shrink-0">
          <FileDown className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
        {filteredAndSortedCandidates.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedCandidates.length)} de {filteredAndSortedCandidates.length} candidato{filteredAndSortedCandidates.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {filteredAndSortedCandidates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-md">
          <p>Nenhum candidato encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-14 w-12">
                    <Checkbox
                      checked={paginatedCandidates.length > 0 && paginatedCandidates.every(c => selectedCandidates.has(c.id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="h-14 whitespace-nowrap">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center font-semibold hover:text-foreground transition-colors"
                    >
                      Nome Completo
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="h-14 whitespace-nowrap">
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center font-semibold hover:text-foreground transition-colors"
                    >
                      E-mail
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="h-14 font-semibold whitespace-nowrap">Telefone</TableHead>
                  <TableHead className="h-14 font-semibold whitespace-nowrap">Área de Interesse</TableHead>
                  <TableHead className="h-14 font-semibold whitespace-nowrap">Cidade</TableHead>
                  <TableHead className="h-14 font-semibold whitespace-nowrap">Status</TableHead>
                  <TableHead className="h-14 font-semibold whitespace-nowrap">LinkedIn</TableHead>
                  <TableHead className="h-14 font-semibold whitespace-nowrap">Currículo</TableHead>
                  <TableHead className="text-center h-14 font-semibold whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCandidates.map((candidate) => (
                  <TableRow key={candidate.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-5">
                      <Checkbox
                        checked={selectedCandidates.has(candidate.id)}
                        onCheckedChange={(checked) => handleSelectCandidate(candidate.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium py-5 whitespace-nowrap">
                      <button
                        onClick={() => setViewingCandidate(candidate)}
                        className="hover:text-primary hover:underline transition-colors text-left"
                      >
                        {candidate.name}
                      </button>
                    </TableCell>
                    <TableCell className="py-5 text-muted-foreground whitespace-nowrap">{candidate.email}</TableCell>
                    <TableCell className="py-5 text-muted-foreground whitespace-nowrap">{candidate.phone}</TableCell>
                    <TableCell className="py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${getAreaColor(candidate.area)}`}>
                        {candidate.area}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 text-muted-foreground whitespace-nowrap">{candidate.city}</TableCell>
                    <TableCell className="py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${getStatusColor(candidate.status || "Novo")}`}>
                        {candidate.status || "Novo"}
                      </span>
                    </TableCell>
                     <TableCell className="py-5 whitespace-nowrap">
                       {candidate.linkedin_url ? (
                         <a 
                           href={candidate.linkedin_url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 text-primary hover:underline"
                         >
                           <ExternalLink className="h-4 w-4" />
                           Perfil
                         </a>
                       ) : (
                         <span className="text-muted-foreground">-</span>
                       )}
                     </TableCell>
                     <TableCell className="py-5 whitespace-nowrap">
                       {candidate.resume_url ? (
                         <button
                           onClick={() => handleDownloadResume(candidate.resume_url!, candidate.name)}
                           className="inline-flex items-center gap-1 text-primary hover:underline"
                         >
                           <Download className="h-4 w-4" />
                           Baixar PDF
                         </button>
                       ) : (
                         <span className="text-muted-foreground">-</span>
                       )}
                     </TableCell>
                    <TableCell className="text-center py-5 whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingCandidate(candidate)}
                              className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar candidato</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingCandidate(candidate)}
                              className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar candidato</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(candidate.id)}
                              className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir candidato</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="hidden md:flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-9"
                  >
                    {page}
                  </Button>
                ))}
              </div>
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-lg border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{candidate.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{candidate.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Área:</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getAreaColor(candidate.area)}`}>
                      {candidate.area}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(candidate.status || "Novo")}`}>
                      {candidate.status || "Novo"}
                    </span>
                  </div>
                   <div className="flex justify-between items-center">
                     <span className="text-muted-foreground">Cidade:</span>
                     <span className="font-medium">{candidate.city}</span>
                   </div>
                   {candidate.linkedin_url && (
                     <div className="flex justify-between items-center">
                       <span className="text-muted-foreground">LinkedIn:</span>
                       <a 
                         href={candidate.linkedin_url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-primary hover:underline flex items-center gap-1"
                       >
                         <ExternalLink className="h-3 w-3" />
                         Ver perfil
                       </a>
                     </div>
                   )}
                   {candidate.resume_url && (
                     <div className="flex justify-between items-center">
                       <span className="text-muted-foreground">Currículo:</span>
                       <button
                         onClick={() => handleDownloadResume(candidate.resume_url!, candidate.name)}
                         className="text-primary hover:underline flex items-center gap-1"
                       >
                         <Download className="h-3 w-3" />
                         Baixar PDF
                       </button>
                     </div>
                   )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCandidate(candidate)}
                    className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingId(candidate.id)}
                    className="flex-1 text-destructive hover:bg-destructive/10 hover:border-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="md:hidden flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* View Candidate Drawer */}
      <Drawer open={!!viewingCandidate} onOpenChange={() => setViewingCandidate(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Detalhes do Candidato</DrawerTitle>
          </DrawerHeader>
          {viewingCandidate && (
            <div className="px-4 pb-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                  <p className="text-base font-semibold">{viewingCandidate.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                  <p className="text-base">{viewingCandidate.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-base">{viewingCandidate.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                  <p className="text-base">{viewingCandidate.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Área de Interesse</p>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getAreaColor(viewingCandidate.area)}`}>
                    {viewingCandidate.area}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(viewingCandidate.status || "Novo")}`}>
                    {viewingCandidate.status || "Novo"}
                  </span>
                </div>
                {viewingCandidate.linkedin_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">LinkedIn</p>
                    <a 
                      href={viewingCandidate.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver perfil
                    </a>
                  </div>
                )}
                {viewingCandidate.resume_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Currículo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadResume(viewingCandidate.resume_url!, viewingCandidate.name)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="default"
                  onClick={() => {
                    setEditingCandidate(viewingCandidate);
                    setViewingCandidate(null);
                  }}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Candidato
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeletingId(viewingCandidate.id);
                    setViewingCandidate(null);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Dialog open={!!editingCandidate} onOpenChange={() => setEditingCandidate(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Candidato</DialogTitle>
          </DialogHeader>
          {editingCandidate && (
            <CandidateForm
              onSubmit={handleEdit}
              defaultValues={editingCandidate}
              submitButtonText="Atualizar Candidato"
              existingEmails={candidates.map(c => c.email)}
              currentEmail={editingCandidate.email}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este candidato? Esta ação não pode ser desfeita.
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
