ALTER TABLE public.profiles ADD COLUMN email TEXT;
ALTER TABLE public.profiles ADD COLUMN full_name TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure existing profiles are updated if possible (needs superuser, but in Supabase, migrations run as postgres)
UPDATE public.profiles p
SET email = u.email,
    full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.id = u.id;

-- Make profiles readable by any authenticated user so we can display member names
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
