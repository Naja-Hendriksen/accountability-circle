import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, CheckCircle, XCircle, Clock, Mail, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from "@/lib/auth";

interface DeletionRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  reason: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  completed: <CheckCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

export function DeletionRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch pending deletion requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["deletion-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deletion_requests")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data as DeletionRequest[];
    },
  });

  // Send notification to member
  const sendMemberNotification = async (
    memberName: string,
    memberEmail: string,
    action: "completed" | "cancelled"
  ) => {
    try {
      await supabase.functions.invoke("notify-deletion-processed", {
        body: { memberName, memberEmail, action },
      });
    } catch (err) {
      console.error("Failed to send member notification:", err);
    }
  };

  // Process deletion request (complete or cancel)
  const processMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
      request,
    }: {
      requestId: string;
      action: "complete" | "cancel";
      request: DeletionRequest;
    }) => {
      if (action === "complete") {
        // Delete user data from all tables
        const userId = request.user_id;
        
        // Delete in correct order to respect foreign keys
        await supabase.from("mini_moves").delete().eq("user_id", userId);
        await supabase.from("weekly_entries").delete().eq("user_id", userId);
        await supabase.from("group_members").delete().eq("user_id", userId);
        await supabase.from("profiles").delete().eq("user_id", userId);
        
        // Mark request as completed
        const { error } = await supabase
          .from("deletion_requests")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            processed_by: user?.id,
          })
          .eq("id", requestId);
        
        if (error) throw error;

        // Log the action
        await logAction({
          action: "process_deletion",
          targetTable: "deletion_requests",
          targetId: requestId,
          oldValue: { status: "pending" },
          newValue: { status: "completed" },
          metadata: { 
            deleted_user_id: userId,
            deleted_user_email: request.user_email,
            deleted_user_name: request.user_name,
          },
        });

        // Notify the member
        await sendMemberNotification(request.user_name, request.user_email, "completed");
      } else {
        // Cancel the request
        const { error } = await supabase
          .from("deletion_requests")
          .update({
            status: "cancelled",
            processed_at: new Date().toISOString(),
            processed_by: user?.id,
          })
          .eq("id", requestId);
        
        if (error) throw error;

        await logAction({
          action: "cancel_deletion",
          targetTable: "deletion_requests",
          targetId: requestId,
          oldValue: { status: "pending" },
          newValue: { status: "cancelled" },
        });

        // Notify the member
        await sendMemberNotification(request.user_name, request.user_email, "cancelled");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deletion-requests"] });
      toast({
        title: variables.action === "complete" 
          ? "Account deleted successfully" 
          : "Deletion request cancelled",
        description: "The member has been notified via email.",
      });
    },
    onError: (error) => {
      console.error("Error processing request:", error);
      toast({
        title: "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-display flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Deletion Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!requests?.length) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-display flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Deletion Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(request.requested_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {request.user_name}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${request.user_email}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {request.user_email}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {request.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${statusColors[request.status]} flex items-center gap-1 w-fit`}
                    >
                      {statusIcons[request.status]}
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Account Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all data for <strong>{request.user_name}</strong> ({request.user_email}), including their profile, weekly entries, mini-moves, and group memberships.
                                <br /><br />
                                <strong>This action cannot be undone.</strong>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  processMutation.mutate({
                                    requestId: request.id,
                                    action: "complete",
                                    request,
                                  })
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {processMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            processMutation.mutate({
                              requestId: request.id,
                              action: "cancel",
                              request,
                            })
                          }
                          disabled={processMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {request.processed_at
                          ? `Processed ${format(new Date(request.processed_at), "MMM d")}`
                          : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}