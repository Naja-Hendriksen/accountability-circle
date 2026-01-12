-- Create profiles table for member information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  growth_goal TEXT DEFAULT '',
  monthly_milestones TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_entries table for Mini-Moves, Obstacles, Wins
CREATE TABLE public.weekly_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  obstacles TEXT DEFAULT '',
  wins TEXT DEFAULT '',
  self_care TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create mini_moves table for individual trackable tasks
CREATE TABLE public.mini_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_entry_id UUID REFERENCES public.weekly_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table for accountability groups
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members junction table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create admin_users table to track facilitators
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view profiles of members in their groups, update own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view group members profiles" ON public.profiles FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id
  ));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weekly entries: Users can manage own, view group members
CREATE POLICY "Users can manage own weekly entries" ON public.weekly_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view group members weekly entries" ON public.weekly_entries FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = weekly_entries.user_id
  ));

-- Mini moves: Users can manage own, view group members
CREATE POLICY "Users can manage own mini moves" ON public.mini_moves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view group members mini moves" ON public.mini_moves FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = mini_moves.user_id
  ));

-- Groups: Members can view groups they belong to
CREATE POLICY "Users can view own groups" ON public.groups FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid()));

-- Group members: Users can view members of their groups
CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all weekly entries" ON public.weekly_entries FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all mini moves" ON public.mini_moves FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all groups" ON public.groups FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all group members" ON public.group_members FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view admin users" ON public.admin_users FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_entries_updated_at BEFORE UPDATE ON public.weekly_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mini_moves_updated_at BEFORE UPDATE ON public.mini_moves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();