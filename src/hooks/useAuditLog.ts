import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface AuditLogParams {
  action: string;
  targetTable: string;
  targetId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = async ({
    action,
    targetTable,
    targetId,
    oldValue,
    newValue,
    metadata,
  }: AuditLogParams) => {
    if (!user?.id) {
      console.error("Cannot log action: no authenticated user");
      return;
    }

    try {
      const { error } = await supabase.from("audit_logs" as any).insert({
        admin_user_id: user.id,
        action,
        target_table: targetTable,
        target_id: targetId,
        old_value: oldValue ?? null,
        new_value: newValue ?? null,
        metadata: metadata ?? null,
      } as any);

      if (error) {
        console.error("Failed to log audit action:", error);
      }
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  return { logAction };
};
