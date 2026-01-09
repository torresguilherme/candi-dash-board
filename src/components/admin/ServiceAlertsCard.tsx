import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Clock, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceAlert, getServiceLabel, useServiceAlerts } from "@/hooks/useClientServices";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceAlertsCardProps {
  onClientClick?: (clientId: string) => void;
  onRefresh?: () => void;
}

export const ServiceAlertsCard = ({ onClientClick, onRefresh }: ServiceAlertsCardProps) => {
  const { alerts, loading, fetchAlerts } = useServiceAlerts();

  const getStatusBadge = (status: ServiceAlert["status"]) => {
    switch (status) {
      case "overdue":
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atrasado
          </Badge>
        );
      case "due_today":
        return (
          <Badge variant="default" className="bg-orange-500 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Vence Hoje
          </Badge>
        );
      case "due_soon":
        return (
          <Badge variant="secondary" className="text-xs">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Em breve
          </Badge>
        );
    }
  };

  const getDaysText = (daysUntilDue: number) => {
    if (daysUntilDue < 0) {
      const absDays = Math.abs(daysUntilDue);
      return `${absDays} dia${absDays !== 1 ? "s" : ""} de atraso`;
    } else if (daysUntilDue === 0) {
      return "Vence hoje";
    } else {
      return `${daysUntilDue} dia${daysUntilDue !== 1 ? "s" : ""} restantes`;
    }
  };

  const markAsDelivered = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("client_services")
        .update({
          delivered_date: new Date().toISOString().split("T")[0],
          is_active: false,
        })
        .eq("id", serviceId);

      if (error) throw error;

      toast.success("Serviço marcado como entregue!");
      fetchAlerts();
      onRefresh?.();
    } catch (error) {
      console.error("Error marking service as delivered:", error);
      toast.error("Erro ao atualizar serviço");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueCount = alerts.filter((a) => a.status === "overdue").length;
  const todayCount = alerts.filter((a) => a.status === "due_today").length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Entregas de Serviços
            </CardTitle>
            <CardDescription>
              {alerts.length === 0
                ? "Nenhuma entrega pendente"
                : `${alerts.length} entrega${alerts.length !== 1 ? "s" : ""} pendente${alerts.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          {(overdueCount > 0 || todayCount > 0) && (
            <div className="flex gap-1">
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueCount} atrasado{overdueCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {todayCount > 0 && (
                <Badge className="bg-orange-500 text-xs">
                  {todayCount} hoje
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Todas as entregas estão em dia!</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    alert.status === "overdue"
                      ? "bg-destructive/5 border-destructive/20"
                      : alert.status === "due_today"
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"
                      : "bg-muted/50 border-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(alert.status)}
                        <span className="text-xs text-muted-foreground">
                          {getDaysText(alert.daysUntilDue)}
                        </span>
                      </div>
                      <button
                        onClick={() => onClientClick?.(alert.clientId)}
                        className="font-medium text-sm hover:text-primary transition-colors truncate block"
                      >
                        {alert.clientName}
                      </button>
                      <p className="text-xs text-muted-foreground truncate">
                        {getServiceLabel(alert.serviceType)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Previsto: {format(parseISO(alert.scheduledDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsDelivered(alert.id)}
                      className="shrink-0 text-xs h-8"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Entregue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
