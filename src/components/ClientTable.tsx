import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  FileText,
  Linkedin,
  ChevronUp,
  ChevronDown,
  FolderOpen,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ClientFormData } from "@/components/ClientForm";
import { ClientFolderDialog } from "@/components/ClientFolderDialog";

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  area_of_interest: string | null;
  status: string;
  region: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  photo_url: string | null;
  registrationDate: Date;
  contract_number: string | null;
}

interface ClientTableProps {
  clients: Client[];
  onEdit: (id: string, data: ClientFormData) => void;
  onDelete: (id: string) => void;
  onBulkStatusChange: (ids: string[], status: string) => void;
  onBulkDelete: (ids: string[]) => void;
}

const statusOptions = [
  { value: "Novo", label: "Novo", color: "bg-blue-500" },
  { value: "Em Análise", label: "Em Análise", color: "bg-yellow-500" },
  { value: "Contratado", label: "Contratado", color: "bg-green-500" },
  { value: "Arquivado", label: "Arquivado", color: "bg-gray-500" },
];

type SortField = "full_name" | "email" | "area_of_interest" | "status" | "region" | "registrationDate";
type SortDirection = "asc" | "desc";

export function ClientTable({
  clients,
  onEdit,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
}: ClientTableProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("registrationDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [folderClientId, setFolderClientId] = useState<string | null>(null);
  const [folderClientName, setFolderClientName] = useState<string>("");
  const [folderClientEmail, setFolderClientEmail] = useState<string>("");
  const itemsPerPage = 10;

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch =
        client.full_name.toLowerCase().includes(search.toLowerCase()) ||
        client.email.toLowerCase().includes(search.toLowerCase()) ||
        (client.area_of_interest?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (client.region?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "registrationDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = (aValue || "").toString().toLowerCase();
        bValue = (bValue || "").toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [clients, search, sortField, sortDirection, statusFilter]);

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClients.slice(startIndex, endIndex);
  }, [filteredAndSortedClients, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedClients.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return (
      <Badge
        variant="secondary"
        className={`${statusOption?.color || "bg-gray-500"} text-white`}
      >
        {status}
      </Badge>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const openFolder = (client: Client) => {
    setFolderClientId(client.id);
    setFolderClientName(client.full_name);
    setFolderClientEmail(client.email);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, área ou região..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} selecionado(s)
          </span>
          <Select onValueChange={(value) => onBulkStatusChange(selectedIds, value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Alterar status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onBulkDelete(selectedIds);
              setSelectedIds([]);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedClients.length > 0 &&
                    selectedIds.length === paginatedClients.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("full_name")}
              >
                <div className="flex items-center">
                  Nome
                  <SortIcon field="full_name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center">
                  Email
                  <SortIcon field="email" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("area_of_interest")}
              >
                <div className="flex items-center">
                  Área
                  <SortIcon field="area_of_interest" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("region")}
              >
                <div className="flex items-center">
                  Região
                  <SortIcon field="region" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(client.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(client.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{client.full_name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.area_of_interest || "-"}</TableCell>
                  <TableCell>{client.region || "-"}</TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {client.resume_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Ver Currículo"
                        >
                          <a
                            href={client.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {client.linkedin_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Ver LinkedIn"
                        >
                          <a
                            href={client.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Abrir Pasta"
                        onClick={() => openFolder(client)}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openFolder(client)}>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Abrir Pasta
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(client.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedClients.length)} de{" "}
            {filteredAndSortedClients.length} resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Folder Dialog */}
      <ClientFolderDialog
        clientId={folderClientId}
        clientName={folderClientName}
        clientEmail={folderClientEmail}
        open={!!folderClientId}
        onOpenChange={(open) => {
          if (!open) {
            setFolderClientId(null);
            setFolderClientName("");
            setFolderClientEmail("");
          }
        }}
      />
    </div>
  );
}
