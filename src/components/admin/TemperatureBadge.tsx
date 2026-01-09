import { Flame, Sun, Snowflake } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { differenceInDays, differenceInHours } from "date-fns";

type Temperature = "hot" | "warm" | "cold";

interface TemperatureBadgeProps {
  lastInteractionAt: string | null;
}

export const getTemperature = (lastInteractionAt: string | null): Temperature => {
  if (!lastInteractionAt) return "cold";
  
  const daysDiff = differenceInDays(new Date(), new Date(lastInteractionAt));
  
  if (daysDiff < 3) return "hot";
  if (daysDiff <= 7) return "warm";
  return "cold";
};

export const getRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "Nunca";
  
  const date = new Date(dateString);
  const now = new Date();
  const hours = differenceInHours(now, date);
  const days = differenceInDays(now, date);
  
  if (hours < 1) return "Agora mesmo";
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;
  return `há ${Math.floor(days / 30)} mês(es)`;
};

const temperatureConfig = {
  hot: {
    icon: Flame,
    label: "Quente",
    description: "Interação nos últimos 3 dias",
    className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    iconClass: "text-green-600 dark:text-green-400",
  },
  warm: {
    icon: Sun,
    label: "Morno",
    description: "Interação entre 3-7 dias",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    iconClass: "text-amber-500 dark:text-amber-400",
  },
  cold: {
    icon: Snowflake,
    label: "Frio",
    description: "Sem interação há mais de 7 dias",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    iconClass: "text-red-500 dark:text-red-400",
  },
};

export const TemperatureBadge = ({ lastInteractionAt }: TemperatureBadgeProps) => {
  const temperature = getTemperature(lastInteractionAt);
  const config = temperatureConfig[temperature];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-help",
          config.className
        )}>
          <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
          {config.label}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{config.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Última interação: {getRelativeTime(lastInteractionAt)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
