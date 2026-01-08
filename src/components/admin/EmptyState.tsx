import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddCandidate: () => void;
}

export const EmptyState = ({ onAddCandidate }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <Users className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum candidato cadastrado</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Comece adicionando o primeiro candidato ao sistema. Você pode importar dados ou adicionar manualmente.
      </p>
      <Button onClick={onAddCandidate} size="lg">
        <UserPlus className="h-5 w-5 mr-2" />
        Adicionar Primeiro Candidato
      </Button>
    </div>
  );
};
