import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useCurrentWeekEntry, useUpdateWeeklyEntry, useMiniMoves, useAddMiniMove, useToggleMiniMove, useDeleteMiniMove, useUpdateMiniMove, useReorderMiniMoves, useAllWeeklyEntries, usePreviousWeekEntry, useNextWeekEntry, isWeekEditable, WeeklyEntry, MiniMove } from '@/hooks/useWeeklyEntry';
import { Loader2, Target, Calendar, Sparkles, AlertCircle, Trophy, Heart, Plus, Check, X, Edit3, Save, Trash2, Settings, ChevronDown, ChevronRight, Mail, Bell, BellOff, History, Eye, User, Briefcase, Globe, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import AvatarUpload from '@/components/AvatarUpload';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CelebrationPopup from '@/components/CelebrationPopup';
import { StarBurst } from '@/components/StarBurst';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
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
  const {
    data: previousWeekEntry
  } = usePreviousWeekEntry();
  const {
    data: nextWeekEntry
  } = useNextWeekEntry();
  const {
    data: allHistoricalEntries = []
  } = useAllWeeklyEntries();
  const updateWeeklyEntry = useUpdateWeeklyEntry();
  const {
    data: miniMoves = []
  } = useMiniMoves(weeklyEntry?.id);
  const {
    data: previousWeekMiniMoves = []
  } = useMiniMoves(previousWeekEntry?.id);
  const {
    data: nextWeekMiniMoves = []
  } = useMiniMoves(nextWeekEntry?.id);
  const addMiniMove = useAddMiniMove();
  const toggleMiniMove = useToggleMiniMove();
  const deleteMiniMove = useDeleteMiniMove();
  const updateMiniMove = useUpdateMiniMove();
  const reorderMiniMoves = useReorderMiniMoves();

  // Local state for editing
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    growth_goal: '',
    monthly_milestones: '',
    business_name: '',
    business_website: '',
    obstacles: '',
    wins: '',
    self_care: ''
  });
  const [nextWeekFormData, setNextWeekFormData] = useState({
    obstacles: '',
    wins: '',
    self_care: ''
  });
  const [newMoveTitle, setNewMoveTitle] = useState('');
  const [newNextWeekMoveTitle, setNewNextWeekMoveTitle] = useState('');
  const [editingMoveId, setEditingMoveId] = useState<string | null>(null);
  const [editingMoveTitle, setEditingMoveTitle] = useState('');
  const [expandedMoveId, setExpandedMoveId] = useState<string | null>(null);
  const [moveNotes, setMoveNotes] = useState<Record<string, string>>({});
  const [starBurst, setStarBurst] = useState<{ x: number; y: number } | null>(null);

  // Sync form data with loaded data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        growth_goal: profile.growth_goal || '',
        monthly_milestones: profile.monthly_milestones || '',
        business_name: profile.business_name || '',
        business_website: profile.business_website || '',
        obstacles: profile.obstacles || ''
      }));
    }
  }, [profile]);
  useEffect(() => {
    if (weeklyEntry) {
      setFormData(prev => ({
        ...prev,
        wins: weeklyEntry.wins || '',
        self_care: weeklyEntry.self_care || ''
      }));
    }
  }, [weeklyEntry]);
  useEffect(() => {
    if (nextWeekEntry) {
      setNextWeekFormData({
        obstacles: nextWeekEntry.obstacles || '',
        wins: nextWeekEntry.wins || '',
        self_care: nextWeekEntry.self_care || ''
      });
    }
  }, [nextWeekEntry]);
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const isLoading = profileLoading || weeklyLoading;
  const saveProfileField = async (field: 'name' | 'growth_goal' | 'monthly_milestones' | 'business_name' | 'business_website' | 'obstacles') => {
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
  const saveNextWeekField = async (field: 'obstacles' | 'wins' | 'self_care') => {
    if (!nextWeekEntry) return;
    try {
      await updateWeeklyEntry.mutateAsync({
        id: nextWeekEntry.id,
        updates: {
          [field]: nextWeekFormData[field]
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
  const handleToggleMove = async (id: string, completed: boolean, entryId?: string, event?: React.MouseEvent) => {
    const targetEntryId = entryId || weeklyEntry?.id;
    if (!targetEntryId) return;
    // Show starburst when marking as complete (not when unchecking)
    if (!completed && event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setStarBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    try {
      await toggleMiniMove.mutateAsync({
        id,
        completed: !completed,
        weeklyEntryId: targetEntryId
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleDragEnd = (result: DropResult, moves: MiniMove[], entryId?: string) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const targetEntryId = entryId || weeklyEntry?.id;
    if (!targetEntryId) return;

    const reordered = Array.from(moves);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updates = reordered.map((m, i) => ({ id: m.id, sort_order: i }));
    reorderMiniMoves.mutate({ reorderedMoves: updates, weeklyEntryId: targetEntryId });
  };
  const handleDeleteMove = async (id: string, entryId?: string) => {
    const targetEntryId = entryId || weeklyEntry?.id;
    if (!targetEntryId) return;
    try {
      await deleteMiniMove.mutateAsync({
        id,
        weeklyEntryId: targetEntryId
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleStartEditMove = (move: MiniMove) => {
    setEditingMoveId(move.id);
    setEditingMoveTitle(move.title);
  };
  const handleSaveEditMove = async (move: MiniMove, entryId?: string) => {
    const targetEntryId = entryId || weeklyEntry?.id;
    if (!targetEntryId || !editingMoveTitle.trim()) return;
    try {
      await updateMiniMove.mutateAsync({
        id: move.id,
        updates: { title: editingMoveTitle.trim() },
        weeklyEntryId: targetEntryId,
      });
      setEditingMoveId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  const handleToggleNotes = (move: MiniMove) => {
    if (expandedMoveId === move.id) {
      setExpandedMoveId(null);
    } else {
      setExpandedMoveId(move.id);
      if (!(move.id in moveNotes)) {
        setMoveNotes(prev => ({ ...prev, [move.id]: move.notes || '' }));
      }
    }
  };
  const handleSaveNotes = async (move: MiniMove, entryId?: string) => {
    const targetEntryId = entryId || weeklyEntry?.id;
    if (!targetEntryId) return;
    try {
      await updateMiniMove.mutateAsync({
        id: move.id,
        updates: { notes: moveNotes[move.id] || '' },
        weeklyEntryId: targetEntryId,
      });
      toast({ title: "Saved!", description: "Notes saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  // Contextual hint based on day of week
  const today = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const getPlanAheadHint = () => {
    if (today === 0) return "Sunday: Fill this in now — it becomes your plan for tomorrow's meeting";
    if (today === 6) return "Getting a head start? This becomes next week's plan on Monday";
    if (today === 5) return "Planning ahead for next week? Great habit!";
    return null;
  };
  const planAheadHint = getPlanAheadHint();
  return <AppLayout>
      {starBurst && <StarBurst x={starBurst.x} y={starBurst.y} onComplete={() => setStarBurst(null)} />}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in flex items-start justify-between gap-4">
          <div>
            <h1 className="heading-display text-foreground mb-2">
              Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-body text-muted-foreground">
              Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <CelebrationPopup />
        </div>

        {isLoading ? <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : <div className="space-y-8">
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
                {profile?.updated_at && formData.growth_goal && (
                  <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(profile.updated_at), 'MMM d, yyyy')}</p>
                )}
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
                {profile?.updated_at && formData.monthly_milestones && (
                  <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(profile.updated_at), 'MMM d, yyyy')}</p>
                )}
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
                How are you getting on with the small, achievable actions you are working on this week?
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
              <DragDropContext onDragEnd={(result) => handleDragEnd(result, miniMoves)}>
                <Droppable droppableId="current-week-moves">
                  {(provided) => (
                    <div className="space-y-3 mb-4" ref={provided.innerRef} {...provided.droppableProps}>
                      {miniMoves.map((move, index) => (
                        <Draggable key={move.id} draggableId={move.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`rounded-lg border transition-all duration-200 overflow-hidden ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
                              style={{ ...provided.draggableProps.style, borderColor: move.completed ? 'hsl(var(--primary) / 0.2)' : undefined }}
                            >
                              <div className={`flex items-center gap-2 p-3 ${move.completed ? 'bg-sage-light/30' : 'bg-background'}`}>
                                <div {...provided.dragHandleProps} className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <button onClick={(e) => handleToggleMove(move.id, move.completed, undefined, e)} className={`
                                    flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    transition-all duration-200
                                    ${move.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'}
                                  `}>
                                  {move.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                                </button>
                                {editingMoveId === move.id ? (
                                  <div className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      value={editingMoveTitle}
                                      onChange={e => setEditingMoveTitle(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEditMove(move); if (e.key === 'Escape') setEditingMoveId(null); }}
                                      className="input-field flex-1 h-8 text-sm"
                                      autoFocus
                                    />
                                    <button onClick={() => handleSaveEditMove(move)} className="p-1 rounded text-primary hover:bg-primary/10 transition-colors">
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setEditingMoveId(null)} className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span
                                      className={`flex-1 cursor-pointer ${move.completed ? 'line-through text-muted-foreground' : ''}`}
                                      onDoubleClick={() => handleStartEditMove(move)}
                                    >
                                      {move.title}
                                      {move.carried_forward && (
                                        <span className="ml-2 inline-flex items-center text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded-full leading-none">↩ carried over</span>
                                      )}
                                    </span>
                                    <button onClick={() => handleToggleNotes(move)} className={`p-1 rounded transition-colors ${expandedMoveId === move.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'} ${move.notes ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`} title="Notes">
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleStartEditMove(move)} className="p-1 rounded text-muted-foreground opacity-50 hover:opacity-100 hover:text-foreground hover:bg-muted transition-colors" title="Edit title">
                                      <Settings className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteMove(move.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                              {expandedMoveId === move.id && (
                                <div className="px-3 pb-3 pt-1 border-t border-border/50 bg-muted/20">
                                  <textarea
                                    value={moveNotes[move.id] ?? move.notes ?? ''}
                                    onChange={e => setMoveNotes(prev => ({ ...prev, [move.id]: e.target.value }))}
                                    onBlur={() => handleSaveNotes(move)}
                                    placeholder="Add notes..."
                                    className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[48px]"
                                    rows={2}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Add new mini move */}
              <div className="flex gap-2">
                <input type="text" value={newMoveTitle} onChange={e => setNewMoveTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMiniMove()} placeholder="Add a new mini-move..." className="input-field flex-1" />
                <button onClick={handleAddMiniMove} disabled={!newMoveTitle.trim() || addMiniMove.isPending} className="btn-primary flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>

              {/* Last Week's Mini-Moves (Editable) */}
              {previousWeekEntry && previousWeekMiniMoves.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Last Week ({format(new Date(previousWeekEntry.week_start), 'MMM d')})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {previousWeekMiniMoves.map(move => (
                      <div key={move.id} className="rounded-lg border transition-all duration-200 overflow-hidden"
                        style={{ borderColor: move.completed ? 'hsl(var(--primary) / 0.1)' : undefined }}>
                        <div className={`flex items-center gap-3 p-2.5 ${move.completed ? 'bg-sage-light/20' : 'bg-muted/30'}`}>
                          <button 
                            onClick={(e) => handleToggleMove(move.id, move.completed, previousWeekEntry.id, e)} 
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${move.completed ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary'}`}
                          >
                            {move.completed && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </button>
                          {editingMoveId === move.id ? (
                            <div className="flex-1 flex gap-2">
                              <input type="text" value={editingMoveTitle} onChange={e => setEditingMoveTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveEditMove(move, previousWeekEntry.id); if (e.key === 'Escape') setEditingMoveId(null); }} className="input-field flex-1 h-7 text-sm" autoFocus />
                              <button onClick={() => handleSaveEditMove(move, previousWeekEntry.id)} className="p-1 rounded text-primary hover:bg-primary/10"><Save className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setEditingMoveId(null)} className="p-1 rounded text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ) : (
                            <>
                              <span className={`flex-1 text-sm cursor-pointer ${move.completed ? 'line-through text-muted-foreground' : ''}`} onDoubleClick={() => handleStartEditMove(move)}>{move.title}</span>
                              <button onClick={() => handleToggleNotes(move)} className={`p-1 rounded transition-colors ${expandedMoveId === move.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'} ${move.notes ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`} title="Notes"><Edit3 className="h-3 w-3" /></button>
                              <button onClick={() => handleStartEditMove(move)} className="p-1 rounded text-muted-foreground opacity-50 hover:opacity-100 hover:text-foreground hover:bg-muted transition-colors" title="Edit"><Settings className="h-3 w-3" /></button>
                              <button onClick={() => handleDeleteMove(move.id, previousWeekEntry.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><X className="h-3.5 w-3.5" /></button>
                            </>
                          )}
                        </div>
                        {expandedMoveId === move.id && (
                          <div className="px-3 pb-2.5 pt-1 border-t border-border/50 bg-muted/20">
                            <textarea value={moveNotes[move.id] ?? move.notes ?? ''} onChange={e => setMoveNotes(prev => ({ ...prev, [move.id]: e.target.value }))} onBlur={() => handleSaveNotes(move, previousWeekEntry.id)} placeholder="Add notes..." className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[40px]" rows={2} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Mini-Moves (View Only) */}
              {allHistoricalEntries.length > 0 && (
                <Collapsible className="mt-6">
                  <CollapsibleTrigger className="w-full py-3 flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      <span className="text-sm font-medium">View Past Weeks</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    {allHistoricalEntries
                      .filter(entry => !isWeekEditable(entry.week_start))
                      .map(entry => (
                        <HistoricalWeekMoves key={entry.id} entry={entry} />
                      ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </section>

            {/* Plan Next Week's Mini-Moves - Separate Card */}
            {nextWeekEntry && (
              <section className="card-elevated p-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="heading-section">Plan Your Next Week's Mini-Moves</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  By Sunday, please fill in your Mini-Moves for the upcoming week, ready to share with the group.
                </p>
                {planAheadHint && (
                  <p className="text-xs text-primary/80 mb-4 font-medium">{planAheadHint}</p>
                )}
                {!planAheadHint && <div className="mb-4" />}

                <div className="space-y-2 mb-4">
                  {nextWeekMiniMoves.map(move => (
                    <div key={move.id} className="rounded-lg border transition-all duration-200 overflow-hidden"
                      style={{ borderColor: move.completed ? 'hsl(var(--primary) / 0.1)' : undefined }}>
                      <div className={`flex items-center gap-3 p-2.5 ${move.completed ? 'bg-sage-light/20' : 'bg-background'}`}>
                        <button 
                          onClick={(e) => handleToggleMove(move.id, move.completed, nextWeekEntry.id, e)} 
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${move.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}
                        >
                          {move.completed && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </button>
                        {editingMoveId === move.id ? (
                          <div className="flex-1 flex gap-2">
                            <input type="text" value={editingMoveTitle} onChange={e => setEditingMoveTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveEditMove(move, nextWeekEntry.id); if (e.key === 'Escape') setEditingMoveId(null); }} className="input-field flex-1 h-7 text-sm" autoFocus />
                            <button onClick={() => handleSaveEditMove(move, nextWeekEntry.id)} className="p-1 rounded text-primary hover:bg-primary/10"><Save className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditingMoveId(null)} className="p-1 rounded text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <>
                            <span className={`flex-1 text-sm cursor-pointer ${move.completed ? 'line-through text-muted-foreground' : ''}`} onDoubleClick={() => handleStartEditMove(move)}>{move.title}</span>
                            <button onClick={() => handleToggleNotes(move)} className={`p-1 rounded transition-colors ${expandedMoveId === move.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'} ${move.notes ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`} title="Notes"><Edit3 className="h-3 w-3" /></button>
                            <button onClick={() => handleStartEditMove(move)} className="p-1 rounded text-muted-foreground opacity-50 hover:opacity-100 hover:text-foreground hover:bg-muted transition-colors" title="Edit"><Settings className="h-3 w-3" /></button>
                            <button onClick={() => handleDeleteMove(move.id, nextWeekEntry.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><X className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                      {expandedMoveId === move.id && (
                        <div className="px-3 pb-2.5 pt-1 border-t border-border/50 bg-muted/20">
                          <textarea value={moveNotes[move.id] ?? move.notes ?? ''} onChange={e => setMoveNotes(prev => ({ ...prev, [move.id]: e.target.value }))} onBlur={() => handleSaveNotes(move, nextWeekEntry.id)} placeholder="Add notes..." className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[40px]" rows={2} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNextWeekMoveTitle}
                    onChange={e => setNewNextWeekMoveTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && nextWeekEntry && newNextWeekMoveTitle.trim()) {
                        addMiniMove.mutateAsync({ weeklyEntryId: nextWeekEntry.id, title: newNextWeekMoveTitle.trim() })
                          .then(() => setNewNextWeekMoveTitle(''));
                      }
                    }}
                    placeholder="Plan a mini-move for next week..."
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (nextWeekEntry && newNextWeekMoveTitle.trim()) {
                        addMiniMove.mutateAsync({ weeklyEntryId: nextWeekEntry.id, title: newNextWeekMoveTitle.trim() })
                          .then(() => setNewNextWeekMoveTitle(''));
                      }
                    }}
                    disabled={!newNextWeekMoveTitle.trim() || addMiniMove.isPending}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </section>
            )}

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

                <EditableField value={formData.obstacles} isEditing={editingSection === 'obstacles'} onEdit={() => setEditingSection('obstacles')} onSave={() => saveProfileField('obstacles')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
              ...p,
              obstacles: v
            }))} placeholder="What challenges are you facing? Being honest helps the group support you." multiline />
                {profile?.updated_at && formData.obstacles && (
                  <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(profile.updated_at), 'MMM d, yyyy')}</p>
                )}
              </section>

              {/* Wins & Reflections */}
              <section className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-terracotta-light">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="heading-section">Wins & Reflections</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Celebrate your wins this week—big or small, personal or project-related</p>

                <EditableField value={formData.wins} isEditing={editingSection === 'wins'} onEdit={() => setEditingSection('wins')} onSave={() => saveWeeklyField('wins')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
              ...p,
              wins: v
            }))} placeholder="What went well? What insights or lessons emerged?" multiline />
                {weeklyEntry?.updated_at && formData.wins && (
                  <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(weeklyEntry.updated_at), 'MMM d, yyyy')}</p>
                )}
              </section>
            </div>

            {/* Self-Care Looks Like */}
            <section className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-secondary">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
                <h2 className="heading-section">Self-Care Looks Like</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Self-care is not optional, it is strategic. How are you nurturing yourself this week?
              </p>

              <EditableField value={formData.self_care} isEditing={editingSection === 'self_care'} onEdit={() => setEditingSection('self_care')} onSave={() => saveWeeklyField('self_care')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({
            ...p,
            self_care: v
          }))} placeholder="Rest, boundaries, joy—what's supporting your wellbeing this week?" multiline />
              {weeklyEntry?.updated_at && formData.self_care && (
                <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(weeklyEntry.updated_at), 'MMM d, yyyy')}</p>
              )}
            </section>

            {/* Account Settings - Collapsible */}
            <Collapsible defaultOpen={false} className="group/settings pt-8">
              <CollapsibleTrigger className="w-full py-3 flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors border-b border-border">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  <span className="text-base font-medium">Account Settings</span>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]/settings:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-8 space-y-10">
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Edit3 className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Your Profile</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col items-start gap-2 p-4">
                        <AvatarUpload currentAvatarUrl={profile?.avatar_url || null} name={profile?.name || ''} onUploadComplete={async url => {
                      await updateProfile.mutateAsync({ avatar_url: url });
                    }} onRemove={async () => {
                      await updateProfile.mutateAsync({ avatar_url: null });
                    }} size="md" />
                        <span className="text-xs text-muted-foreground">Click to change</span>
                      </div>
                      <EditableField label="Display Name" icon={<User className="h-4 w-4 text-muted-foreground" />} value={formData.name} isEditing={editingSection === 'name'} onEdit={() => setEditingSection('name')} onSave={() => saveProfileField('name')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({ ...p, name: v }))} placeholder="Enter your name" compact />
                      <EditableField label="Business Name" icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} value={formData.business_name} isEditing={editingSection === 'business_name'} onEdit={() => setEditingSection('business_name')} onSave={() => saveProfileField('business_name')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({ ...p, business_name: v }))} placeholder="Enter your business name" compact />
                      <EditableField label="Business Website" icon={<Globe className="h-4 w-4 text-muted-foreground" />} value={formData.business_website} isEditing={editingSection === 'business_website'} onEdit={() => setEditingSection('business_website')} onSave={() => saveProfileField('business_website')} onCancel={() => setEditingSection(null)} onChange={v => setFormData(p => ({ ...p, business_website: v }))} placeholder="https://yourbusiness.com" compact />
                    </div>
                  </div>

                  {/* Email Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Email Address</h3>
                    </div>
                    <EmailChangeSection currentEmail={user?.email || ''} />
                  </div>

                  {/* Email Notifications */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Email Notifications</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose how you want to be notified about new group questions
                    </p>
                    <NotificationPreferencesSection 
                      preference={profile?.notification_preference ?? 'instant'}
                      onUpdate={async (preference) => {
                        try {
                          await updateProfile.mutateAsync({ notification_preference: preference });
                          const messages = {
                            instant: "You'll receive instant email notifications for new group questions.",
                            digest: "You'll receive a weekly digest of new group questions every Monday.",
                            off: "You won't receive email notifications for new group questions."
                          };
                          toast({
                            title: "Preferences updated",
                            description: messages[preference]
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                  </div>

                  {/* Request Account Deletion */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </div>
                      <h3 className="font-semibold text-lg text-destructive">Delete Account</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5">
                      Request deletion of your account and all associated data. The facilitator will process your request.
                    </p>
                    <RequestDeletionDialog userId={user?.id || ''} userEmail={user?.email || ''} userName={profile?.name || ''} />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>}
      </div>
    </AppLayout>;
}

// Editable Field Component
interface EditableFieldProps {
  label?: string;
  icon?: React.ReactNode;
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
  icon,
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
        {label && <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>}
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
      {label && <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>}
      <div onClick={onEdit} className={`rounded-lg border border-transparent bg-muted/30 hover:bg-muted/50 hover:border-border cursor-pointer transition-all duration-200 ${compact ? 'p-2.5 min-h-[40px]' : 'p-4 min-h-[60px]'}`}>
        {value ? <p className={`whitespace-pre-wrap ${compact ? 'text-sm' : 'text-body'}`}>{value}</p> : <p className={`text-muted-foreground italic ${compact ? 'text-sm' : ''}`}>{placeholder || 'Click to edit...'}</p>}
      </div>
    </div>;
}

// Historical Week Mini-Moves Component (View Only)
interface HistoricalWeekMovesProps {
  entry: WeeklyEntry;
}
function HistoricalWeekMoves({ entry }: HistoricalWeekMovesProps) {
  const { data: moves = [] } = useMiniMoves(entry.id);
  const toggleMove = useToggleMiniMove();
  const { toast } = useToast();
  
  if (moves.length === 0) return null;
  
  const completedCount = moves.filter(m => m.completed).length;
  const weekDate = new Date(entry.week_start);

  const handleToggle = async (move: MiniMove) => {
    try {
      await toggleMove.mutateAsync({ id: move.id, completed: !move.completed, weeklyEntryId: entry.id });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  return (
    <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Week of {format(weekDate, 'MMM d, yyyy')}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{moves.length} completed
        </span>
      </div>
      <div className="space-y-1.5">
        {moves.map((move: MiniMove) => (
          <div 
            key={move.id} 
            className={`
              flex items-center gap-2 p-2 rounded text-sm
              ${move.completed ? 'text-muted-foreground' : 'text-foreground'}
            `}
          >
            <button
              onClick={() => handleToggle(move)}
              className={`
                flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer
                ${move.completed ? 'bg-primary/20 border-primary/30 hover:bg-primary/30' : 'border-muted-foreground/30 hover:border-primary'}
              `}
            >
              {move.completed && <Check className="h-2.5 w-2.5 text-primary" />}
            </button>
            <span className={move.completed ? 'line-through' : ''}>
              {move.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Email Change Section Component
interface EmailChangeSectionProps {
  currentEmail: string;
}
function EmailChangeSection({
  currentEmail
}: EmailChangeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || newEmail === currentEmail) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        email: newEmail
      });
      if (error) throw error;
      toast({
        title: "Confirmation email sent",
        description: "Please check your new email address to confirm the change."
      });
      setIsEditing(false);
      setNewEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div>
      {isEditing ? <div className="space-y-4">
          <div>
            <label className="label-text">Current email</label>
            <p className="text-muted-foreground">{currentEmail}</p>
          </div>
          <div>
            <label className="label-text">New email</label>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Enter new email address" className="input-field" autoFocus />
          </div>
          <div className="flex gap-3">
            <button onClick={handleUpdateEmail} disabled={isSubmitting || !newEmail.trim()} className="btn-primary flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Update Email
            </button>
            <button onClick={() => {
          setIsEditing(false);
          setNewEmail('');
        }} className="btn-secondary">
              Cancel
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            A confirmation link will be sent to your new email address.
          </p>
        </div> : <div onClick={() => setIsEditing(true)} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all duration-200">
          <p className="text-base">{currentEmail}</p>
          <p className="text-sm text-muted-foreground mt-1">Click to change your email address</p>
        </div>}
    </div>;
}

// Notification Preferences Component
import { NotificationPreference } from '@/hooks/useProfile';

interface NotificationPreferencesSectionProps {
  preference: NotificationPreference;
  onUpdate: (preference: NotificationPreference) => void;
}

function NotificationPreferencesSection({ preference, onUpdate }: NotificationPreferencesSectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newPreference: NotificationPreference) => {
    if (newPreference === preference) return;
    setIsUpdating(true);
    try {
      await onUpdate(newPreference);
    } finally {
      setIsUpdating(false);
    }
  };

  const options: { value: NotificationPreference; label: string; description: string; icon: typeof Bell }[] = [
    {
      value: 'instant',
      label: 'Instant',
      description: 'Get notified immediately when someone posts',
      icon: Bell
    },
    {
      value: 'digest',
      label: 'Weekly Digest',
      description: 'Receive a summary every Monday at 9am',
      icon: Mail
    },
    {
      value: 'off',
      label: 'Off',
      description: 'No email notifications',
      icon: BellOff
    }
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = preference === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleUpdate(option.value)}
            disabled={isUpdating}
            className={`
              p-4 rounded-lg text-left transition-all duration-200
              ${isSelected 
                ? 'bg-primary/10 ring-2 ring-primary' 
                : 'bg-muted/30 hover:bg-muted/50'
              }
              ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Icon className={`h-5 w-5 mb-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`font-medium ${isSelected ? 'text-primary' : ''}`}>{option.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}

// Request Deletion Dialog Component
interface RequestDeletionDialogProps {
  userId: string;
  userEmail: string;
  userName: string;
}
function RequestDeletionDialog({
  userId,
  userEmail,
  userName
}: RequestDeletionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const {
    toast
  } = useToast();

  // Check if user already has a pending request
  const {
    data: existingRequest
  } = useQuery({
    queryKey: ['deletion-request', userId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('deletion_requests').select('*').eq('user_id', userId).eq('status', 'pending').maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
  const handleSubmitRequest = async () => {
    if (!userId || !userEmail || !userName) {
      toast({
        title: "Error",
        description: "Unable to submit request. Please try again.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('deletion_requests').insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        reason: reason || null
      });
      if (error) throw error;

      // Notify facilitator via edge function (fire and forget)
      supabase.functions.invoke('notify-deletion-request', {
        body: {
          memberName: userName,
          memberEmail: userEmail,
          reason: reason || undefined
        }
      }).catch(err => console.error('Failed to send admin notification:', err));
      toast({
        title: "Request submitted",
        description: "Your account deletion request has been sent to the facilitator."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (existingRequest) {
    return <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground">
          Your deletion request has been submitted and is awaiting processing by the facilitator.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Submitted: {new Date(existingRequest.requested_at).toLocaleDateString()}
        </p>
      </div>;
  }
  return <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="btn-secondary border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Request Account Deletion
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Request Account Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Your request will be sent to the facilitator who will process the deletion of your account and all associated data. This cannot be undone once processed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">Reason for leaving (optional)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Share any feedback about your experience..." className="input-field resize-y min-h-[80px] text-sm" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmitRequest} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isSubmitting ? <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </> : 'Submit Request'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
}