import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flame, Snowflake, Sun, UserPlus, AlertCircle } from "lucide-react";

export type QuickFilterType = "all" | "hot" | "warm" | "cold" | "new" | "no-next-step";

interface QuickFiltersProps {
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  counts: {
    all: number;
    hot: number;
    warm: number;
    cold: number;
    new: number;
    noNextStep: number;
  };
}

export const QuickFilters = ({ activeFilter, onFilterChange, counts }: QuickFiltersProps) => {
  const filters: { key: QuickFilterType; label: string; icon?: React.ElementType; color?: string }[] = [
    { key: "all", label: "Todos" },
    { key: "hot", label: "Quentes", icon: Flame, color: "text-green-600" },
    { key: "warm", label: "Mornos", icon: Sun, color: "text-amber-500" },
    { key: "cold", label: "Frios", icon: Snowflake, color: "text-red-500" },
    { key: "new", label: "Novos", icon: UserPlus, color: "text-blue-600" },
    { key: "no-next-step", label: "Sem Próximo Passo", icon: AlertCircle, color: "text-orange-600" },
  ];

  const getCount = (key: QuickFilterType) => {
    switch (key) {
      case "all": return counts.all;
      case "hot": return counts.hot;
      case "warm": return counts.warm;
      case "cold": return counts.cold;
      case "new": return counts.new;
      case "no-next-step": return counts.noNextStep;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const count = getCount(filter.key);
        const isActive = activeFilter === filter.key;

        return (
          <Button
            key={filter.key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              "gap-1.5 transition-all",
              !isActive && filter.color
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {filter.label}
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
              isActive 
                ? "bg-primary-foreground/20 text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );
};
