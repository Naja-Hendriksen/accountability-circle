import { useState } from "react";
import DOMPurify from "dompurify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, Eye, Mail, Send, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EmailHistory from "@/components/EmailHistory";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_content: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const templateLabels: Record<string, { label: string; color: string }> = {
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

const EmailTemplates = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [previewName, setPreviewName] = useState("Jane");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "history">("templates");

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

  // Fetch email templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_key");
      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: isAdmin === true,
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, subject, html_content }: { id: string; subject: string; html_content: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({ subject, html_content })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setEditingTemplate(null);
      toast({ title: "Email template updated successfully" });
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditContent(template.html_content);
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    updateTemplateMutation.mutate({
      id: editingTemplate.id,
      subject: editSubject,
      html_content: editContent,
    });
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: {
          subject: editSubject,
          html_content: editContent,
          test_name: previewName,
        },
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
        description: `Check your inbox at ${data.email}`,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const replaceVariables = (content: string, name: string) => {
    return content.replace(/\{\{name\}\}/g, name);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/admin/applications"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-display font-semibold text-foreground">
                Email Templates
              </h1>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "templates" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("templates")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Templates
                </Button>
                <Button
                  variant={activeTab === "history" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("history")}
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              {activeTab === "templates" 
                ? <>Customize the notification emails sent to applicants when their status changes. Use <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"{{name}}"}</code> to include the applicant's first name.</>
                : "View a history of all notification emails sent to applicants."}
            </p>
          </div>

          {activeTab === "history" ? (
            <Card>
              <CardHeader>
                <CardTitle>Email History</CardTitle>
                <CardDescription>
                  Recent notification emails sent to applicants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailHistory limit={100} />
              </CardContent>
            </Card>
          ) : templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : editingTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>Edit Template</CardTitle>
                    <Badge className={templateLabels[editingTemplate.template_key]?.color}>
                      {templateLabels[editingTemplate.template_key]?.label || editingTemplate.template_key}
                    </Badge>
                  </div>
                  <Button variant="ghost" onClick={() => setEditingTemplate(null)}>
                    Cancel
                  </Button>
                </div>
                {editingTemplate.description && (
                  <CardDescription>{editingTemplate.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="edit" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder="Email subject..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="content">HTML Content</Label>
                      <Textarea
                        id="content"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Email HTML content..."
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setEditingTemplate(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateTemplateMutation.isPending}
                      >
                        {updateTemplateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Label htmlFor="previewName">Preview with name:</Label>
                        <Input
                          id="previewName"
                          value={previewName}
                          onChange={(e) => setPreviewName(e.target.value)}
                          className="w-40"
                          placeholder="Name..."
                        />
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest}
                      >
                        {isSendingTest ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Test Email
                      </Button>
                    </div>
                    
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          Subject: <span className="font-medium text-foreground">{replaceVariables(editSubject, previewName)}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="bg-background rounded-lg p-4 border"
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(replaceVariables(editContent, previewName)) 
                          }}
                        />
                      </CardContent>
                    </Card>

                    <p className="text-sm text-muted-foreground">
                      Click "Send Test Email" to receive a preview at your admin email address ({user?.email}).
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates?.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={templateLabels[template.template_key]?.color}>
                          {templateLabels[template.template_key]?.label || template.template_key}
                        </Badge>
                        <span className="font-medium">{template.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                {template.subject}
                              </DialogTitle>
                            </DialogHeader>
                            <div 
                              className="mt-4 p-4 bg-muted/30 rounded-lg border"
                              dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(replaceVariables(template.html_content, "Jane")) 
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                    {template.description && (
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
