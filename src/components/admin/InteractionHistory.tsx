import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MessageCircle, Calendar, FileText, Users, Loader2, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Interaction {
  id: string;
  interaction_type: string;
  notes: string | null;
  created_at: string;
}

interface InteractionHistoryProps {
  clientId: string;
  refreshTrigger?: number;
}

const interactionTypeConfig: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  phone_call: { label: "Ligação", icon: Phone, color: "text-green-600 bg-green-100" },
  email: { label: "E-mail", icon: Mail, color: "text-blue-600 bg-blue-100" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-100" },
  meeting: { label: "Reunião", icon: Calendar, color: "text-purple-600 bg-purple-100" },
  document: { label: "Documento", icon: FileText, color: "text-orange-600 bg-orange-100" },
  other: { label: "Outro", icon: Users, color: "text-gray-600 bg-gray-100" },
};

export const InteractionHistory = ({ clientId, refreshTrigger }: InteractionHistoryProps) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("client_interactions")
          .select("id, interaction_type, notes, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setInteractions(data || []);
      } catch (error) {
        console.error("Error fetching interactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInteractions();
  }, [clientId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma interação registrada</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] pr-3">
      <div className="space-y-3">
        {interactions.map((interaction) => {
          const config = interactionTypeConfig[interaction.interaction_type] || interactionTypeConfig.other;
          const Icon = config.icon;

          return (
            <div
              key={interaction.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{config.label}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(interaction.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {interaction.notes && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {interaction.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
