import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video, LayoutDashboard, Users, FileDown, Upload, Trash2, FileText, Clock, Calendar, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

export default function Information() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !uploadForm.title) {
        throw new Error("Please provide a title and select a file");
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${Date.now()}-${selectedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Insert metadata
      const { error: insertError } = await supabase
        .from("resources")
        .insert({
          title: uploadForm.title,
          description: uploadForm.description,
          file_path: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          uploaded_by: user?.id,
        });

      if (insertError) {
        // Clean up uploaded file if metadata insert fails
        await supabase.storage.from("resources").remove([filePath]);
        throw insertError;
      }
    },
    onSuccess: () => {
      toast.success("Resource uploaded successfully");
      setUploadForm({ title: "", description: "" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload resource");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (resource: { id: string; file_path: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("resources")
        .remove([resource.file_path]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: dbError } = await supabase
        .from("resources")
        .delete()
        .eq("id", resource.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Resource deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: () => {
      toast.error("Failed to delete resource");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = supabase.storage
      .from("resources")
      .getPublicUrl(filePath);

    const link = document.createElement("a");
    link.href = data.publicUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Information
          </h1>
          <p className="text-muted-foreground mt-1">
            Everything you need to know about the Accountability Circle
          </p>
        </div>

        {/* Zoom Call Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Accountability Call */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Weekly Accountability Call</CardTitle>
                  <CardDescription>Join us every week to check in and stay on track</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Every Monday</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>10:00 AM (UK Time)</span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="font-medium">Meeting ID:</span> 891 9614 3956</p>
                <p><span className="font-medium">Passcode:</span> 478939</p>
              </div>
              
              <Button 
                asChild 
                size="lg" 
                className="w-full"
              >
                <a 
                  href="https://us06web.zoom.us/j/89196143956?pwd=bsuVc9l15ExlF0lESkK7y1H6vXarts.1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Zoom Call
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Before You Join */}
          <Card className="border-primary/20 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Before You Join</CardTitle>
                  <CardDescription>Prepare to make the most of our time together</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">1.</span>
                  <span>Review and update your mini-moves from last week — mark what you completed and reflect on any blockers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">2.</span>
                  <span>Set your new mini-moves for this week — 3-5 focused actions that move you towards your monthly milestone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">3.</span>
                  <span>Note any wins to celebrate and obstacles where you'd like group support.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How My Dashboard Works */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <LayoutDashboard className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle>How "My Dashboard" Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Your personal dashboard is your command center for tracking progress towards your goals. Here's what you can do:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <span className="font-medium text-foreground">Growth Goal</span> — Set your 3-6 month overarching goal. This is the big picture vision you're working towards.
              </li>
              <li>
                <span className="font-medium text-foreground">Monthly Milestones</span> — Break down your growth goal into monthly focus areas to stay on track.
              </li>
              <li>
                <span className="font-medium text-foreground">Weekly Mini-Moves</span> — Add 3-5 small, actionable tasks each week that move you closer to your monthly milestone. You can mark them as complete and edit both this week's and last week's tasks.
              </li>
              <li>
                <span className="font-medium text-foreground">Wins & Reflections</span> — Celebrate your wins, big or small! Record what went well each week.
              </li>
              <li>
                <span className="font-medium text-foreground">Obstacles</span> — Note any challenges you faced. Sharing these helps you get support from the group.
              </li>
              <li>
                <span className="font-medium text-foreground">Self-Care</span> — Remember, self-care is strategic! Record how you're taking care of yourself.
              </li>
              <li>
                <span className="font-medium text-foreground">Historical Mini-Moves</span> — View all your past weeks' mini-moves in a read-only format to track your journey.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* How Group View Works */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle>How "Group View" Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              The Group View is your window into your accountability partners' progress. It's designed to foster connection and mutual support:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <span className="font-medium text-foreground">Member Progress</span> — See each member's growth goal, monthly focus, and their current and previous week's mini-moves and completion rates.
              </li>
              <li>
                <span className="font-medium text-foreground">Wins & Obstacles</span> — Read about what's going well for others and what challenges they're facing. Use this to offer encouragement and support.
              </li>
              <li>
                <span className="font-medium text-foreground">Search & Filter</span> — Quickly find a specific member using the search bar to review their updates before calls.
              </li>
              <li>
                <span className="font-medium text-foreground">Ask The Group</span> — Post questions to get feedback, advice, or support from your accountability circle. You can also reply to others' questions and react with likes.
              </li>
            </ul>
            <p className="mt-4 text-sm bg-muted/50 p-3 rounded-lg">
              <span className="font-medium text-foreground">Tip:</span> Before each Monday call, review the Group View to see everyone's progress. This helps you come prepared to offer meaningful support and celebration.
            </p>
          </CardContent>
        </Card>

        {/* Downloadable Resources */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileDown className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle>Downloadable Resources</CardTitle>
            </div>
            <CardDescription>
              Helpful guides and templates to support your journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resourcesLoading ? (
              <p className="text-muted-foreground text-sm">Loading resources...</p>
            ) : resources && resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div 
                    key={resource.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary/70" />
                      <div>
                        <p className="font-medium text-foreground">{resource.title}</p>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {resource.file_name} • {formatFileSize(resource.file_size || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(resource.file_path, resource.file_name)}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate({ id: resource.id, file_path: resource.file_path })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No resources available yet.</p>
            )}

            {/* Admin Upload Section */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload New Resource (Admin Only)
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="e.g., Weekly Planning Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Brief description of this resource"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">PDF File *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadForm.title || !selectedFile || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload Resource"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
