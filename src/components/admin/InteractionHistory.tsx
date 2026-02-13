import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MessageCircle, Calendar, FileText, Users, Loader2, History, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchInteractions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("client_interactions")
          .select("id, interaction_type, notes, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(50);

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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    <ScrollArea className="h-[400px] pr-3">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-1">
          {interactions.map((interaction) => {
            const config = interactionTypeConfig[interaction.interaction_type] || interactionTypeConfig.other;
            const Icon = config.icon;
            const isExpanded = expandedIds.has(interaction.id);
            const hasLongNotes = interaction.notes && interaction.notes.length > 80;

            return (
              <div
                key={interaction.id}
                className="relative flex items-start gap-3 pl-1"
              >
                {/* Timeline dot */}
                <div className={`relative z-10 p-1.5 rounded-full shrink-0 ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{config.label}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(interaction.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {interaction.notes && (
                    <div className="mt-1">
                      <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${!isExpanded && hasLongNotes ? "line-clamp-2" : ""}`}>
                        {interaction.notes}
                      </p>
                      {hasLongNotes && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => toggleExpand(interaction.id)}
                        >
                          {isExpanded ? (
                            <><ChevronUp className="h-3 w-3 mr-1" /> Ver menos</>
                          ) : (
                            <><ChevronDown className="h-3 w-3 mr-1" /> Ver mais</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};
