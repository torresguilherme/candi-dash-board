import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageCircle, Calendar, FileText, Users, Loader2 } from "lucide-react";

interface InteractionLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

const interactionTypes = [
  { value: "phone_call", label: "Ligação", icon: Phone },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "meeting", label: "Reunião", icon: Calendar },
  { value: "document", label: "Envio de Documento", icon: FileText },
  { value: "other", label: "Outro", icon: Users },
];

export const InteractionLogDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: InteractionLogDialogProps) => {
  const [interactionType, setInteractionType] = useState("");
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextStepDate, setNextStepDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!interactionType) {
      toast({
        title: "Selecione o tipo de interação",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Insert interaction log
      const { error: interactionError } = await supabase
        .from("client_interactions")
        .insert({
          client_id: clientId,
          interaction_type: interactionType,
          notes: notes || null,
        });

      if (interactionError) throw interactionError;

      // Update client next_step if provided
      const updateData: Record<string, string | null> = {};
      if (nextStep) updateData.next_step = nextStep;
      if (nextStepDate) updateData.next_step_date = nextStepDate;
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(updateData)
          .eq("id", clientId);

        if (updateError) throw updateError;
      }

      // Reset form and close dialog FIRST
      resetForm();
      onOpenChange(false);
      
      // Show success toast
      toast({
        title: "Interação registrada!",
        description: "O cliente foi marcado como 'Quente' automaticamente.",
      });

      // Refresh data AFTER dialog is closed to prevent blank screen
      setTimeout(() => {
        onSuccess();
      }, 100);
    } catch (error: unknown) {
      console.error("Error logging interaction:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao registrar interação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setInteractionType("");
    setNotes("");
    setNextStep("");
    setNextStepDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
          <DialogDescription>
            Registre uma nova interação com <strong>{clientName}</strong>. 
            Isso irá atualizar a temperatura do cliente para "Quente".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Interação *</Label>
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {interactionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Resumo</Label>
            <Textarea
              id="notes"
              placeholder="Descreva brevemente a interação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextStep">Próximo Passo</Label>
              <Select value={nextStep} onValueChange={setNextStep}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aguardando Resposta">Aguardando Resposta</SelectItem>
                  <SelectItem value="Enviar Proposta">Enviar Proposta</SelectItem>
                  <SelectItem value="Agendar Reunião">Agendar Reunião</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Enviar Material">Enviar Material</SelectItem>
                  <SelectItem value="Aguardando Documentos">Aguardando Documentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextStepDate">Data do Próximo Passo</Label>
              <Input
                id="nextStepDate"
                type="date"
                value={nextStepDate}
                onChange={(e) => setNextStepDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Registrar Interação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
