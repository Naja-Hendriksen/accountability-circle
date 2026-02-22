import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Trophy, PartyPopper, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns';
import confetti from 'canvas-confetti';

interface CompletedMove {
  id: string;
  title: string;
}

export default function CelebrationPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [moves, setMoves] = useState<CompletedMove[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [checked, setChecked] = useState(false);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const storageKey = user ? `celebration_seen_${user.id}` : '';

  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const prevMonthLabel = format(prevMonthStart, 'MMMM yyyy');

  const fetchPrevMonthCompletions = useCallback(async () => {
    if (!user) return [];

    // Get all weekly entries that overlap with previous month
    const { data: entries, error: entriesError } = await supabase
      .from('weekly_entries')
      .select('id')
      .eq('user_id', user.id)
      .gte('week_start', prevMonthStart.toISOString().split('T')[0])
      .lte('week_start', prevMonthEnd.toISOString().split('T')[0]);

    if (entriesError || !entries?.length) return [];

    const entryIds = entries.map(e => e.id);

    const { data, error } = await supabase
      .from('mini_moves')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('completed', true)
      .in('weekly_entry_id', entryIds)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('Error fetching completions:', error);
      return [];
    }
    return (data || []) as CompletedMove[];
  }, [user, prevMonthStart, prevMonthEnd]);

  // Auto-trigger check on mount
  useEffect(() => {
    if (!user || checked) return;
    setChecked(true);

    const lastSeenMonth = localStorage.getItem(storageKey);
    if (lastSeenMonth === currentMonthKey) return; // Already seen this month

    // Fetch and show
    fetchPrevMonthCompletions().then(completions => {
      if (completions.length > 0) {
        setMoves(completions);
        setCurrentIndex(0);
        setAnimating(false);
        setOpen(true);
      }
    });
  }, [user, checked, storageKey, currentMonthKey, fetchPrevMonthCompletions]);

  const handleClose = () => {
    localStorage.setItem(storageKey, currentMonthKey);
    setOpen(false);
  };

  // Fire confetti when dialog opens with moves
  const confettiFired = useRef(false);
  useEffect(() => {
    if (open && moves.length > 0 && !confettiFired.current) {
      confettiFired.current = true;
      // Initial burst
      const fire = (options: confetti.Options) => {
        confetti({ ...options, disableForReducedMotion: true });
      };
      fire({ particleCount: 80, spread: 100, origin: { y: 0.6 }, startVelocity: 30 });
      setTimeout(() => fire({ particleCount: 50, spread: 120, origin: { x: 0.3, y: 0.5 }, startVelocity: 25 }), 250);
      setTimeout(() => fire({ particleCount: 50, spread: 120, origin: { x: 0.7, y: 0.5 }, startVelocity: 25 }), 500);
    }
    if (!open) {
      confettiFired.current = false;
    }
  }, [open, moves.length]);

  // Auto-advance the rolling list
  useEffect(() => {
    if (!open || moves.length <= 1) return;

    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % moves.length);
        setAnimating(false);
      }, 400);
    }, 2500);

    return () => clearInterval(interval);
  }, [open, moves.length]);

  // Manual trigger button
  const handleManualOpen = async () => {
    const completions = await fetchPrevMonthCompletions();
    setMoves(completions);
    setCurrentIndex(0);
    setAnimating(false);
    setOpen(true);
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleManualOpen}
        className="btn-primary flex items-center gap-2 text-sm"
        title="Celebrate last month's accomplishments!"
      >
        <PartyPopper className="h-4 w-4" />
        Celebrate
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-md text-center overflow-hidden">
          <DialogTitle className="sr-only">Monthly Celebration</DialogTitle>

          {moves.length === 0 ? (
            <div className="py-8 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="heading-section text-foreground">No completions in {prevMonthLabel}</h2>
              <p className="text-sm text-muted-foreground">
                Keep working on your mini-moves — you've got this!
              </p>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                  <PartyPopper className="h-10 w-10 text-primary" />
                </div>
                <h2 className="heading-section text-foreground text-xl">
                  🎉 Amazing Work!
                </h2>
                <p className="text-muted-foreground text-sm">
                  In <span className="font-medium text-foreground">{prevMonthLabel}</span> you completed
                </p>
                <p className="text-4xl font-bold text-primary">
                  {moves.length}
                </p>
                <p className="text-muted-foreground text-sm">
                  mini-move{moves.length !== 1 ? 's' : ''}!
                </p>
              </div>

              {/* Rolling list */}
              <div className="relative h-16 flex items-center justify-center overflow-hidden rounded-lg bg-muted/30 border border-border/50 mx-4">
                <div
                  className={`flex items-center gap-2 px-4 transition-all duration-400 ${
                    animating
                      ? 'opacity-0 -translate-y-6'
                      : 'opacity-100 translate-y-0'
                  }`}
                >
                  <Star className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground line-clamp-2 text-left">
                    {moves[currentIndex]?.title}
                  </span>
                </div>

                {moves.length > 1 && (
                  <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
                    {moves.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                          i === currentIndex ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleClose}
                className="btn-primary mx-auto"
              >
                Keep Going! 💪
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
