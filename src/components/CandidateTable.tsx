import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Search, ArrowUpDown, FileText, ExternalLink, Download } from "lucide-react";
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
}

type SortField = "name" | "email";
type SortOrder = "asc" | "desc";

export const CandidateTable = ({
  candidates,
  onEdit,
  onDelete,
}: CandidateTableProps) => {
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

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

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.phone.includes(searchQuery) ||
        candidate.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesArea = areaFilter === "all" || candidate.area === areaFilter;
      const matchesCity = cityFilter === "all" || candidate.city === cityFilter;

      return matchesSearch && matchesArea && matchesCity;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "name" || sortField === "email") {
        comparison = a[sortField].localeCompare(b[sortField]);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [candidates, searchQuery, areaFilter, cityFilter, sortField, sortOrder]);

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

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum candidato cadastrado ainda.</p>
        <p className="text-sm mt-2">Adicione o primeiro candidato usando o formulário ao lado.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        </div>
        {filteredAndSortedCandidates.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredAndSortedCandidates.length} de {candidates.length} candidato{candidates.length !== 1 ? "s" : ""}
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
                   <TableHead className="h-14 font-semibold whitespace-nowrap">LinkedIn</TableHead>
                   <TableHead className="h-14 font-semibold whitespace-nowrap">Currículo</TableHead>
                  <TableHead className="text-center h-14 font-semibold whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCandidates.map((candidate) => (
                  <TableRow key={candidate.id} className="hover:bg-muted/30 transition-colors">
                     <TableCell className="font-medium py-5 whitespace-nowrap">{candidate.name}</TableCell>
                     <TableCell className="py-5 text-muted-foreground whitespace-nowrap">{candidate.email}</TableCell>
                     <TableCell className="py-5 text-muted-foreground whitespace-nowrap">{candidate.phone}</TableCell>
                     <TableCell className="py-5 whitespace-nowrap">
                       <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                         {candidate.area}
                       </span>
                     </TableCell>
                     <TableCell className="py-5 text-muted-foreground whitespace-nowrap">{candidate.city}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCandidate(candidate)}
                          className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Editar candidato"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(candidate.id)}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Excluir candidato"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredAndSortedCandidates.map((candidate) => (
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
                     <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                       {candidate.area}
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
        </>
      )}

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
    </>
  );
};
