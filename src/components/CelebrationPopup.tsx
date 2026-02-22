import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Trophy, PartyPopper, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface CompletedMove {
  id: string;
  title: string;
  completed: boolean;
  updated_at: string;
}

export default function CelebrationPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [moves, setMoves] = useState<CompletedMove[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  const storageKey = user ? `celebration_last_seen_${user.id}` : '';

  const fetchNewCompletions = useCallback(async () => {
    if (!user) return [];
    const lastSeen = localStorage.getItem(storageKey);

    let query = supabase
      .from('mini_moves')
      .select('id, title, completed, updated_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('updated_at', { ascending: true });

    if (lastSeen) {
      query = query.gt('updated_at', lastSeen);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching completions:', error);
      return [];
    }
    return (data || []) as CompletedMove[];
  }, [user, storageKey]);

  const handleOpen = async () => {
    setLoading(true);
    const completions = await fetchNewCompletions();
    setMoves(completions);
    setCurrentIndex(0);
    setAnimating(false);
    setOpen(true);
    setLoading(false);
  };

  const handleClose = () => {
    if (moves.length > 0) {
      // Mark as seen — use the latest updated_at
      const latest = moves.reduce((max, m) =>
        m.updated_at > max ? m.updated_at : max, moves[0].updated_at
      );
      localStorage.setItem(storageKey, latest);
    }
    setOpen(false);
  };

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

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={loading}
        className="btn-primary flex items-center gap-2 text-sm"
        title="Celebrate your accomplishments!"
      >
        <PartyPopper className="h-4 w-4" />
        Celebrate
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-md text-center overflow-hidden">
          <DialogTitle className="sr-only">Celebration</DialogTitle>

          {moves.length === 0 ? (
            <div className="py-8 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="heading-section text-foreground">No new completions yet</h2>
              <p className="text-sm text-muted-foreground">
                Keep working on your mini-moves — come back to celebrate when you've checked some off!
              </p>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {/* Confetti-style header */}
              <div className="space-y-2">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                  <PartyPopper className="h-10 w-10 text-primary" />
                </div>
                <h2 className="heading-section text-foreground text-xl">
                  🎉 Amazing Work!
                </h2>
                <p className="text-muted-foreground text-sm">
                  You've completed
                </p>
                <p className="text-4xl font-bold text-primary">
                  {moves.length}
                </p>
                <p className="text-muted-foreground text-sm">
                  mini-move{moves.length !== 1 ? 's' : ''} since your last celebration!
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

                {/* Progress dots */}
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
