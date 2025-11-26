import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Meeting {
  id: string;
  meeting_date: string;
  notes: string | null;
  created_at: string;
}

interface CandidateMeetingsProps {
  candidateId: string;
}

export const CandidateMeetings = ({ candidateId }: CandidateMeetingsProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    date: "",
    notes: "",
  });

  useEffect(() => {
    fetchMeetings();
  }, [candidateId]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('candidate_meetings')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      toast.error("Erro ao carregar reuniões");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeeting = async () => {
    if (!newMeeting.date) {
      toast.error("Por favor, informe a data da reunião");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('candidate_meetings')
        .insert({
          candidate_id: candidateId,
          meeting_date: newMeeting.date,
          notes: newMeeting.notes || null,
        });

      if (error) throw error;

      toast.success("Reunião adicionada com sucesso!");
      setNewMeeting({ date: "", notes: "" });
      setIsAdding(false);
      fetchMeetings();
    } catch (error: any) {
      console.error('Error adding meeting:', error);
      toast.error("Erro ao adicionar reunião");
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('candidate_meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Reunião excluída com sucesso!");
      fetchMeetings();
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast.error("Erro ao excluir reunião");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Carregando reuniões...</div>;
  }

  return (
    <div className="space-y-4">
      {!isAdding && (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Reunião
        </Button>
      )}

      {isAdding && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-date">Data da Reunião *</Label>
              <Input
                id="meeting-date"
                type="datetime-local"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-notes">Observações</Label>
              <Textarea
                id="meeting-notes"
                placeholder="Notas sobre a reunião..."
                value={newMeeting.notes}
                onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMeeting} className="flex-1">Salvar</Button>
              <Button 
                onClick={() => {
                  setIsAdding(false);
                  setNewMeeting({ date: "", notes: "" });
                }} 
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {meetings.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Nenhuma reunião registrada ainda
          </p>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      {format(new Date(meeting.meeting_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    {meeting.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{meeting.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingId(meeting.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de reunião? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDeleteMeeting(deletingId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
