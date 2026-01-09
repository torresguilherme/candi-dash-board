import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData } from "./ClientForm";

interface ServiceWithDatesProps {
  form: UseFormReturn<ClientFormData>;
  serviceName: keyof NonNullable<ClientFormData["services"]>;
  label: string;
  description?: string;
  showDates?: boolean;
}

export const ServiceWithDates = ({
  form,
  serviceName,
  label,
  description,
  showDates = true,
}: ServiceWithDatesProps) => {
  const isChecked = form.watch(`services.${serviceName}`);
  const scheduledField = `service_dates.${serviceName}_scheduled` as const;
  const deliveredField = `service_dates.${serviceName}_delivered` as const;

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <FormField
        control={form.control}
        name={`services.${serviceName}`}
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
      {showDates && isChecked && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7 pt-2 border-t border-dashed">
          <FormField
            control={form.control}
            name={scheduledField as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Data Prevista de Entrega
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={deliveredField as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Data de Entrega
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};
