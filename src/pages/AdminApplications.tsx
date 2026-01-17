import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navigate, Link } from "react-router-dom";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Loader2, Trash2, RotateCcw, Search, Download, CalendarIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

type ApplicationStatus = "pending" | "approved" | "rejected" | "removed";

interface Application {
  id: string;
  full_name: string;
  email: string;
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
  removed: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  approved: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
  removed: <XCircle className="w-3 h-3" />,
};

const AdminApplications = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewedApplications, setViewedApplications] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(undefined);
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(undefined);
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);

  // Log when admin views application details
  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
    
    // Only log if not already viewed in this session
    if (!viewedApplications.has(app.id)) {
      logAction({
        action: "view",
        targetTable: "applications",
        targetId: app.id,
        metadata: { status: app.status },
      });
      setViewedApplications((prev) => new Set(prev).add(app.id));
    }
  };

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

      if (statusFilter === "all") {
        // "all" shows everything except removed applications
        query = query.neq("status", "removed");
      } else {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
    enabled: isAdmin === true,
  });

  // Send email notification
  const sendNotification = async (email: string, name: string, status: ApplicationStatus) => {
    try {
      const { error } = await supabase.functions.invoke("send-status-notification", {
        body: { email, name, status },
      });
      if (error) {
        console.error("Error sending notification:", error);
      }
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  };

  // Update application status with audit logging
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      oldStatus,
      email,
      name,
    }: { 
      id: string; 
      status: ApplicationStatus; 
      oldStatus?: string;
      email: string;
      name: string;
    }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      
      // Log the status change
      await logAction({
        action: "update_status",
        targetTable: "applications",
        targetId: id,
        oldValue: { status: oldStatus },
        newValue: { status },
      });

      // Send email notification (fire and forget)
      sendNotification(email, name, status);
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

  // Bulk update application statuses
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ 
      ids, 
      status 
    }: { 
      ids: string[]; 
      status: ApplicationStatus; 
    }) => {
      // Get old statuses for logging
      const appsToUpdate = applications?.filter(app => ids.includes(app.id)) || [];
      
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .in("id", ids);
      if (error) throw error;
      
      // Log each status change and send notifications
      for (const app of appsToUpdate) {
        await logAction({
          action: "bulk_update_status",
          targetTable: "applications",
          targetId: app.id,
          oldValue: { status: app.status },
          newValue: { status },
          metadata: { bulk_action: true, total_updated: ids.length },
        });
        
        // Send email notification (fire and forget)
        sendNotification(app.email, app.full_name, status);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setSelectedIds(new Set());
      toast({ title: `${variables.ids.length} application(s) updated to ${variables.status}` });
    },
    onError: (error) => {
      console.error("Error updating statuses:", error);
      toast({ title: "Failed to update statuses", variant: "destructive" });
    },
  });

  const handleSelectAll = (checked: boolean, filteredApps: Application[]) => {
    if (checked) {
      setSelectedIds(new Set(filteredApps.map(app => app.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkAction = (status: ApplicationStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkUpdateStatusMutation.mutate({ ids, status });
  };

  const exportToCSV = () => {
    if (!applications?.length) return;

    // Filter by date range if specified
    let filteredApps = applications;
    if (exportStartDate || exportEndDate) {
      filteredApps = applications.filter((app) => {
        const appDate = new Date(app.created_at);
        if (exportStartDate && exportEndDate) {
          return isWithinInterval(appDate, {
            start: startOfDay(exportStartDate),
            end: endOfDay(exportEndDate),
          });
        }
        if (exportStartDate) {
          return appDate >= startOfDay(exportStartDate);
        }
        if (exportEndDate) {
          return appDate <= endOfDay(exportEndDate);
        }
        return true;
      });
    }

    if (!filteredApps.length) {
      toast({ title: "No applications in selected date range", variant: "destructive" });
      return;
    }

    const headers = [
      "Date",
      "Name",
      "Email",
      "Location",
      "Availability",
      "Commitment Level",
      "Commitment Explanation",
      "Growth Goal",
      "Digital Product",
      "Excitement",
      "Agreed to Guidelines",
      "GDPR Consent",
      "Status",
    ];

    const escapeCSV = (value: string | number | boolean) => {
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredApps.map((app) => [
      format(new Date(app.created_at), "yyyy-MM-dd"),
      escapeCSV(app.full_name),
      escapeCSV(app.email),
      escapeCSV(app.location),
      escapeCSV(getAvailabilityLabel(app.availability)),
      app.commitment_level,
      escapeCSV(app.commitment_explanation),
      escapeCSV(app.growth_goal),
      escapeCSV(app.digital_product),
      escapeCSV(app.excitement),
      app.agreed_to_guidelines ? "Yes" : "No",
      app.gdpr_consent ? "Yes" : "No",
      app.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Include date range in filename if specified
    let filename = "applications";
    if (exportStartDate) filename += `-from-${format(exportStartDate, "yyyy-MM-dd")}`;
    if (exportEndDate) filename += `-to-${format(exportEndDate, "yyyy-MM-dd")}`;
    if (!exportStartDate && !exportEndDate) filename += `-${format(new Date(), "yyyy-MM-dd")}`;
    link.download = `${filename}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportPopoverOpen(false);
    toast({ title: `${filteredApps.length} application(s) exported successfully` });
  };

  const clearDateRange = () => {
    setExportStartDate(undefined);
    setExportEndDate(undefined);
  };

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
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-2xl font-display">
                Application Submissions
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[250px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="removed">Removed</SelectItem>
                  </SelectContent>
                </Select>
                <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!applications?.length}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Date Range (optional)</h4>
                        <p className="text-xs text-muted-foreground">
                          Leave empty to export all applications
                        </p>
                      </div>
                      
                      <div className="grid gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">From</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !exportStartDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {exportStartDate ? format(exportStartDate, "PPP") : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={exportStartDate}
                                onSelect={setExportStartDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-medium">To</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !exportEndDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {exportEndDate ? format(exportEndDate, "PPP") : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={exportEndDate}
                                onSelect={setExportEndDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {(exportStartDate || exportEndDate) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={clearDateRange}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear dates
                        </Button>
                      )}

                      <Button 
                        className="w-full" 
                        onClick={exportToCSV}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export {exportStartDate || exportEndDate ? "filtered" : "all"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredApplications = applications?.filter((app) => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    app.full_name.toLowerCase().includes(query) ||
                    app.email.toLowerCase().includes(query)
                  );
                });

                if (applicationsLoading) {
                  return (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  );
                }

                if (!filteredApplications?.length) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      {searchQuery.trim() 
                        ? "No applications match your search." 
                        : "No applications found."}
                    </div>
                  );
                }

                const allSelected = filteredApplications.length > 0 && 
                  filteredApplications.every(app => selectedIds.has(app.id));
                const someSelected = filteredApplications.some(app => selectedIds.has(app.id));

                return (
                <>
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 p-3 mb-4 bg-muted rounded-lg border">
                      <span className="text-sm font-medium">
                        {selectedIds.size} selected
                      </span>
                      <div className="flex gap-2 ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleBulkAction("approved")}
                          disabled={bulkUpdateStatusMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleBulkAction("rejected")}
                          disabled={bulkUpdateStatusMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          onClick={() => handleBulkAction("removed")}
                          disabled={bulkUpdateStatusMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedIds(new Set())}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={(checked) => 
                                handleSelectAll(checked as boolean, filteredApplications)
                              }
                              aria-label="Select all"
                              className={someSelected && !allSelected ? "opacity-50" : ""}
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Commitment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id} className={selectedIds.has(app.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(app.id)}
                              onCheckedChange={(checked) => 
                                handleSelectOne(checked as boolean, app.id)
                              }
                              aria-label={`Select ${app.full_name}`}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(app.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">{app.full_name}</TableCell>
                          <TableCell>
                            <a 
                              href={`mailto:${app.email}`} 
                              className="text-primary hover:underline"
                            >
                              {app.email}
                            </a>
                          </TableCell>
                          <TableCell>{app.location}</TableCell>
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
                                    onClick={() => handleViewApplication(app)}
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
                                            Full Name
                                          </p>
                                          <p className="font-medium text-lg">
                                            {selectedApplication.full_name}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Email
                                          </p>
                                          <a 
                                            href={`mailto:${selectedApplication.email}`}
                                            className="font-medium text-primary hover:underline"
                                          >
                                            {selectedApplication.email}
                                          </a>
                                        </div>
                                      </div>

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
                                        {selectedApplication.status === "removed" ? (
                                          <Button
                                            onClick={() => {
                                              updateStatusMutation.mutate({
                                                id: selectedApplication.id,
                                                status: "pending",
                                                oldStatus: selectedApplication.status,
                                                email: selectedApplication.email,
                                                name: selectedApplication.full_name,
                                              });
                                              setSelectedApplication({
                                                ...selectedApplication,
                                                status: "pending",
                                              });
                                            }}
                                            disabled={updateStatusMutation.isPending}
                                            className="flex-1"
                                          >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Restore as Pending
                                          </Button>
                                        ) : (
                                          <>
                                            <Button
                                              onClick={() => {
                                                updateStatusMutation.mutate({
                                                  id: selectedApplication.id,
                                                  status: "approved",
                                                  oldStatus: selectedApplication.status,
                                                  email: selectedApplication.email,
                                                  name: selectedApplication.full_name,
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
                                                  oldStatus: selectedApplication.status,
                                                  email: selectedApplication.email,
                                                  name: selectedApplication.full_name,
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
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                updateStatusMutation.mutate({
                                                  id: selectedApplication.id,
                                                  status: "removed",
                                                  oldStatus: selectedApplication.status,
                                                  email: selectedApplication.email,
                                                  name: selectedApplication.full_name,
                                                });
                                                setSelectedApplication({
                                                  ...selectedApplication,
                                                  status: "removed",
                                                });
                                              }}
                                              disabled={updateStatusMutation.isPending}
                                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {app.status === "removed" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: app.id,
                                      status: "pending",
                                      oldStatus: app.status,
                                      email: app.email,
                                      name: app.full_name,
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  title="Restore as pending"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              ) : (
                                <>
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
                                            oldStatus: app.status,
                                            email: app.email,
                                            name: app.full_name,
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
                                            oldStatus: app.status,
                                            email: app.email,
                                            name: app.full_name,
                                          })
                                        }
                                        disabled={updateStatusMutation.isPending}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: app.id,
                                        status: "removed",
                                        oldStatus: app.status,
                                        email: app.email,
                                        name: app.full_name,
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    title="Remove (soft delete)"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
                </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminApplications;
