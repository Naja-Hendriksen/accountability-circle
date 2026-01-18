-- Create reactions table for questions and answers
CREATE TABLE public.group_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID REFERENCES public.group_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.group_answers(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure user can only react once per item
  CONSTRAINT unique_question_reaction UNIQUE (user_id, question_id),
  CONSTRAINT unique_answer_reaction UNIQUE (user_id, answer_id),
  -- Ensure either question_id or answer_id is set, not both
  CONSTRAINT reaction_target_check CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.group_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on questions/answers they can see
CREATE POLICY "Group members can view reactions on questions"
  ON public.group_reactions
  FOR SELECT
  USING (
    (question_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_questions q
      WHERE q.id = question_id AND is_group_member(q.group_id, auth.uid())
    ))
    OR
    (answer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_answers a
      JOIN public.group_questions q ON q.id = a.question_id
      WHERE a.id = answer_id AND is_group_member(q.group_id, auth.uid())
    ))
  );

-- Users can add reactions to items they can see
CREATE POLICY "Group members can add reactions"
  ON public.group_reactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      (question_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.group_questions q
        WHERE q.id = question_id AND is_group_member(q.group_id, auth.uid())
      ))
      OR
      (answer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.group_answers a
        JOIN public.group_questions q ON q.id = a.question_id
        WHERE a.id = answer_id AND is_group_member(q.group_id, auth.uid())
      ))
    )
  );

-- Users can only delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.group_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_group_reactions_question ON public.group_reactions(question_id) WHERE question_id IS NOT NULL;
CREATE INDEX idx_group_reactions_answer ON public.group_reactions(answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX idx_group_reactions_user ON public.group_reactions(user_id);