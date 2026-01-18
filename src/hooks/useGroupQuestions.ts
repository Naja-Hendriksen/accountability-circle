import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface GroupReaction {
  id: string;
  user_id: string;
  question_id: string | null;
  answer_id: string | null;
  reaction_type: string;
  created_at: string;
}

export interface GroupQuestion {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    name: string;
    avatar_url: string | null;
  };
  answers?: GroupAnswer[];
  reactions?: GroupReaction[];
  userHasLiked?: boolean;
  likeCount?: number;
}

export interface GroupAnswer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    name: string;
    avatar_url: string | null;
  };
  reactions?: GroupReaction[];
  userHasLiked?: boolean;
  likeCount?: number;
}

export function useGroupQuestions(groupId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-questions', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      // Fetch questions
      const { data: questions, error: questionsError } = await supabase
        .from('group_questions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      // Fetch profiles for question authors
      const questionUserIds = [...new Set(questions.map(q => q.user_id))];
      const { data: questionProfiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', questionUserIds);

      // Fetch all answers for these questions
      const questionIds = questions.map(q => q.id);
      const { data: answers, error: answersError } = await supabase
        .from('group_answers')
        .select('*')
        .in('question_id', questionIds)
        .order('created_at', { ascending: true });

      if (answersError) throw answersError;

      // Fetch profiles for answer authors
      const answerUserIds = [...new Set((answers || []).map(a => a.user_id))];
      const { data: answerProfiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', answerUserIds);

      // Fetch all reactions for questions and answers
      const answerIds = (answers || []).map(a => a.id);
      const { data: questionReactions } = await supabase
        .from('group_reactions')
        .select('*')
        .in('question_id', questionIds);

      const { data: answerReactions } = answerIds.length > 0 
        ? await supabase
            .from('group_reactions')
            .select('*')
            .in('answer_id', answerIds)
        : { data: [] };

      // Map profiles to questions and answers
      const profileMap = new Map(
        [...(questionProfiles || []), ...(answerProfiles || [])].map(p => [p.user_id, p])
      );

      const questionsWithData: GroupQuestion[] = questions.map(q => {
        const qReactions = (questionReactions || []).filter(r => r.question_id === q.id);
        return {
          ...q,
          profile: profileMap.get(q.user_id) || { name: 'Unknown', avatar_url: null },
          reactions: qReactions,
          likeCount: qReactions.length,
          userHasLiked: qReactions.some(r => r.user_id === user?.id),
          answers: (answers || [])
            .filter(a => a.question_id === q.id)
            .map(a => {
              const aReactions = (answerReactions || []).filter(r => r.answer_id === a.id);
              return {
                ...a,
                profile: profileMap.get(a.user_id) || { name: 'Unknown', avatar_url: null },
                reactions: aReactions,
                likeCount: aReactions.length,
                userHasLiked: aReactions.some(r => r.user_id === user?.id)
              };
            })
        };
      });

      return questionsWithData;
    },
    enabled: !!groupId && !!user
  });
}

export function useAddQuestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, content, authorName }: { groupId: string; content: string; authorName: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('group_questions')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to group members (fire and forget)
      supabase.functions.invoke('notify-new-question', {
        body: {
          questionId: data.id,
          groupId,
          authorName
        }
      }).catch(err => console.error('Failed to send new question notification:', err));

      return data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-questions', groupId] });
    }
  });
}

export function useAddAnswer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ questionId, content, groupId, replierName }: { questionId: string; content: string; groupId: string; replierName: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('group_answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to question author (fire and forget)
      supabase.functions.invoke('notify-question-reply', {
        body: {
          questionId,
          answerId: data.id,
          replierName
        }
      }).catch(err => console.error('Failed to send reply notification:', err));

      return data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-questions', groupId] });
    }
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, groupId }: { questionId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-questions', groupId] });
    }
  });
}

export function useDeleteAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ answerId, groupId }: { answerId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_answers')
        .delete()
        .eq('id', answerId);

      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-questions', groupId] });
    }
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      questionId, 
      answerId, 
      groupId,
      hasLiked 
    }: { 
      questionId?: string; 
      answerId?: string; 
      groupId: string;
      hasLiked: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (hasLiked) {
        // Remove the reaction
        const query = supabase
          .from('group_reactions')
          .delete()
          .eq('user_id', user.id);
        
        if (questionId) {
          const { error } = await query.eq('question_id', questionId);
          if (error) throw error;
        } else if (answerId) {
          const { error } = await query.eq('answer_id', answerId);
          if (error) throw error;
        }
      } else {
        // Add reaction
        const { error } = await supabase
          .from('group_reactions')
          .insert({
            user_id: user.id,
            question_id: questionId || null,
            answer_id: answerId || null,
            reaction_type: 'like'
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-questions', groupId] });
    }
  });
}
