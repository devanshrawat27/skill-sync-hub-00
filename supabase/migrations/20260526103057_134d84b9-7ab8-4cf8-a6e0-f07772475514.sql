-- Notify project creator on join request
CREATE OR REPLACE FUNCTION public.notify_project_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_title TEXT;
  project_creator_id UUID;
  sender_name TEXT;
BEGIN
  SELECT title, creator_id INTO project_title, project_creator_id 
  FROM public.projects WHERE id = NEW.project_id;
  SELECT name INTO sender_name FROM public.profiles WHERE user_id = NEW.user_id;
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_creator_id,
      'project_request',
      'New Project Request',
      COALESCE(sender_name, 'A student') || ' requested to join your project "' || project_title || '"',
      '/project/' || NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_project_request_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_title TEXT;
BEGIN
  SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'project_accepted',
      'Project Request Accepted 🎉',
      'Your request to join the project "' || project_title || '" has been accepted!',
      '/project/' || NEW.project_id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'project_rejected',
      'Project Request Rejected',
      'Your request to join the project "' || project_title || '" was not accepted.',
      '/projects'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_join_request ON public.project_members;
CREATE TRIGGER on_project_join_request
  AFTER INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_project_join_request();

DROP TRIGGER IF EXISTS on_project_request_status_update ON public.project_members;
CREATE TRIGGER on_project_request_status_update
  AFTER UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_project_request_status_update();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'project_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.project_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  meeting_link text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_collaborator(proj_id uuid, usr_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects WHERE id = proj_id AND creator_id = usr_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = proj_id AND user_id = usr_id AND status = 'accepted'
  );
END;
$$;

CREATE POLICY "Collaborators can read messages" ON public.project_messages
  FOR SELECT USING (public.is_project_collaborator(project_id, auth.uid()));
CREATE POLICY "Collaborators can post messages" ON public.project_messages
  FOR INSERT WITH CHECK (
    public.is_project_collaborator(project_id, auth.uid()) AND auth.uid() = user_id
  );

CREATE POLICY "Collaborators can read meetings" ON public.project_meetings
  FOR SELECT USING (public.is_project_collaborator(project_id, auth.uid()));
CREATE POLICY "Collaborators can schedule meetings" ON public.project_meetings
  FOR INSERT WITH CHECK (
    public.is_project_collaborator(project_id, auth.uid()) AND auth.uid() = created_by
  );
CREATE POLICY "Collaborators can delete meetings" ON public.project_meetings
  FOR DELETE USING (
    public.is_project_collaborator(project_id, auth.uid()) 
    AND (
      auth.uid() = created_by 
      OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND creator_id = auth.uid())
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_meetings;