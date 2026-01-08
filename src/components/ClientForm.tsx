import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, X } from "lucide-react";

const clientSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  education: z.string().optional(),
  area_of_interest: z.string().optional(),
  region: z.string().optional(),
  linkedin_url: z.string().url("URL inválida").optional().or(z.literal("")),
  contract_number: z.string().optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  contract_value: z.string().optional(),
  payment_method: z.string().optional(),
  installments_count: z.string().optional(),
  installments_due_date: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema> & {
  photo?: File;
  resume?: File;
  services: string[];
  courses: string[];
};

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
  submitButtonText?: string;
  isPublicForm?: boolean;
}

const SERVICES = [
  { id: "career_mentoring", label: "Gerenciamento/Mentoria de Carreira" },
  { id: "market_mapping", label: "Mapeamento de mercado" },
  { id: "support_material", label: "Material de Apoio" },
  { id: "interview_pitch", label: "Pitch de entrevista" },
  { id: "resume_restructuring", label: "Reestruturação curricular" },
  { id: "behavioral_assessment", label: "Avaliação de perfil comportamental" },
  { id: "brain_preference", label: "Avaliação preferência cerebral" },
  { id: "company_direction", label: "Direcionamento para empresas (04 a 12 meses)" },
  { id: "linkedin_service", label: "LinkedIn" },
  { id: "personal_marketing", label: "Marketing Pessoal" },
];

const COURSES = [
  { id: "cnv", label: "CNV (Comunicação não violenta)" },
  { id: "persona_in_foco", label: "Persona in Foco – O poder da inteligência emocional" },
  { id: "pnl_practitioner", label: "Formação em Practitioner em PNL" },
];

const REGIONS = [
  "Zona Oeste",
  "Zona Sul",
  "Zona Leste",
  "Zona Central",
  "Zona Norte",
];

export function ClientForm({ onSubmit, initialData, submitButtonText = "Salvar", isPublicForm = false }: ClientFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.services || []);
  const [selectedCourses, setSelectedCourses] = useState<string[]>(initialData?.courses || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      rg: initialData?.rg || "",
      cpf: initialData?.cpf || "",
      education: initialData?.education || "",
      area_of_interest: initialData?.area_of_interest || "",
      region: initialData?.region || "",
      linkedin_url: initialData?.linkedin_url || "",
      contract_number: initialData?.contract_number || "",
      contract_start_date: initialData?.contract_start_date || "",
      contract_end_date: initialData?.contract_end_date || "",
      contract_value: initialData?.contract_value || "",
      payment_method: initialData?.payment_method || "",
      installments_count: initialData?.installments_count || "",
      installments_due_date: initialData?.installments_due_date || "",
      notes: initialData?.notes || "",
    },
  });

  const paymentMethod = watch("payment_method");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const onFormSubmit = (data: z.infer<typeof clientSchema>) => {
    onSubmit({
      ...data,
      photo: photoFile || undefined,
      resume: resumeFile || undefined,
      services: selectedServices,
      courses: selectedCourses,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" {...register("address")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input id="rg" {...register("rg")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register("cpf")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto do Candidato</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Formação</Label>
            <Input id="education" {...register("education")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area_of_interest">Área de Interesse</Label>
              <Input id="area_of_interest" {...register("area_of_interest")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Região</Label>
              <Select
                value={watch("region") || ""}
                onValueChange={(value) => setValue("region", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currículo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  className="cursor-pointer"
                />
                {resumeFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setResumeFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {resumeFile && (
                <p className="text-sm text-muted-foreground">{resumeFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input
                id="linkedin_url"
                placeholder="https://linkedin.com/in/..."
                {...register("linkedin_url")}
              />
              {errors.linkedin_url && (
                <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Information - Only for admin */}
      {!isPublicForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_number">Nº Contrato</Label>
                <Input id="contract_number" {...register("contract_number")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_start_date">Data Início</Label>
                <Input
                  id="contract_start_date"
                  type="date"
                  {...register("contract_start_date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_end_date">Data Final</Label>
                <Input
                  id="contract_end_date"
                  type="date"
                  {...register("contract_end_date")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_value">Valor do Contrato (R$)</Label>
                <Input
                  id="contract_value"
                  type="number"
                  step="0.01"
                  {...register("contract_value")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                <Select
                  value={watch("payment_method") || ""}
                  onValueChange={(value) => setValue("payment_method", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">À vista</SelectItem>
                    <SelectItem value="installments">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {paymentMethod === "installments" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="installments_count">Quantidade de Parcelas</Label>
                  <Input
                    id="installments_count"
                    type="number"
                    {...register("installments_count")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installments_due_date">Data Vencimento Parcelas</Label>
                  <Input
                    id="installments_due_date"
                    type="date"
                    {...register("installments_due_date")}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contracted Services - Only for admin */}
      {!isPublicForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Serviços Contratados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SERVICES.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <Label htmlFor={service.id} className="cursor-pointer font-normal">
                    {service.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses - Only for admin */}
      {!isPublicForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {COURSES.map((course) => (
                <div key={course.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={course.id}
                    checked={selectedCourses.includes(course.id)}
                    onCheckedChange={() => handleCourseToggle(course.id)}
                  />
                  <Label htmlFor={course.id} className="cursor-pointer font-normal">
                    {course.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes - Only for admin */}
      {!isPublicForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observações adicionais..."
              {...register("notes")}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      <Button type="submit" className="w-full">
        {submitButtonText}
      </Button>
    </form>
  );
}
