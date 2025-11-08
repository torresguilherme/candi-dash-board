import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Search, ArrowUpDown } from "lucide-react";
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
}

interface CandidateTableProps {
  candidates: Candidate[];
  onEdit: (id: string, data: CandidateFormData) => void;
  onDelete: (id: string) => void;
}

type SortField = "name" | "email" | "registrationDate" | "status";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("registrationDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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
        candidate.phone.includes(searchQuery);

      const matchesArea = areaFilter === "all" || candidate.area === areaFilter;
      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;

      return matchesSearch && matchesArea && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "registrationDate") {
        comparison = new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
      } else if (sortField === "name" || sortField === "email" || sortField === "status") {
        comparison = a[sortField].localeCompare(b[sortField]);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [candidates, searchQuery, areaFilter, statusFilter, sortField, sortOrder]);

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
      <div className="space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, e-mail ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              <SelectItem value="Tecnologia">Tecnologia</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Vendas">Vendas</SelectItem>
              <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
        <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
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
                <TableHead className="h-14 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center justify-center font-semibold hover:text-foreground transition-colors w-full"
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="h-14 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleSort("registrationDate")}
                    className="flex items-center justify-center font-semibold hover:text-foreground transition-colors w-full"
                  >
                    Data de Cadastro
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
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
                  <TableCell className="py-5 whitespace-nowrap text-center">
                    <Badge variant={getStatusVariant(candidate.status)} className={`${getStatusColor(candidate.status)} font-medium whitespace-nowrap`}>
                      {candidate.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5 text-muted-foreground whitespace-nowrap text-center">{format(candidate.registrationDate, "dd/MM/yyyy")}</TableCell>
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
