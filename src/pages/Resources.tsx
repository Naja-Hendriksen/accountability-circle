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
import { FileDown, Upload, Trash2, FileText, Info, ExternalLink, Plus, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  uploaded_by: string;
  resource_type: string;
  external_link: string | null;
  created_at: string;
  updated_at: string;
};

export default function Resources() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadTab, setUploadTab] = useState("file");
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    external_link: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Resource[];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadForm.title.trim()) {
        throw new Error("Please provide a title");
      }

      if (uploadTab === "file") {
        if (!selectedFile) throw new Error("Please select a file");

        const filePath = `${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resources")
          .upload(filePath, selectedFile);
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from("resources")
          .insert({
            title: uploadForm.title.trim(),
            description: uploadForm.description.trim() || null,
            file_path: filePath,
            file_name: selectedFile.name,
            file_size: selectedFile.size,
            uploaded_by: user?.id,
            resource_type: "file",
          });

        if (insertError) {
          await supabase.storage.from("resources").remove([filePath]);
          throw insertError;
        }
      } else {
        if (!uploadForm.description.trim()) {
          throw new Error("Please provide a description for the information point");
        }

        const { error: insertError } = await supabase
          .from("resources")
          .insert({
            title: uploadForm.title.trim(),
            description: uploadForm.description.trim(),
            external_link: uploadForm.external_link.trim() || null,
            uploaded_by: user?.id,
            resource_type: "info",
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success(uploadTab === "file" ? "Resource uploaded successfully" : "Information point added successfully");
      setUploadForm({ title: "", description: "", external_link: "" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add resource");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      if (resource.file_path) {
        const { error: storageError } = await supabase.storage
          .from("resources")
          .remove([resource.file_path]);
        if (storageError) throw storageError;
      }

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

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, description, external_link }: { id: string; title: string; description: string | null; external_link: string | null }) => {
      const { error } = await supabase
        .from("resources")
        .update({ title, description, external_link })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource updated successfully");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: () => {
      toast.error("Failed to update resource");
    },
  });

  const handleUpdate = (id: string, title: string, description: string | null, external_link: string | null) => {
    updateMutation.mutate({ id, title, description, external_link });
  };

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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileDown className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle>Resources</CardTitle>
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
                  <ResourceItem
                    key={resource.id}
                    resource={resource}
                    isAdmin={!!isAdmin}
                    onDownload={handleDownload}
                    onDelete={(r) => deleteMutation.mutate(r)}
                    onUpdate={handleUpdate}
                    isDeleting={deleteMutation.isPending}
                    formatFileSize={formatFileSize}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No resources available yet.</p>
            )}

            {isAdmin && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Resource (Admin Only)
                </h4>

                <Tabs value={uploadTab} onValueChange={setUploadTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="file" className="flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      PDF File
                    </TabsTrigger>
                    <TabsTrigger value="info" className="flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Info Point
                    </TabsTrigger>
                  </TabsList>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                        placeholder={uploadTab === "file" ? "e.g., Weekly Planning Template" : "e.g., Useful tool for focus"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description {uploadTab === "info" ? "*" : ""}
                      </Label>
                      <Textarea
                        id="description"
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                        placeholder={uploadTab === "file" ? "Brief description of this resource" : "Describe this information point..."}
                        rows={uploadTab === "info" ? 4 : 2}
                      />
                    </div>

                    <TabsContent value="file" className="mt-0 p-0">
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
                    </TabsContent>

                    <TabsContent value="info" className="mt-0 p-0">
                      <div className="space-y-2">
                        <Label htmlFor="external_link">External Link (optional)</Label>
                        <Input
                          id="external_link"
                          type="url"
                          value={uploadForm.external_link}
                          onChange={(e) => setUploadForm({ ...uploadForm, external_link: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </TabsContent>

                    <Button
                      onClick={handleUpload}
                      disabled={
                        !uploadForm.title.trim() ||
                        (uploadTab === "file" && !selectedFile) ||
                        (uploadTab === "info" && !uploadForm.description.trim()) ||
                        isUploading
                      }
                    >
                      {isUploading
                        ? "Saving..."
                        : uploadTab === "file"
                        ? "Upload Resource"
                        : "Add Info Point"}
                    </Button>
                  </div>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function ResourceItem({
  resource,
  isAdmin,
  onDownload,
  onDelete,
  onUpdate,
  isDeleting,
  formatFileSize,
}: {
  resource: Resource;
  isAdmin: boolean;
  onDownload: (filePath: string, fileName: string) => void;
  onDelete: (resource: Resource) => void;
  onUpdate: (id: string, title: string, description: string | null, external_link: string | null) => void;
  isDeleting: boolean;
  formatFileSize: (bytes: number) => string;
}) {
  const isInfo = resource.resource_type === "info";
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: resource.title,
    description: resource.description || "",
    external_link: resource.external_link || "",
  });

  const handleSave = () => {
    if (!editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    onUpdate(
      resource.id,
      editForm.title.trim(),
      editForm.description.trim() || null,
      editForm.external_link.trim() || null
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      title: resource.title,
      description: resource.description || "",
      external_link: resource.external_link || "",
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-lg border bg-card space-y-3">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
          />
        </div>
        {isInfo && (
          <div className="space-y-2">
            <Label>External Link</Label>
            <Input
              type="url"
              value={editForm.external_link}
              onChange={(e) => setEditForm({ ...editForm, external_link: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {isInfo ? (
          <Info className="h-8 w-8 text-accent-foreground/70 flex-shrink-0 mt-0.5" />
        ) : (
          <FileText className="h-8 w-8 text-primary/70 flex-shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="font-medium text-foreground">{resource.title}</p>
          {resource.description && (
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{resource.description}</p>
          )}
          {!isInfo && resource.file_name && (
            <p className="text-xs text-muted-foreground mt-1">
              {resource.file_name} • {formatFileSize(resource.file_size || 0)}
            </p>
          )}
          {isInfo && resource.external_link && (
            <a
              href={resource.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1.5"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(resource.external_link).hostname}&sz=32`}
                alt=""
                className="h-4 w-4 rounded-sm"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <ExternalLink className="h-3.5 w-3.5" />
              Visit link
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {!isInfo && resource.file_path && resource.file_name && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(resource.file_path!, resource.file_name!)}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Download
          </Button>
        )}
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(resource)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
