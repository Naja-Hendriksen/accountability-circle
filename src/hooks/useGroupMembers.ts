import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Profile } from './useProfile';
import { WeeklyEntry, MiniMove } from './useWeeklyEntry';
import { startOfWeek, format, subWeeks } from 'date-fns';

export interface GroupMemberData {
  profile: Profile;
  currentWeek: WeeklyEntry | null;
  previousWeek: WeeklyEntry | null;
  currentMiniMoves: MiniMove[];
  previousMiniMoves: MiniMove[];
}

export function useGroupMembers() {
  const { user } = useAuth();
  
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const previousWeekStart = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['groupMembers', user?.id, currentWeekStart],
    queryFn: async (): Promise<GroupMemberData[]> => {
      if (!user) return [];

      // Get user's groups
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (groupsError) throw groupsError;
      if (!userGroups?.length) return [];

      const groupIds = userGroups.map(g => g.group_id);

      // Get all members in those groups
      const { data: groupMembersList, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds);

      if (membersError) throw membersError;
      
      const memberUserIds = [...new Set(groupMembersList?.map(m => m.user_id) || [])];
      if (!memberUserIds.length) return [];

      // Get profiles for all members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', memberUserIds);

      if (profilesError) throw profilesError;

      // Get weekly entries for current and previous week
      const { data: weeklyEntries, error: entriesError } = await supabase
        .from('weekly_entries')
        .select('*')
        .in('user_id', memberUserIds)
        .in('week_start', [currentWeekStart, previousWeekStart]);

      if (entriesError) throw entriesError;

      // Get mini moves for those entries
      const entryIds = weeklyEntries?.map(e => e.id) || [];
      let miniMoves: MiniMove[] = [];
      
      if (entryIds.length > 0) {
        const { data: moves, error: movesError } = await supabase
          .from('mini_moves')
          .select('*')
          .in('weekly_entry_id', entryIds);

        if (movesError) throw movesError;
        miniMoves = moves as MiniMove[] || [];
      }

      // Combine data for each member
      return (profiles || []).map(profile => {
        const currentWeek = weeklyEntries?.find(
          e => e.user_id === profile.user_id && e.week_start === currentWeekStart
        ) as WeeklyEntry | undefined;
        
        const previousWeek = weeklyEntries?.find(
          e => e.user_id === profile.user_id && e.week_start === previousWeekStart
        ) as WeeklyEntry | undefined;

        const currentMiniMoves = currentWeek 
          ? miniMoves.filter(m => m.weekly_entry_id === currentWeek.id)
          : [];
        
        const previousMiniMoves = previousWeek
          ? miniMoves.filter(m => m.weekly_entry_id === previousWeek.id)
          : [];

        return {
          profile: profile as Profile,
          currentWeek: currentWeek || null,
          previousWeek: previousWeek || null,
          currentMiniMoves,
          previousMiniMoves,
        };
      });
    },
    enabled: !!user,
  });
}
