import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientDocuments } from "@/components/ClientDocuments";
import { ClientServices } from "@/components/ClientServices";
import { ClientEmail } from "@/components/ClientEmail";
import { FileText, CalendarDays, Mail } from "lucide-react";

interface ClientFolderDialogProps {
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientFolderDialog({
  clientId,
  clientName,
  clientEmail,
  open,
  onOpenChange,
}: ClientFolderDialogProps) {
  if (!clientId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pasta do Cliente: {clientName}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>
          <TabsContent value="documents" className="mt-4">
            <ClientDocuments clientId={clientId} />
          </TabsContent>
          <TabsContent value="services" className="mt-4">
            <ClientServices clientId={clientId} />
          </TabsContent>
          <TabsContent value="email" className="mt-4">
            <ClientEmail
              clientId={clientId}
              clientName={clientName}
              clientEmail={clientEmail}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
