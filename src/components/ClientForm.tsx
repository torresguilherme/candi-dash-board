import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap,
  Camera,
  X,
  CalendarClock
} from "lucide-react";

const clientFormSchema = z.object({
  // Dados Pessoais
  full_name: z.string().min(3, { message: "Nome completo é obrigatório" }),
  address: z.string().optional(),
  email: z.string().email({ message: "E-mail inválido" }),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  photo: z.any().optional(),
  education: z.string().optional(),
  area_of_interest: z.string().optional(),
  region: z.string().optional(),
  resume: z.any().optional(),
  linkedin_url: z.string().optional(),
  
  // Dados do Contrato
  contract_number: z.string().optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  contract_value: z.string().optional(),
  payment_method: z.string().optional(),
  installments_count: z.string().optional(),
  installments_due_date: z.string().optional(),
  
  // Serviços
  services: z.object({
    career_mentoring: z.boolean().default(false),
    market_mapping: z.boolean().default(false),
    support_material: z.boolean().default(false),
    interview_pitch: z.boolean().default(false),
    resume_restructuring: z.boolean().default(false),
    behavioral_assessment: z.boolean().default(false),
    brain_preference: z.boolean().default(false),
    company_referral: z.boolean().default(false),
    linkedin_service: z.boolean().default(false),
    personal_marketing: z.boolean().default(false),
  }).optional(),
  
  // Cursos
  courses: z.object({
    cnv: z.boolean().default(false),
    persona_in_foco: z.boolean().default(false),
    pnl_practitioner: z.boolean().default(false),
  }).optional(),
  
  // Datas dos Serviços - agora com scheduled e delivered para cada serviço
  service_dates: z.object({
    career_mentoring_dates: z.string().optional(),
    career_mentoring_scheduled: z.string().optional(),
    career_mentoring_delivered: z.string().optional(),
    market_mapping_scheduled: z.string().optional(),
    market_mapping_delivered: z.string().optional(),
    support_material_scheduled: z.string().optional(),
    support_material_delivered: z.string().optional(),
    interview_pitch_scheduled: z.string().optional(),
    interview_pitch_delivered: z.string().optional(),
    resume_restructuring_scheduled: z.string().optional(),
    resume_restructuring_delivered: z.string().optional(),
    behavioral_assessment_scheduled: z.string().optional(),
    behavioral_assessment_delivered: z.string().optional(),
    brain_preference_scheduled: z.string().optional(),
    brain_preference_delivered: z.string().optional(),
    company_referral_duration: z.string().optional(),
    company_referral_scheduled: z.string().optional(),
    company_referral_delivered: z.string().optional(),
    linkedin_service_scheduled: z.string().optional(),
    linkedin_service_delivered: z.string().optional(),
    personal_marketing_scheduled: z.string().optional(),
    personal_marketing_delivered: z.string().optional(),
    cnv_scheduled: z.string().optional(),
    cnv_rescheduled: z.string().optional(),
    cnv_delivered: z.string().optional(),
    persona_scheduled: z.string().optional(),
    persona_rescheduled: z.string().optional(),
    persona_delivered: z.string().optional(),
    pnl_scheduled: z.string().optional(),
    pnl_rescheduled: z.string().optional(),
    pnl_delivered: z.string().optional(),
  }).optional(),
  
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void | Promise<void>;
  defaultValues?: Partial<ClientFormData>;
  submitButtonText?: string;
  existingEmails?: string[];
  currentEmail?: string;
  existingPhotoUrl?: string | null;
  clientId?: string; // For draft persistence
}

const regions = [
  "Zona Oeste",
  "Zona Sul", 
  "Zona Leste",
  "Zona Norte",
  "Central",
];

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .substring(0, 14);
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};

const formatCurrency = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Helper component for service cards with dates
const ServiceCard = ({
  form,
  name,
  label,
  description,
  children,
}: {
  form: UseFormReturn<ClientFormData>;
  name: `services.${keyof NonNullable<ClientFormData["services"]>}`;
  label: string;
  description?: string;
  children?: React.ReactNode;
}) => (
  <div className="p-4 border rounded-lg space-y-3">
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="cursor-pointer font-medium">{label}</FormLabel>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </FormItem>
      )}
    />
    {children}
  </div>
);

// Helper component for date fields
const ServiceDateFields = ({
  form,
  prefix,
}: {
  form: UseFormReturn<ClientFormData>;
  prefix: string;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-dashed">
    <FormField
      control={form.control}
      name={`service_dates.${prefix}_scheduled` as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm text-muted-foreground">Data Prevista</FormLabel>
          <FormControl>
            <Input type="date" {...field} value={field.value || ""} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name={`service_dates.${prefix}_delivered` as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm text-muted-foreground">Data de Entrega</FormLabel>
          <FormControl>
            <Input type="date" {...field} value={field.value || ""} />
          </FormControl>
        </FormItem>
      )}
    />
  </div>
);

export const ClientForm = ({
  onSubmit,
  defaultValues,
  submitButtonText = "Salvar Cliente",
  existingEmails = [],
  currentEmail,
  existingPhotoUrl,
  clientId,
}: ClientFormProps) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl || null);
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Use persistence for new clients only (not when editing)
  const isNewClient = !defaultValues;
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useFormPersistence(
    isNewClient ? undefined : clientId
  );

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultValues || {
      full_name: "",
      email: "",
      services: {
        career_mentoring: false,
        market_mapping: false,
        support_material: false,
        interview_pitch: false,
        resume_restructuring: false,
        behavioral_assessment: false,
        brain_preference: false,
        company_referral: false,
        linkedin_service: false,
        personal_marketing: false,
      },
      courses: {
        cnv: false,
        persona_in_foco: false,
        pnl_practitioner: false,
      },
    },
  });

  // Load draft on mount for new clients
  useEffect(() => {
    if (isNewClient && hasDraft) {
      setShowDraftAlert(true);
    }
  }, [isNewClient, hasDraft]);

  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      // Restore all fields except file fields
      const { photo, resume, ...restoreData } = draft;
      Object.entries(restoreData).forEach(([key, value]) => {
        form.setValue(key as any, value);
      });
      toast.success("Rascunho restaurado!");
    }
    setShowDraftAlert(false);
  }, [loadDraft, form]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftAlert(false);
  }, [clearDraft]);

  // Auto-save draft when form changes (debounced)
  const formValues = form.watch();
  useEffect(() => {
    if (!isNewClient) return;
    
    // Don't save empty forms
    if (!formValues.full_name && !formValues.email) return;
    
    const timeoutId = setTimeout(() => {
      // Save everything except File objects
      const { photo, resume, ...dataToSave } = formValues;
      saveDraft(dataToSave);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formValues, isNewClient, saveDraft]);

  const watchServices = form.watch("services");
  const watchCourses = form.watch("courses");
  const watchName = form.watch("full_name");

  const handlePhotoChange = (file: File | undefined) => {
    if (!file) return;

    // Prevent unsupported formats (common issue: HEIC from iPhone)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato de foto não suportado. Use JPG, PNG ou WebP.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    form.setValue("photo", file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    form.setValue("photo", undefined);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleSubmit = async (data: ClientFormData) => {
    if (
      existingEmails.includes(data.email.toLowerCase()) &&
      data.email.toLowerCase() !== currentEmail?.toLowerCase()
    ) {
      toast.error("Este e-mail já está cadastrado!");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(data);
      
      // Clear draft on successful save
      if (isNewClient) {
        clearDraft();
      }

      if (!defaultValues) {
        form.reset();
        setPhotoPreview(null);
      }
    } catch (error) {
      // The caller already shows a detailed error toast.
      console.error("ClientForm submit error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 relative">
        {/* Loading Overlay */}
        {isSaving && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">Salvando informações...</p>
            <p className="text-sm text-muted-foreground mt-1">Por favor, aguarde</p>
          </div>
        )}
        {/* Draft Recovery Alert */}
        {showDraftAlert && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span className="text-amber-800 dark:text-amber-200">
                Você tem um rascunho salvo. Deseja restaurar?
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardDraft}
                >
                  Descartar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRestoreDraft}
                >
                  Restaurar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-6">
            {/* Foto do Cliente - Destaque */}
            <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={photoPreview || undefined} alt="Foto do cliente" />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary font-semibold">
                    {watchName ? getInitials(watchName) : <Camera className="h-10 w-10 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="text-center space-y-2">
                <FormLabel className="text-base font-medium">Foto do Cliente</FormLabel>
                <FormDescription className="text-sm text-muted-foreground">
                  Adicione uma foto para identificar o cliente
                </FormDescription>
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {photoPreview ? "Trocar Foto" : "Selecionar Foto"}
                  </Button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            </div>

            {/* Campos do formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="exemplo@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      {...field}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      maxLength={15}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...field}
                      onChange={(e) => field.onChange(formatCPF(e.target.value))}
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o RG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                      <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                      <SelectItem value="Técnico">Técnico</SelectItem>
                      <SelectItem value="Graduação">Graduação</SelectItem>
                      <SelectItem value="Pós-Graduação">Pós-Graduação</SelectItem>
                      <SelectItem value="MBA">MBA</SelectItem>
                      <SelectItem value="Mestrado">Mestrado</SelectItem>
                      <SelectItem value="Doutorado">Doutorado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area_of_interest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área de Interesse</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Administrativo">Administrativo</SelectItem>
                      <SelectItem value="Atendimento">Atendimento</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Engenharia">Engenharia</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="RH">Recursos Humanos</SelectItem>
                      <SelectItem value="TI">Tecnologia</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Região</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resume"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Currículo (PDF)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => onChange(e.target.files?.[0])}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Dados do Contrato */}
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="contract_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº do Contrato</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Final</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Contrato</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="R$ 0,00" 
                      {...field}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        field.onChange(raw);
                      }}
                      value={field.value ? formatCurrency(field.value) : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="a_vista">À Vista</SelectItem>
                      <SelectItem value="parcelado">Parcelado</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installments_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qtd. de Parcelas</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installments_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia do Vencimento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 5, 10, 15, 20, 25, 28, 30].map((day) => (
                        <SelectItem key={day} value={String(day)}>Dia {day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Serviços Contratados */}
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Serviços Contratados
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarClock className="h-4 w-4" />
              Defina datas de entrega para controle no painel
            </p>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Mentoria de Carreira */}
              <ServiceCard
                form={form}
                name="services.career_mentoring"
                label="Gerenciamento/Mentoria de Carreira"
                description="Inclui reuniões periódicas"
              >
                {watchServices?.career_mentoring && (
                  <div className="space-y-3 pt-3 border-t border-dashed">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="service_dates.career_mentoring_scheduled"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Data Prevista</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="service_dates.career_mentoring_delivered"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Data de Entrega</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="service_dates.career_mentoring_dates"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">Datas das Reuniões</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: 01/02/2024, 15/02/2024..." 
                              {...field}
                              className="h-16"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </ServiceCard>

              {/* Mapeamento de Mercado */}
              <ServiceCard
                form={form}
                name="services.market_mapping"
                label="Mapeamento de Mercado"
              >
                {watchServices?.market_mapping && (
                  <ServiceDateFields form={form} prefix="market_mapping" />
                )}
              </ServiceCard>

              {/* Material de Apoio */}
              <ServiceCard
                form={form}
                name="services.support_material"
                label="Material de Apoio"
              >
                {watchServices?.support_material && (
                  <ServiceDateFields form={form} prefix="support_material" />
                )}
              </ServiceCard>

              {/* Pitch de Entrevista */}
              <ServiceCard
                form={form}
                name="services.interview_pitch"
                label="Pitch de Entrevista"
              >
                {watchServices?.interview_pitch && (
                  <ServiceDateFields form={form} prefix="interview_pitch" />
                )}
              </ServiceCard>

              {/* Reestruturação Curricular */}
              <ServiceCard
                form={form}
                name="services.resume_restructuring"
                label="Reestruturação Curricular"
              >
                {watchServices?.resume_restructuring && (
                  <ServiceDateFields form={form} prefix="resume_restructuring" />
                )}
              </ServiceCard>

              {/* Avaliação de Perfil Comportamental */}
              <ServiceCard
                form={form}
                name="services.behavioral_assessment"
                label="Avaliação de Perfil Comportamental"
              >
                {watchServices?.behavioral_assessment && (
                  <ServiceDateFields form={form} prefix="behavioral_assessment" />
                )}
              </ServiceCard>

              {/* Avaliação Preferência Cerebral */}
              <ServiceCard
                form={form}
                name="services.brain_preference"
                label="Avaliação Preferência Cerebral"
              >
                {watchServices?.brain_preference && (
                  <ServiceDateFields form={form} prefix="brain_preference" />
                )}
              </ServiceCard>

              {/* Direcionamento para Empresas */}
              <ServiceCard
                form={form}
                name="services.company_referral"
                label="Direcionamento para Empresas"
                description="4 a 12 meses"
              >
                {watchServices?.company_referral && (
                  <div className="space-y-3 pt-3 border-t border-dashed">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="service_dates.company_referral_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Duração</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                  <SelectItem key={m} value={String(m)}>{m} meses</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="service_dates.company_referral_scheduled"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Data Prevista</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="service_dates.company_referral_delivered"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Data de Entrega</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </ServiceCard>

              {/* LinkedIn */}
              <ServiceCard
                form={form}
                name="services.linkedin_service"
                label="LinkedIn"
              >
                {watchServices?.linkedin_service && (
                  <ServiceDateFields form={form} prefix="linkedin_service" />
                )}
              </ServiceCard>

              {/* Marketing Pessoal */}
              <ServiceCard
                form={form}
                name="services.personal_marketing"
                label="Marketing Pessoal"
              >
                {watchServices?.personal_marketing && (
                  <ServiceDateFields form={form} prefix="personal_marketing" />
                )}
              </ServiceCard>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Cursos */}
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Cursos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* CNV */}
              <div className="p-4 border rounded-lg space-y-4">
                <FormField
                  control={form.control}
                  name="courses.cnv"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-medium">
                          CNV - Comunicação Não Violenta
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                {watchCourses?.cnv && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-7">
                    <FormField
                      control={form.control}
                      name="service_dates.cnv_scheduled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Data Prevista</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service_dates.cnv_rescheduled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Reagendamento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service_dates.cnv_delivered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Data de Entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Persona in Foco */}
              <div className="p-4 border rounded-lg space-y-4">
                <FormField
                  control={form.control}
                  name="courses.persona_in_foco"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-medium">
                          Persona in Foco - O Poder da Inteligência Emocional
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                {watchCourses?.persona_in_foco && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-7">
                    <FormField
                      control={form.control}
                      name="service_dates.persona_scheduled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Data Prevista</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service_dates.persona_rescheduled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Reagendamento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service_dates.persona_delivered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Data de Entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* PNL Practitioner */}
              <div className="p-4 border rounded-lg space-y-4">
                <FormField
                  control={form.control}
                  name="courses.pnl_practitioner"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-medium">
                          Formação em Practitioner em PNL
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                {watchCourses?.pnl_practitioner && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-7">
                    <FormField
                      control={form.control}
                      name="service_dates.pnl_scheduled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Data Prevista</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service_dates.pnl_rescheduled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Reagendamento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service_dates.pnl_delivered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Data de Entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Anotações adicionais sobre o cliente..." 
                  {...field}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </form>
    </Form>
  );
};
