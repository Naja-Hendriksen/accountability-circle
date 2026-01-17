import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Send, Trash2, StickyNote } from "lucide-react";

interface ApplicationNote {
  id: string;
  application_id: string;
  admin_user_id: string;
  content: string;
  created_at: string;
}

interface ApplicationNotesProps {
  applicationId: string;
}

export const ApplicationNotes = ({ applicationId }: ApplicationNotesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  // Fetch notes for this application
  const { data: notes, isLoading } = useQuery({
    queryKey: ["application-notes", applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_notes")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApplicationNote[];
    },
  });

  // Add new note
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("application_notes").insert({
        application_id: applicationId,
        admin_user_id: user?.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-notes", applicationId] });
      setNewNote("");
      toast({ title: "Note added" });
    },
    onError: (error) => {
      console.error("Error adding note:", error);
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  // Delete note
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("application_notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-notes", applicationId] });
      toast({ title: "Note deleted" });
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">Internal Notes</h4>
      </div>

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Add an internal note about this application..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newNote.trim() || addNoteMutation.isPending}
        >
          {addNoteMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-1" />
          )}
          Add Note
        </Button>
      </form>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : notes?.length ? (
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-muted/50 rounded-lg p-3 text-sm group relative"
            >
              <p className="whitespace-pre-wrap pr-8">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
              {note.admin_user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => deleteNoteMutation.mutate(note.id)}
                  disabled={deleteNoteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">
          No notes yet. Add one above.
        </p>
      )}
    </div>
  );
};
