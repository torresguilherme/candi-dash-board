import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, FileText, Zap, Loader2 } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import { AuditLogsDialog } from "./AuditLogsDialog";
import { sendBulkAttentionWebhook, getAttentionLevel } from "@/lib/attention-webhook";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

interface AdminHeaderProps {
  onSignOut: () => void;
  onToggleSidebar?: () => void;
}

export const AdminHeader = ({ onSignOut, onToggleSidebar }: AdminHeaderProps) => {
  const [showLogs, setShowLogs] = useState(false);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const { toast } = useToast();

  const handleSendAttentionWebhook = async () => {
    setSendingWebhook(true);
    try {
      // Fetch all clients from database
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        throw error;
      }

      // Filter clients that need attention (3+ days without interaction)
      const clientsNeedingAttention = (clients || [])
        .map(client => {
          const daysDiff = client.last_interaction_at 
            ? differenceInDays(new Date(), new Date(client.last_interaction_at))
            : 999; // If no interaction, treat as very old
          
          const attentionLevel = getAttentionLevel(daysDiff);
          
          if (attentionLevel) {
            return {
              ...client,
              attention_level: attentionLevel,
              days_without_interaction: daysDiff,
            };
          }
          return null;
        })
        .filter(Boolean);

      if (clientsNeedingAttention.length === 0) {
        toast({
          title: "Nenhum cliente precisa de atenção",
          description: "Todos os clientes foram contatados recentemente.",
        });
        return;
      }

      // Send to webhook
      const result = await sendBulkAttentionWebhook(clientsNeedingAttention as any);
      
      if (result.success > 0) {
        toast({
          title: "Webhook enviado com sucesso!",
          description: `${result.success} cliente(s) enviado(s) para o webhook.`,
        });
      } else {
        toast({
          title: "Falha ao enviar webhook",
          description: "Não foi possível enviar os dados. Verifique a URL do webhook.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending attention webhook:", error);
      toast({
        title: "Erro ao enviar webhook",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setSendingWebhook(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {onToggleSidebar && (
                <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <img src={logoWhite} alt="Person Corp" className="h-8 object-contain" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSendAttentionWebhook}
                disabled={sendingWebhook}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                {sendingWebhook ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Zap className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Enviar Alertas</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowLogs(true)}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logs</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onSignOut}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AuditLogsDialog open={showLogs} onOpenChange={setShowLogs} />
    </>
  );
};
