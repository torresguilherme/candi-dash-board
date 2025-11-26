import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateMeetings } from "./CandidateMeetings";
import { CandidateDocuments } from "./CandidateDocuments";
import { Calendar, FileText } from "lucide-react";

interface CandidateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
}

export const CandidateFolderDialog = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
}: CandidateFolderDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pasta de {candidateName}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="meetings" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reuniões
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="meetings" className="mt-0">
              <CandidateMeetings candidateId={candidateId} />
            </TabsContent>
            
            <TabsContent value="documents" className="mt-0">
              <CandidateDocuments 
                candidateId={candidateId} 
                candidateName={candidateName}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
