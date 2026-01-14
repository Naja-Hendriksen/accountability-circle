import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type ApplicationStatus = "pending" | "approved" | "rejected";

interface Application {
  id: string;
  location: string;
  availability: string;
  commitment_level: number;
  commitment_explanation: string;
  growth_goal: string;
  digital_product: string;
  excitement: string;
  agreed_to_guidelines: boolean;
  gdpr_consent: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  approved: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
};

const AdminApplications = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Check if user is admin
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
    enabled: isAdmin === true,
  });

  // Update application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Application status updated" });
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getAvailabilityLabel = (value: string) => {
    switch (value) {
      case "yes-consistently":
        return "Yes, consistently";
      case "yes-mostly":
        return "Yes, most weeks";
      case "no":
        return "No, schedule varies";
      default:
        return value;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-display">
                Application Submissions
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !applications?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  No applications found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Commitment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(app.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{app.location}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getAvailabilityLabel(app.availability)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{app.commitment_level}</span>
                            <span className="text-muted-foreground">/10</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${statusColors[app.status]} flex items-center gap-1 w-fit`}
                            >
                              {statusIcons[app.status]}
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedApplication(app)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Application Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedApplication && (
                                    <div className="space-y-6 py-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Submitted
                                          </p>
                                          <p className="font-medium">
                                            {format(
                                              new Date(selectedApplication.created_at),
                                              "MMMM d, yyyy 'at' h:mm a"
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Status
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className={`${statusColors[selectedApplication.status]} flex items-center gap-1 w-fit mt-1`}
                                          >
                                            {statusIcons[selectedApplication.status]}
                                            {selectedApplication.status.charAt(0).toUpperCase() +
                                              selectedApplication.status.slice(1)}
                                          </Badge>
                                        </div>
                                      </div>

                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Location
                                        </p>
                                        <p className="font-medium">
                                          {selectedApplication.location}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Availability
                                        </p>
                                        <p className="font-medium">
                                          {getAvailabilityLabel(
                                            selectedApplication.availability
                                          )}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Commitment Level:{" "}
                                          <span className="font-medium text-foreground">
                                            {selectedApplication.commitment_level}/10
                                          </span>
                                        </p>
                                        <p className="mt-1">
                                          {selectedApplication.commitment_explanation}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                          Growth Goal (3-6 months)
                                        </p>
                                        <p className="bg-muted/50 p-3 rounded-lg">
                                          {selectedApplication.growth_goal}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                          Digital Product/Asset
                                        </p>
                                        <p className="bg-muted/50 p-3 rounded-lg">
                                          {selectedApplication.digital_product}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                          What Excites Them
                                        </p>
                                        <p className="bg-muted/50 p-3 rounded-lg">
                                          {selectedApplication.excitement}
                                        </p>
                                      </div>

                                      <div className="flex gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          {selectedApplication.agreed_to_guidelines ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                          <span>Agreed to Guidelines</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {selectedApplication.gdpr_consent ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                          <span>GDPR Consent</span>
                                        </div>
                                      </div>

                                      <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                          onClick={() => {
                                            updateStatusMutation.mutate({
                                              id: selectedApplication.id,
                                              status: "approved",
                                            });
                                            setSelectedApplication({
                                              ...selectedApplication,
                                              status: "approved",
                                            });
                                          }}
                                          disabled={
                                            selectedApplication.status === "approved" ||
                                            updateStatusMutation.isPending
                                          }
                                          className="flex-1"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => {
                                            updateStatusMutation.mutate({
                                              id: selectedApplication.id,
                                              status: "rejected",
                                            });
                                            setSelectedApplication({
                                              ...selectedApplication,
                                              status: "rejected",
                                            });
                                          }}
                                          disabled={
                                            selectedApplication.status === "rejected" ||
                                            updateStatusMutation.isPending
                                          }
                                          className="flex-1"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {app.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: app.id,
                                        status: "approved",
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: app.id,
                                        status: "rejected",
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminApplications;
