import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { differenceInDays, parseISO, addMonths, format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractProgressProps {
  startDate: string | null;
  durationMonths: number | null;
  className?: string;
  showDetails?: boolean;
}

export const ContractProgress = ({
  startDate,
  durationMonths,
  className,
  showDetails = true,
}: ContractProgressProps) => {
  const { progress, daysRemaining, endDate, status, totalDays } = useMemo(() => {
    if (!startDate || !durationMonths) {
      return { progress: 0, daysRemaining: 0, endDate: null, status: "no_data" as const, totalDays: 0 };
    }

    const start = parseISO(startDate);
    const end = addMonths(start, durationMonths);
    const today = new Date();
    
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);
    const daysRemaining = differenceInDays(end, today);
    
    let progress = Math.round((elapsedDays / totalDays) * 100);
    progress = Math.max(0, Math.min(100, progress));
    
    let status: "not_started" | "in_progress" | "ending_soon" | "completed" | "overdue";
    
    if (elapsedDays < 0) {
      status = "not_started";
    } else if (isAfter(today, end)) {
      status = "overdue";
    } else if (daysRemaining <= 30) {
      status = "ending_soon";
    } else if (progress >= 100) {
      status = "completed";
    } else {
      status = "in_progress";
    }

    return { progress, daysRemaining, endDate: end, status, totalDays };
  }, [startDate, durationMonths]);

  if (!startDate || !durationMonths) {
    return (
      <div className={cn("text-sm text-muted-foreground italic", className)}>
        Duração do contrato não definida
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case "not_started":
        return "bg-muted";
      case "in_progress":
        return "bg-primary";
      case "ending_soon":
        return "bg-amber-500";
      case "completed":
        return "bg-green-500";
      case "overdue":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "not_started":
        return "Não iniciado";
      case "in_progress":
        return "Em andamento";
      case "ending_soon":
        return "Finalizando em breve";
      case "completed":
        return "Concluído";
      case "overdue":
        return "Contrato vencido";
      default:
        return "";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "overdue":
      case "ending_soon":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <CalendarClock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusLabel()}</span>
          </div>
          <span className="text-muted-foreground">
            {progress}% concluído
          </span>
        </div>
      )}
      
      <div className="relative">
        <Progress 
          value={progress} 
          className="h-2"
        />
        <div 
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all",
            getStatusColor()
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {showDetails && endDate && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Início: {format(parseISO(startDate), "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <span>
            {daysRemaining > 0 
              ? `${daysRemaining} dias restantes`
              : daysRemaining === 0 
                ? "Vence hoje"
                : `Vencido há ${Math.abs(daysRemaining)} dias`
            }
          </span>
          <span>
            Fim: {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      )}
    </div>
  );
};

// Helper to calculate end date from start date and duration
export const calculateEndDate = (startDate: string, durationMonths: number): string => {
  const start = parseISO(startDate);
  const end = addMonths(start, durationMonths);
  return format(end, "yyyy-MM-dd");
};

// Get duration label
export const getDurationLabel = (months: number): string => {
  switch (months) {
    case 6:
      return "6 meses";
    case 9:
      return "9 meses";
    case 12:
      return "12 meses (1 ano)";
    default:
      return `${months} meses`;
  }
};
