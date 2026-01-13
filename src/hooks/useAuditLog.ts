import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type EntityType = "client" | "service" | "document" | "meeting" | "interaction" | "submission";
type ActionType = "create" | "update" | "delete" | "view" | "import" | "export";

interface LogParams {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const log = async ({ action, entityType, entityId, entityName, details }: LogParams) => {
    if (!user) {
      console.warn("Cannot log action: no authenticated user");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("audit_logs")
        .insert({
          user_id: user.id,
          user_email: user.email,
          action,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          details,
        });

      if (error) {
        console.error("Error logging action:", error);
      }
    } catch (err) {
      console.error("Failed to log action:", err);
    }
  };

  return { log };
};
