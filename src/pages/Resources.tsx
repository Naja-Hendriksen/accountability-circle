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
import { FileDown, Upload, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

export default function Resources() {
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
            Resources
          </h1>
          <p className="text-muted-foreground mt-1">
            Helpful guides and templates to support your journey
          </p>
        </div>

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
              Access guides, templates, and other materials shared by your facilitator
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