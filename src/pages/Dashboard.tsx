import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useCurrentWeekEntry, useUpdateWeeklyEntry, useMiniMoves, useAddMiniMove, useToggleMiniMove, useDeleteMiniMove } from '@/hooks/useWeeklyEntry';
import { Loader2, Target, Calendar, Sparkles, AlertCircle, Trophy, Heart, Plus, Check, X, Edit3, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import AvatarUpload from '@/components/AvatarUpload';
import { supabase } from '@/integrations/supabase/client';
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
} from '@/components/ui/alert-dialog';
export default function Dashboard() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    data: profile,
    isLoading: profileLoading
  } = useProfile();
  const updateProfile = useUpdateProfile();
  const {
    data: weeklyEntry,
    isLoading: weeklyLoading
  } = useCurrentWeekEntry();
  const updateWeeklyEntry = useUpdateWeeklyEntry();
  const {
    data: miniMoves = []
  } = useMiniMoves(weeklyEntry?.id);
  const addMiniMove = useAddMiniMove();
  const toggleMiniMove = useToggleMiniMove();
  const deleteMiniMove = useDeleteMiniMove();

  // Local state for editing
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    growth_goal: '',
    monthly_milestones: '',
    obstacles: '',
    wins: '',
    self_care: ''
  });
  const [newMoveTitle, setNewMoveTitle] = useState('');

  // Sync form data with loaded data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        growth_goal: profile.growth_goal || '',
        monthly_milestones: profile.monthly_milestones || ''
      }));
    }
  }, [profile]);
  useEffect(() => {
    if (weeklyEntry) {
      setFormData(prev => ({
        ...prev,
        obstacles: weeklyEntry.obstacles || '',
        wins: weeklyEntry.wins || '',
        self_care: weeklyEntry.self_care || ''
      }));
    }
  }, [weeklyEntry]);
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const isLoading = profileLoading || weeklyLoading;
  const saveProfileField = async (field: 'name' | 'growth_goal' | 'monthly_milestones') => {
    try {
      await updateProfile.mutateAsync({
        [field]: formData[field]
      });
      setEditingSection(null);
      toast({
        title: "Saved!",
        description: "Your changes have been saved."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const saveWeeklyField = async (field: 'obstacles' | 'wins' | 'self_care') => {
    if (!weeklyEntry) return;
    try {
      await updateWeeklyEntry.mutateAsync({
        id: weeklyEntry.id,
        updates: {
          [field]: formData[field]
        }
      });
      setEditingSection(null);
      toast({
        title: "Saved!",
        description: "Your changes have been saved."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleAddMiniMove = async () => {
    if (!weeklyEntry || !newMoveTitle.trim()) return;
    try {
      await addMiniMove.mutateAsync({
        weeklyEntryId: weeklyEntry.id,
        title: newMoveTitle.trim()
      });
      setNewMoveTitle('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleToggleMove = async (id: string, completed: boolean) => {
    if (!weeklyEntry) return;
    try {
      await toggleMiniMove.mutateAsync({
        id,
        completed: !completed,
        weeklyEntryId: weeklyEntry.id
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleDeleteMove = async (id: string) => {
    if (!weeklyEntry) return;
    try {
      await deleteMiniMove.mutateAsync({
        id,
        weeklyEntryId: weeklyEntry.id
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const completedMoves = miniMoves.filter(m => m.completed).length;
  const progress = miniMoves.length > 0 ? completedMoves / miniMoves.length * 100 : 0;
  const weekStart = startOfWeek(new Date(), {
    weekStartsOn: 1
  });
  const weekEnd = endOfWeek(new Date(), {
    weekStartsOn: 1
  });
  return <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="heading-display text-foreground mb-2">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}
          </h1>
          <p className="text-body text-muted-foreground">
            Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>

        {isLoading ? <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : <div className="space-y-8">
            {/* Profile Section */}
            <section className="card-elevated p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Edit3 className="h-4 w-4 text-primary" />
                </div>
                <h2 className="heading-section text-base">Your Profile</h2>
              </div>

              <div className="flex items-center gap-4">
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url || null}
                  name={profile?.name || ''}
                  onUploadComplete={async (url) => {
                    await updateProfile.mutateAsync({ avatar_url: url });
                  }}
                  size="md"
                />
                <div className="flex-1">
                  <EditableField 
                    label="Display Name" 
                    value={formData.name} 
                    isEditing={editingSection === 'name'} 
                    onEdit={() => setEditingSection('name')} 
                    onSave={() => saveProfileField('name')} 
                    onCancel={() => setEditingSection(null)} 
                    onChange={v => setFormData(p => ({
                      ...p,
                      name: v
                    }))} 
                    placeholder="Enter your name"
                    compact
                  />
                </div>
              </div>
            </section>

            {/* Growth Goal & Monthly Milestones - Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Growth Goal */}
              <section className="card-elevated p-6 animate-slide-up stagger-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="heading-section">Growth Goal</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Your overarching vision for what will bring you the most growth (the big win)</p>

                <EditableField value={formData.growth_goal} isEditing={editingSection === 'growth_goal'} onEdit={() => setEditingSection('growth_goal')} onSave={() => saveProfileField('growth_goal')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
              ...p,
              growth_goal: v
            }))} placeholder="What's the big picture? E.g., 'Launch my online course and reach 100 students by Q4'" multiline />
              </section>

              {/* Monthly Milestones */}
              <section className="card-elevated p-6 animate-slide-up stagger-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="heading-section">Monthly Milestones</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">What do you aim to accomplish this month</p>

                <EditableField value={formData.monthly_milestones} isEditing={editingSection === 'monthly_milestones'} onEdit={() => setEditingSection('monthly_milestones')} onSave={() => saveProfileField('monthly_milestones')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
              ...p,
              monthly_milestones: v
            }))} placeholder="What specific milestones will move you toward your goal this month?" multiline />
              </section>
            </div>

            {/* Weekly Mini-Moves */}
            <section className="card-elevated p-6 animate-slide-up stagger-3">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-sage-light">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h2 className="heading-section">Weekly Mini-Moves</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Small, achievable actions for this week
              </p>

              {/* Progress bar */}
              {miniMoves.length > 0 && <div className="mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{completedMoves} of {miniMoves.length} completed</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="progress-indicator">
                    <div className="progress-fill" style={{
                width: `${progress}%`
              }} />
                  </div>
                </div>}

              {/* Mini moves list */}
              <div className="space-y-3 mb-4">
                {miniMoves.map(move => <div key={move.id} className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                      ${move.completed ? 'bg-sage-light/30 border-primary/20' : 'bg-background border-border hover:border-primary/30'}
                    `}>
                    <button onClick={() => handleToggleMove(move.id, move.completed)} className={`
                        flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                        transition-all duration-200
                        ${move.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'}
                      `}>
                      {move.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>
                    <span className={`flex-1 ${move.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {move.title}
                    </span>
                    <button onClick={() => handleDeleteMove(move.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>)}
              </div>

              {/* Add new mini move */}
              <div className="flex gap-2">
                <input type="text" value={newMoveTitle} onChange={e => setNewMoveTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMiniMove()} placeholder="Add a new mini-move..." className="input-field flex-1" />
                <button onClick={handleAddMiniMove} disabled={!newMoveTitle.trim() || addMiniMove.isPending} className="btn-primary flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </section>

            {/* Obstacles & Wins - Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Obstacles */}
              <section className="card-elevated p-6 animate-slide-up stagger-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <h2 className="heading-section">Obstacles</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">What might get in your way this week? Or reflect on what stopped you take action</p>

                <EditableField value={formData.obstacles} isEditing={editingSection === 'obstacles'} onEdit={() => setEditingSection('obstacles')} onSave={() => saveWeeklyField('obstacles')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
              ...p,
              obstacles: v
            }))} placeholder="What challenges are you facing? Being honest helps the group support you." multiline />
              </section>

              {/* Wins */}
              <section className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-terracotta-light">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="heading-section">Wins</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Celebrate your progress, no matter how small! (It does not have to be a Mini-Move)</p>

                <EditableField value={formData.wins} isEditing={editingSection === 'wins'} onEdit={() => setEditingSection('wins')} onSave={() => saveWeeklyField('wins')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
              ...p,
              wins: v
            }))} placeholder="What went well this week? What are you proud of?" multiline />
              </section>
            </div>

            {/* Self-Care */}
            <section className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-secondary">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
                <h2 className="heading-section">Self-Care Notes</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                How are you taking care of yourself?
              </p>

              <EditableField value={formData.self_care} isEditing={editingSection === 'self_care'} onEdit={() => setEditingSection('self_care')} onSave={() => saveWeeklyField('self_care')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
            ...p,
            self_care: v
          }))} placeholder="Rest, boundaries, joy—what's supporting your wellbeing?" multiline />
            </section>

            {/* Delete Account */}
            <section className="card-elevated p-6 border-destructive/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="heading-section text-destructive">Delete Account</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <DeleteAccountDialog onDelete={async () => {
                try {
                  // Delete user's data from database tables
                  const userId = user?.id;
                  if (userId) {
                    // Delete mini_moves first (depends on weekly_entries)
                    await supabase.from('mini_moves').delete().eq('user_id', userId);
                    // Delete weekly_entries
                    await supabase.from('weekly_entries').delete().eq('user_id', userId);
                    // Delete group_members
                    await supabase.from('group_members').delete().eq('user_id', userId);
                    // Delete profile
                    await supabase.from('profiles').delete().eq('user_id', userId);
                  }
                  // Sign out
                  await supabase.auth.signOut();
                  toast({
                    title: "Account deleted",
                    description: "Your account and data have been removed."
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                  });
                }
              }} />
            </section>
          </div>}
      </div>
    </AppLayout>;
}

// Editable Field Component
interface EditableFieldProps {
  label?: string;
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  compact?: boolean;
}
function EditableField({
  label,
  value,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onChange,
  placeholder,
  multiline,
  compact
}: EditableFieldProps) {
  if (isEditing) {
    return <div className={compact ? "space-y-2" : "space-y-3"}>
        {label && <label className="label-text text-sm">{label}</label>}
        {multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`input-field resize-y ${compact ? 'min-h-[60px] text-sm' : 'min-h-[100px]'}`} autoFocus /> : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`input-field ${compact ? 'text-sm py-2' : ''}`} autoFocus />}
        <div className="flex gap-2">
          <button onClick={onSave} className={`btn-primary flex items-center gap-2 ${compact ? 'text-sm py-1.5 px-3' : ''}`}>
            <Save className="h-4 w-4" />
            Save
          </button>
          <button onClick={onCancel} className={`btn-secondary ${compact ? 'text-sm py-1.5 px-3' : ''}`}>
            Cancel
          </button>
        </div>
      </div>;
  }
  return <div className="group">
      {label && <label className="label-text text-sm">{label}</label>}
      <div onClick={onEdit} className={`rounded-lg border border-transparent bg-muted/30 hover:bg-muted/50 hover:border-border cursor-pointer transition-all duration-200 ${compact ? 'p-2.5 min-h-[40px]' : 'p-4 min-h-[60px]'}`}>
        {value ? <p className={`whitespace-pre-wrap ${compact ? 'text-sm' : 'text-body'}`}>{value}</p> : <p className={`text-muted-foreground italic ${compact ? 'text-sm' : ''}`}>{placeholder || 'Click to edit...'}</p>}
      </div>
    </div>;
}

// Delete Account Dialog Component
interface DeleteAccountDialogProps {
  onDelete: () => Promise<void>;
}

function DeleteAccountDialog({ onDelete }: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="btn-secondary border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Delete My Account
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Delete Account?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is <strong>permanent and cannot be undone</strong>. All your data including your profile, weekly entries, mini-moves, and group memberships will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Yes, Delete My Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}