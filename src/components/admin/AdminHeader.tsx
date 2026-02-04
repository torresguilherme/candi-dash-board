import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, FileText, Zap, Loader2 } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import { AuditLogsDialog } from "./AuditLogsDialog";
import { testAttentionWebhook } from "@/lib/attention-webhook";
import { useToast } from "@/hooks/use-toast";

interface AdminHeaderProps {
  onSignOut: () => void;
  onToggleSidebar?: () => void;
}

export const AdminHeader = ({ onSignOut, onToggleSidebar }: AdminHeaderProps) => {
  const [showLogs, setShowLogs] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const { toast } = useToast();

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const success = await testAttentionWebhook();
      if (success) {
        toast({
          title: "Webhook testado com sucesso!",
          description: "Os dados de teste foram enviados para o webhook.",
        });
      } else {
        toast({
          title: "Falha no teste do webhook",
          description: "Não foi possível enviar os dados. Verifique a URL do webhook.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao testar webhook",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(false);
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
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                {testingWebhook ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Zap className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Testar Webhook</span>
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
