import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Service {
  id: string;
  service_type: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface ServiceDate {
  id: string;
  service_id: string;
  date_type: string;
  scheduled_date: string;
  notes: string | null;
}

interface ClientServicesProps {
  clientId: string;
}

const SERVICE_TYPES = [
  { id: "career_mentoring", label: "Gerenciamento/Mentoria de Carreira" },
  { id: "market_mapping", label: "Mapeamento de mercado" },
  { id: "support_material", label: "Material de Apoio" },
  { id: "interview_pitch", label: "Pitch de entrevista" },
  { id: "resume_restructuring", label: "Reestruturação curricular" },
  { id: "behavioral_assessment", label: "Avaliação de perfil comportamental" },
  { id: "brain_preference", label: "Avaliação preferência cerebral" },
  { id: "company_direction", label: "Direcionamento para empresas" },
  { id: "linkedin_service", label: "LinkedIn" },
  { id: "personal_marketing", label: "Marketing Pessoal" },
  { id: "cnv", label: "CNV (Comunicação não violenta)" },
  { id: "persona_in_foco", label: "Persona in Foco" },
  { id: "pnl_practitioner", label: "Formação em Practitioner em PNL" },
];

const DATE_TYPES = [
  { value: "scheduled", label: "Data Prevista" },
  { value: "rescheduled", label: "Reagendamento" },
  { value: "delivered", label: "Data de Entrega" },
  { value: "meeting", label: "Reunião" },
];

export function ClientServices({ clientId }: ClientServicesProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceDates, setServiceDates] = useState<Record<string, ServiceDate[]>>({});
  const [loading, setLoading] = useState(true);
  const [addingService, setAddingService] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [addDateDialogOpen, setAddDateDialogOpen] = useState<string | null>(null);
  const [newDateType, setNewDateType] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDateNotes, setNewDateNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, [clientId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data: servicesData, error: servicesError } = await supabase
        .from("client_services")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      setServices(servicesData || []);

      // Fetch dates for all services
      if (servicesData && servicesData.length > 0) {
        const serviceIds = servicesData.map((s) => s.id);
        const { data: datesData, error: datesError } = await supabase
          .from("service_dates")
          .select("*")
          .in("service_id", serviceIds)
          .order("scheduled_date", { ascending: true });

        if (datesError) throw datesError;

        const datesByService: Record<string, ServiceDate[]> = {};
        (datesData || []).forEach((date) => {
          if (!datesByService[date.service_id]) {
            datesByService[date.service_id] = [];
          }
          datesByService[date.service_id].push(date);
        });
        setServiceDates(datesByService);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!selectedServiceType) return;

    setAddingService(true);
    try {
      const { error } = await supabase.from("client_services").insert({
        client_id: clientId,
        service_type: selectedServiceType,
      });

      if (error) throw error;

      toast({ title: "Serviço adicionado!" });
      setSelectedServiceType("");
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar serviço",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("client_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast({ title: "Serviço removido!" });
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Erro ao remover serviço",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddDate = async (serviceId: string) => {
    if (!newDateType || !newDate) return;

    try {
      const { error } = await supabase.from("service_dates").insert({
        service_id: serviceId,
        date_type: newDateType,
        scheduled_date: new Date(newDate).toISOString(),
        notes: newDateNotes || null,
      });

      if (error) throw error;

      toast({ title: "Data adicionada!" });
      setAddDateDialogOpen(null);
      setNewDateType("");
      setNewDate("");
      setNewDateNotes("");
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDate = async (dateId: string) => {
    try {
      const { error } = await supabase
        .from("service_dates")
        .delete()
        .eq("id", dateId);

      if (error) throw error;

      toast({ title: "Data removida!" });
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Erro ao remover data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getServiceLabel = (type: string) => {
    return SERVICE_TYPES.find((s) => s.id === type)?.label || type;
  };

  const getDateTypeLabel = (type: string) => {
    return DATE_TYPES.find((d) => d.value === type)?.label || type;
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
      {/* Add Service */}
      <div className="flex gap-2">
        <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um serviço" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAddService} disabled={!selectedServiceType || addingService}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum serviço contratado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {getServiceLabel(service.service_type)}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Dates */}
                {(serviceDates[service.id] || []).map((date) => (
                  <div
                    key={date.id}
                    className="flex items-center justify-between p-2 rounded bg-muted"
                  >
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {getDateTypeLabel(date.date_type)}
                      </Badge>
                      <span className="text-sm">
                        {format(new Date(date.scheduled_date), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                      {date.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {date.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDate(date.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                {/* Add Date Button */}
                <Dialog
                  open={addDateDialogOpen === service.id}
                  onOpenChange={(open) =>
                    setAddDateDialogOpen(open ? service.id : null)
                  }
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Data</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo de Data</Label>
                        <Select value={newDateType} onValueChange={setNewDateType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data e Hora</Label>
                        <Input
                          type="datetime-local"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={newDateNotes}
                          onChange={(e) => setNewDateNotes(e.target.value)}
                          placeholder="Observações opcionais..."
                        />
                      </div>
                      <Button
                        onClick={() => handleAddDate(service.id)}
                        disabled={!newDateType || !newDate}
                        className="w-full"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
