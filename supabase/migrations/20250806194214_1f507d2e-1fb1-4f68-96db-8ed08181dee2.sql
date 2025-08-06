-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table for collaborative workspaces
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project collaborators table
CREATE TABLE public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create files table for project files
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  content TEXT DEFAULT '',
  file_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, filename)
);

-- Create real-time editing sessions table
CREATE TABLE public.editing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cursor_position INTEGER DEFAULT 0,
  selection_start INTEGER DEFAULT 0,
  selection_end INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editing_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for projects
CREATE POLICY "Users can view projects they collaborate on" ON public.projects FOR SELECT USING (
  id IN (
    SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
  ) OR owner_id = auth.uid()
);
CREATE POLICY "Project owners can update projects" ON public.projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can delete projects" ON public.projects FOR DELETE USING (owner_id = auth.uid());

-- Create RLS policies for project collaborators
CREATE POLICY "Users can view collaborators of their projects" ON public.project_collaborators FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
  ) OR project_id IN (
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);
CREATE POLICY "Project owners can manage collaborators" ON public.project_collaborators FOR ALL USING (
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can leave projects" ON public.project_collaborators FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for files
CREATE POLICY "Users can view files in their projects" ON public.files FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
  ) OR project_id IN (
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);
CREATE POLICY "Editors can modify files" ON public.files FOR ALL USING (
  project_id IN (
    SELECT pc.project_id FROM public.project_collaborators pc 
    WHERE pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')
  ) OR project_id IN (
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);

-- Create RLS policies for editing sessions
CREATE POLICY "Users can view editing sessions in their projects" ON public.editing_sessions FOR SELECT USING (
  file_id IN (
    SELECT f.id FROM public.files f
    JOIN public.project_collaborators pc ON f.project_id = pc.project_id
    WHERE pc.user_id = auth.uid()
  ) OR file_id IN (
    SELECT f.id FROM public.files f
    JOIN public.projects p ON f.project_id = p.id
    WHERE p.owner_id = auth.uid()
  )
);
CREATE POLICY "Users can manage own editing sessions" ON public.editing_sessions FOR ALL USING (user_id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaboration
ALTER TABLE public.files REPLICA IDENTITY FULL;
ALTER TABLE public.editing_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.project_collaborators REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.editing_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_collaborators;