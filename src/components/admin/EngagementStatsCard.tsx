import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EngagementStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: "danger" | "warning" | "success" | "info" | "default";
  onClick?: () => void;
}

const variantStyles = {
  danger: "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
  warning: "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  success: "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
  info: "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
  default: "border-0",
};

const iconStyles = {
  danger: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950",
  warning: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
  success: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950",
  info: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  default: "text-primary bg-primary/10",
};

export const EngagementStatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  onClick,
}: EngagementStatsCardProps) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden shadow-sm transition-all",
        variantStyles[variant],
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              iconStyles[variant]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
