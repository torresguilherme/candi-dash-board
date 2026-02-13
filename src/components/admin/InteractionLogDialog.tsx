import { useState, useEffect, useRef } from "react";
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
import { Phone, Mail, MessageCircle, Calendar, FileText, Users, Loader2, UserCheck, Paperclip, X } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
}

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
  const [nextStepAssignedTo, setNextStepAssignedTo] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
    }
  }, [open]);

  const fetchTeamMembers = async () => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "editor"]);

      if (roleError) throw roleError;

      if (roleData && roleData.length > 0) {
        const userIds = roleData.map((r) => r.user_id);
        
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);

        if (profileError) throw profileError;
        setTeamMembers(profileData || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

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
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      if (attachment) {
        const filePath = `${clientId}/interactions/${Date.now()}_${attachment.name}`;
        const { error: uploadError } = await supabase.storage
          .from("candidate-documents")
          .upload(filePath, attachment);

        if (uploadError) throw uploadError;
        attachmentUrl = filePath;
        attachmentName = attachment.name;
      }

      const { error: interactionError } = await supabase
        .from("client_interactions")
        .insert({
          client_id: clientId,
          interaction_type: interactionType,
          notes: notes || null,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
        });

      if (interactionError) throw interactionError;

      const updateData: Record<string, string | null> = {};
      if (nextStep) updateData.next_step = nextStep;
      if (nextStepDate) updateData.next_step_date = nextStepDate;
      if (nextStepAssignedTo) updateData.next_step_assigned_to = nextStepAssignedTo;
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(updateData)
          .eq("id", clientId);

        if (updateError) throw updateError;
      }

      resetForm();
      onOpenChange(false);
      
      toast({
        title: "Interação registrada!",
        description: "O cliente foi marcado como 'Quente' automaticamente.",
      });

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
    setNextStepAssignedTo("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

          {/* Anexo de Arquivo */}
          <div className="space-y-2">
            <Label>Anexar Arquivo</Label>
            {attachment ? (
              <div className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => {
                    setAttachment(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Selecionar Arquivo
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextStep">Próximo Passo</Label>
            <Select value={nextStep} onValueChange={setNextStep}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o próximo passo..." />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextStepAssignedTo">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Atribuir a
                </div>
              </Label>
              <Select value={nextStepAssignedTo} onValueChange={setNextStepAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.email}
                    </SelectItem>
                  ))}
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
