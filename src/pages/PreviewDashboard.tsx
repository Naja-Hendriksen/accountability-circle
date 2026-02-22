import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Target, Calendar, Sparkles, AlertCircle, Trophy, Heart, Check,
  Users, ChevronDown, ChevronUp, Search, MessageCircle, Lock,
  LayoutDashboard, ArrowRight
} from 'lucide-react';
import logo from '@/assets/accountability-circle-logo.png';

// Mock data for the preview
const MOCK_PROFILE = {
  name: 'Sarah',
  growth_goal: 'Launch my online course and reach 100 students by Q4',
  monthly_milestones: 'Complete course outline, record 5 video modules, set up landing page',
};

const MOCK_MINI_MOVES = [
  { id: '1', title: 'Draft module 1 script', completed: true },
  { id: '2', title: 'Set up email sequence for launch', completed: true },
  { id: '3', title: 'Design course landing page mockup', completed: false },
  { id: '4', title: 'Record intro video', completed: false },
];

const MOCK_GROUP_MEMBERS = [
  {
    name: 'Emma Johnson',
    avatar: null,
    initials: 'E',
    business: 'Bloom Studio',
    growth_goal: 'Build a subscription-based design template library',
    monthly: 'Launch 10 new templates, grow email list to 500',
    miniMoves: [
      { title: 'Design 3 new Canva templates', completed: true },
      { title: 'Write welcome email sequence', completed: true },
      { title: 'Set up Gumroad storefront', completed: false },
    ],
    wins: 'Got my first 50 email subscribers this week! 🎉',
    obstacles: 'Struggling with pricing strategy',
    selfCare: 'Morning yoga and journaling',
  },
  {
    name: 'Lisa Chen',
    avatar: null,
    initials: 'L',
    business: 'Mindful Marketing Co.',
    growth_goal: 'Create a digital marketing toolkit for small businesses',
    monthly: 'Complete toolkit content, beta test with 5 clients',
    miniMoves: [
      { title: 'Write social media playbook chapter', completed: true },
      { title: 'Create 3 marketing templates', completed: false },
      { title: 'Schedule beta tester interviews', completed: false },
    ],
    wins: 'Finished the first draft of my playbook!',
    obstacles: 'Need to find more beta testers',
    selfCare: 'Weekend hikes and reading fiction',
  },
  {
    name: 'Priya Patel',
    avatar: null,
    initials: 'P',
    business: null,
    growth_goal: 'Launch my first e-book on personal finance for women',
    monthly: 'Write 3 chapters, research publishing platforms',
    miniMoves: [
      { title: 'Outline chapters 4-6', completed: true },
      { title: 'Research Amazon KDP vs Gumroad', completed: true },
      { title: 'Write chapter 4 first draft', completed: true },
      { title: 'Design book cover concepts', completed: false },
    ],
    wins: 'Wrote 5,000 words this week — new personal record!',
    obstacles: null,
    selfCare: 'Daily meditation and tea ritual',
  },
];

function CTABanner({ variant = 'default' }: { variant?: 'default' | 'group' }) {
  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-3">
      <h3 className="heading-section text-foreground">
        {variant === 'group' ? 'Your group is waiting' : 'Ready to join?'}
      </h3>
      <p className="text-body text-muted-foreground max-w-md mx-auto">
        {variant === 'group'
          ? 'Apply to be matched with a small group of ambitious women who will keep you accountable every week.'
          : 'Get your own dashboard, set your goals, and join a group of women building their digital products together.'}
      </p>
      <Link to="/apply">
        <Button className="mt-2 gap-2" size="lg">
          Apply Now <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export default function PreviewDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'group'>('dashboard');
  const [expandedMember, setExpandedMember] = useState<number | null>(0);

  const completedMoves = MOCK_MINI_MOVES.filter(m => m.completed).length;
  const progress = (completedMoves / MOCK_MINI_MOVES.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Accountability Circle" className="h-8 w-auto" />
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">
              Accountability Circle
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/apply">
              <Button size="sm" className="gap-1.5">
                Apply <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Preview banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-3 text-center">
        <p className="text-sm font-medium text-primary flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          Preview Mode — This is what your membership dashboard looks like
        </p>
      </div>

      {/* Tab navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-full max-w-md">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            My Dashboard
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'group'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Group View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <DashboardPreview
            progress={progress}
            completedMoves={completedMoves}
          />
        ) : (
          <GroupViewPreview
            expandedMember={expandedMember}
            setExpandedMember={setExpandedMember}
          />
        )}
      </div>
    </div>
  );
}

function DashboardPreview({ progress, completedMoves }: { progress: number; completedMoves: number }) {
  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="heading-display text-foreground mb-2">Welcome back, {MOCK_PROFILE.name}</h1>
        <p className="text-body text-muted-foreground">Week of Feb 17 – Feb 23, 2026</p>
      </div>

      {/* Growth Goal & Monthly Milestones */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/20">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <h2 className="heading-section text-lg">Growth Goal</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Your overarching vision for what will bring you the most growth</p>
          <p className="text-foreground">{MOCK_PROFILE.growth_goal}</p>
        </section>

        <section className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h2 className="heading-section text-lg">Monthly Milestones</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">What you aim to accomplish this month</p>
          <p className="text-foreground">{MOCK_PROFILE.monthly_milestones}</p>
        </section>
      </div>

      {/* Mini-Moves */}
      <section className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-sage-light">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="heading-section text-lg">Weekly Mini-Moves</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Small, achievable actions you are working on this week</p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{completedMoves} of {MOCK_MINI_MOVES.length} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-indicator">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          {MOCK_MINI_MOVES.map(move => (
            <div key={move.id} className={`flex items-center gap-3 p-3 rounded-lg border ${move.completed ? 'bg-sage-light/30 border-primary/20' : 'border-border'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${move.completed ? 'bg-primary border-primary' : 'border-border'}`}>
                {move.completed && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <span className={move.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>{move.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Wins, Obstacles, Self-Care */}
      <div className="grid md:grid-cols-3 gap-6">
        <section className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-medium uppercase tracking-wide text-accent">Wins & Reflections</h3>
          </div>
          <p className="text-sm text-muted-foreground italic">Share your wins here each week…</p>
        </section>
        <section className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Obstacles</h3>
          </div>
          <p className="text-sm text-muted-foreground italic">What's standing in your way…</p>
        </section>
        <section className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Self-Care</h3>
          </div>
          <p className="text-sm text-muted-foreground italic">How you're taking care of yourself…</p>
        </section>
      </div>

      <CTABanner />
    </div>
  );
}

function GroupViewPreview({ expandedMember, setExpandedMember }: { expandedMember: number | null; setExpandedMember: (v: number | null) => void }) {
  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h1 className="heading-display text-foreground text-3xl md:text-4xl">Group View</h1>
        </div>
        <p className="text-body text-muted-foreground">See how your accountability partners are progressing</p>
      </div>

      {/* Search bar (disabled) */}
      <div className="card-elevated p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            disabled
            placeholder="Search by name..."
            className="input-field pl-10 opacity-60 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Member cards */}
      <div className="space-y-6">
        {MOCK_GROUP_MEMBERS.map((member, index) => {
          const completedCount = member.miniMoves.filter(m => m.completed).length;
          const totalCount = member.miniMoves.length;
          const memberProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          const isExpanded = expandedMember === index;

          return (
            <div key={index} className="card-elevated overflow-hidden">
              {/* Member header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 border-2 border-border flex-shrink-0">
                    <AvatarFallback className="bg-sage-light text-primary font-display font-semibold text-xl">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-semibold text-foreground truncate">{member.name}</h3>
                    {member.business && (
                      <p className="text-sm text-muted-foreground truncate">{member.business}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Growth Goal</span>
                    </div>
                    <p className="text-sm text-foreground">{member.growth_goal}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Milestones</span>
                    </div>
                    <p className="text-sm text-foreground">{member.monthly}</p>
                  </div>
                </div>
              </div>

              {/* Week section */}
              <div>
                <button
                  onClick={() => setExpandedMember(isExpanded ? null : index)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-foreground">This Week</span>
                      <span className="text-sm text-muted-foreground ml-2">Feb 17 – Feb 23</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{completedCount}/{totalCount}</span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4 animate-fade-in">
                    {/* Progress */}
                    <div className="progress-indicator">
                      <div className="progress-fill" style={{ width: `${memberProgress}%` }} />
                    </div>

                    {/* Mini moves */}
                    <div className="space-y-2">
                      {member.miniMoves.map((move, mi) => (
                        <div key={mi} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${move.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${move.completed ? 'bg-primary border-primary' : 'border-border'}`}>
                            {move.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className={move.completed ? 'line-through' : ''}>{move.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Wins & Obstacles */}
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Obstacles</span>
                        </div>
                        <p className="text-sm text-foreground">
                          {member.obstacles || <span className="italic text-muted-foreground">None shared</span>}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-terracotta-light/30 border border-accent/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-accent" />
                          <span className="text-xs font-medium uppercase tracking-wide text-accent">Wins</span>
                        </div>
                        <p className="text-sm text-foreground">{member.wins}</p>
                      </div>
                    </div>

                    {member.selfCare && (
                      <div className="p-3 rounded-lg bg-secondary border border-secondary">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-accent" />
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Self-Care</span>
                        </div>
                        <p className="text-sm text-foreground">{member.selfCare}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CTABanner variant="group" />
    </div>
  );
}
