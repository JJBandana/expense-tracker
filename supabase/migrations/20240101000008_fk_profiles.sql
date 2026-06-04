ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_user_id_profile_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.groups 
ADD CONSTRAINT groups_created_by_profile_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.group_invitations 
ADD CONSTRAINT group_invitations_invited_by_profile_fkey 
FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
