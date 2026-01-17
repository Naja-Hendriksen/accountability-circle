import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface EmailHistoryItem {
  id: string;
  recipient_email: string;
  recipient_name: string;
  template_key: string;
  subject: string;
  status: string;
  sent_at: string;
  error_message: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

interface EmailHistoryProps {
  limit?: number;
}

const EmailHistory = ({ limit = 50 }: EmailHistoryProps) => {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ["email-history", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_history")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as EmailHistoryItem[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load email history
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No emails have been sent yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <Card key={item.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5">
                  {item.status === "sent" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : item.status === "failed" ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{item.recipient_name}</span>
                    <Badge className={statusConfig[item.template_key]?.color || "bg-gray-100"}>
                      {statusConfig[item.template_key]?.label || item.template_key}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.recipient_email}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    <Mail className="w-3 h-3 inline mr-1" />
                    {item.subject}
                  </p>
                  {item.error_message && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {item.error_message}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                <div>{format(new Date(item.sent_at), "MMM d, yyyy")}</div>
                <div>{format(new Date(item.sent_at), "h:mm a")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmailHistory;
