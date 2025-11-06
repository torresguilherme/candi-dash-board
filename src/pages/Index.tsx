import { useState } from "react";
import { CandidateForm, CandidateFormData } from "@/components/CandidateForm";
import { CandidateTable, Candidate } from "@/components/CandidateTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const Index = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const handleAddCandidate = (data: CandidateFormData) => {
    const newCandidate: Candidate = {
      ...data,
      id: crypto.randomUUID(),
    };
    setCandidates((prev) => [...prev, newCandidate]);
  };

  const handleEditCandidate = (id: string, data: CandidateFormData) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id ? { ...candidate, ...data } : candidate
      )
    );
  };

  const handleDeleteCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((candidate) => candidate.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Painel de Gerenciamento de Candidatos
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema profissional para organizar seus processos seletivos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Cadastrar Novo Candidato</CardTitle>
              <CardDescription>
                Preencha os dados do candidato no formulário abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateForm onSubmit={handleAddCandidate} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Candidatos Cadastrados</CardTitle>
              <CardDescription>
                {candidates.length === 0
                  ? "Nenhum candidato cadastrado"
                  : `${candidates.length} candidato${candidates.length !== 1 ? "s" : ""} no sistema`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateTable
                candidates={candidates}
                onEdit={handleEditCandidate}
                onDelete={handleDeleteCandidate}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
