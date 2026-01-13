import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { useGroupMembers, GroupMemberData } from '@/hooks/useGroupMembers';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Loader2, 
  Users, 
  Search, 
  Target, 
  Calendar,
  Sparkles,
  AlertCircle,
  Trophy,
  Heart,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export default function GroupView() {
  const { user, loading: authLoading } = useAuth();
  const { data: members = [], isLoading } = useGroupMembers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const filteredMembers = members.filter(m => 
    m.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayMembers = selectedMemberId 
    ? filteredMembers.filter(m => m.profile.user_id === selectedMemberId)
    : filteredMembers;

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const previousWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const previousWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="heading-display text-foreground">Group View</h1>
          </div>
          <p className="text-body text-muted-foreground">
            See how your accountability partners are progressing
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 animate-slide-up">
          <div className="card-elevated p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="input-field pl-10"
                />
              </div>
              
              {members.length > 0 && (
                <select
                  value={selectedMemberId || ''}
                  onChange={(e) => setSelectedMemberId(e.target.value || null)}
                  className="input-field sm:w-48"
                >
                  <option value="">All members</option>
                  {members.map(m => (
                    <option key={m.profile.user_id} value={m.profile.user_id}>
                      {m.profile.name || 'Unnamed'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="heading-section text-foreground mb-2">No group yet</h3>
            <p className="text-body text-muted-foreground">
              You're not part of any accountability group yet. <br />
              Ask your facilitator to add you to a group.
            </p>
          </div>
        ) : displayMembers.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <p className="text-body text-muted-foreground">
              No members match your search.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayMembers.map((member, index) => (
              <MemberCard 
                key={member.profile.user_id} 
                member={member}
                currentWeekDates={{ start: currentWeekStart, end: currentWeekEnd }}
                previousWeekDates={{ start: previousWeekStart, end: previousWeekEnd }}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface MemberCardProps {
  member: GroupMemberData;
  currentWeekDates: { start: Date; end: Date };
  previousWeekDates: { start: Date; end: Date };
  delay: number;
}

function MemberCard({ member, currentWeekDates, previousWeekDates, delay }: MemberCardProps) {
  const [expandedWeek, setExpandedWeek] = useState<'current' | 'previous' | null>('current');
  const { profile, currentWeek, previousWeek, currentMiniMoves, previousMiniMoves } = member;

  const currentCompleted = currentMiniMoves.filter(m => m.completed).length;
  const currentTotal = currentMiniMoves.length;
  const currentProgress = currentTotal > 0 ? (currentCompleted / currentTotal) * 100 : 0;

  const previousCompleted = previousMiniMoves.filter(m => m.completed).length;
  const previousTotal = previousMiniMoves.length;
  const previousProgress = previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;

  return (
    <div 
      className="card-elevated overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Member header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-border flex-shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
            <AvatarFallback className="bg-sage-light text-primary font-display font-semibold text-xl">
              {(profile.name || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-semibold text-foreground truncate">
              {profile.name || 'Unnamed Member'}
            </h3>
            {profile.growth_goal && (
              <div className="mt-2 flex items-start gap-2">
                <Target className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {profile.growth_goal}
                </p>
              </div>
            )}
          </div>
        </div>

        {profile.monthly_milestones && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Monthly Focus
              </span>
            </div>
            <p className="text-sm text-foreground">{profile.monthly_milestones}</p>
          </div>
        )}
      </div>

      {/* Weekly sections */}
      <div className="divide-y divide-border/50">
        {/* Current Week */}
        <WeekSection
          title="This Week"
          dates={`${format(currentWeekDates.start, 'MMM d')} – ${format(currentWeekDates.end, 'MMM d')}`}
          entry={currentWeek}
          miniMoves={currentMiniMoves}
          progress={currentProgress}
          completed={currentCompleted}
          total={currentTotal}
          isExpanded={expandedWeek === 'current'}
          onToggle={() => setExpandedWeek(expandedWeek === 'current' ? null : 'current')}
          isCurrent
        />

        {/* Previous Week */}
        <WeekSection
          title="Last Week"
          dates={`${format(previousWeekDates.start, 'MMM d')} – ${format(previousWeekDates.end, 'MMM d')}`}
          entry={previousWeek}
          miniMoves={previousMiniMoves}
          progress={previousProgress}
          completed={previousCompleted}
          total={previousTotal}
          isExpanded={expandedWeek === 'previous'}
          onToggle={() => setExpandedWeek(expandedWeek === 'previous' ? null : 'previous')}
        />
      </div>
    </div>
  );
}

interface WeekSectionProps {
  title: string;
  dates: string;
  entry: any;
  miniMoves: any[];
  progress: number;
  completed: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrent?: boolean;
}

function WeekSection({ 
  title, 
  dates, 
  entry, 
  miniMoves, 
  progress, 
  completed, 
  total,
  isExpanded, 
  onToggle,
  isCurrent 
}: WeekSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
            <Sparkles className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-left">
            <span className="font-medium text-foreground">{title}</span>
            <span className="text-sm text-muted-foreground ml-2">{dates}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              {completed}/{total}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 animate-fade-in">
          {/* Progress bar */}
          {total > 0 && (
            <div>
              <div className="progress-indicator">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Mini moves */}
          {miniMoves.length > 0 && (
            <div className="space-y-2">
              {miniMoves.map(move => (
                <div
                  key={move.id}
                  className={`
                    flex items-center gap-3 p-2 rounded-lg text-sm
                    ${move.completed ? 'text-muted-foreground' : 'text-foreground'}
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${move.completed ? 'bg-primary border-primary' : 'border-border'}
                  `}>
                    {move.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className={move.completed ? 'line-through' : ''}>
                    {move.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Entry details */}
          {entry && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {entry.obstacles && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-medium uppercase tracking-wide text-destructive">
                      Obstacles
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{entry.obstacles}</p>
                </div>
              )}

              {entry.wins && (
                <div className="p-3 rounded-lg bg-terracotta-light/30 border border-accent/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium uppercase tracking-wide text-accent">
                      Wins
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{entry.wins}</p>
                </div>
              )}

              {entry.self_care && (
                <div className="p-3 rounded-lg bg-secondary border border-secondary">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Self-Care
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{entry.self_care}</p>
                </div>
              )}
            </div>
          )}

          {!entry && miniMoves.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No data for this week yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
