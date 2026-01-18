-- Create group_questions table
CREATE TABLE public.group_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_answers table (threaded under questions)
CREATE TABLE public.group_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.group_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_questions
-- Group members can view questions in their groups
CREATE POLICY "Group members can view questions"
  ON public.group_questions
  FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Group members can insert questions in their groups
CREATE POLICY "Group members can create questions"
  ON public.group_questions
  FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()) AND auth.uid() = user_id);

-- Authors can update their own questions
CREATE POLICY "Authors can update their questions"
  ON public.group_questions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Authors or admins can delete questions
CREATE POLICY "Authors or admins can delete questions"
  ON public.group_questions
  FOR DELETE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- RLS Policies for group_answers
-- Users can view answers if they can view the parent question's group
CREATE POLICY "Group members can view answers"
  ON public.group_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_questions q
      WHERE q.id = question_id AND is_group_member(q.group_id, auth.uid())
    )
  );

-- Users can insert answers if they're members of the question's group
CREATE POLICY "Group members can create answers"
  ON public.group_answers
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.group_questions q
      WHERE q.id = question_id AND is_group_member(q.group_id, auth.uid())
    )
  );

-- Authors can update their own answers
CREATE POLICY "Authors can update their answers"
  ON public.group_answers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Authors or admins can delete answers
CREATE POLICY "Authors or admins can delete answers"
  ON public.group_answers
  FOR DELETE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_group_questions_group_id ON public.group_questions(group_id);
CREATE INDEX idx_group_questions_created_at ON public.group_questions(created_at DESC);
CREATE INDEX idx_group_answers_question_id ON public.group_answers(question_id);
CREATE INDEX idx_group_answers_created_at ON public.group_answers(created_at DESC);

-- Add updated_at trigger for group_questions
CREATE TRIGGER update_group_questions_updated_at
  BEFORE UPDATE ON public.group_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for group_answers
CREATE TRIGGER update_group_answers_updated_at
  BEFORE UPDATE ON public.group_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();