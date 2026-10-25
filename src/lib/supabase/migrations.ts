/**
 * Consolidated idempotent SQL schema for Expense Tracker.
 * Safe to execute on empty or existing Supabase projects via the Management API.
 */
export const INITIAL_DATABASE_MIGRATION_SQL = `
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'other')),
    balance NUMERIC DEFAULT 0.00 NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    monthly_budget NUMERIC DEFAULT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    notes TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

-- 7. Group Invitations Table
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 200),
    notes TEXT CHECK (char_length(notes) <= 2000),
    due_date DATE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_user_id_due_date_idx ON public.tasks (user_id, due_date);

-- Explicit PostgREST foreign key constraints for profiles joins (if not already existing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_user_id_profile_fkey') THEN
        ALTER TABLE public.group_members ADD CONSTRAINT group_members_user_id_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_created_by_profile_fkey') THEN
        ALTER TABLE public.groups ADD CONSTRAINT groups_created_by_profile_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_invitations_invited_by_profile_fkey') THEN
        ALTER TABLE public.group_invitations ADD CONSTRAINT group_invitations_invited_by_profile_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Helper updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Balance Trigger Function
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
        END IF;
        
        IF NEW.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle New User Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Group Creator as Admin Function
CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers (Drop if exists then create)
DROP TRIGGER IF EXISTS update_accounts_modtime ON public.accounts;
CREATE TRIGGER update_accounts_modtime BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_modtime ON public.transactions;
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_account_balance();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created AFTER INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_admin();

DROP TRIGGER IF EXISTS update_tasks_modtime ON public.tasks;
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Idempotent RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Accounts
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
CREATE POLICY "Users can insert their own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Categories
DROP POLICY IF EXISTS "Users can view default categories and their own" ON public.categories;
CREATE POLICY "Users can view default categories and their own" ON public.categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
CREATE POLICY "Users can insert their own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of" ON public.groups FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert groups" ON public.groups;
CREATE POLICY "Users can insert groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
CREATE POLICY "Admins can update groups" ON public.groups FOR UPDATE USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;
CREATE POLICY "Admins can delete groups" ON public.groups FOR DELETE USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'));

-- Group Members
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can join a group" ON public.group_members;
CREATE POLICY "Users can join a group" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage members" ON public.group_members;
CREATE POLICY "Admins can manage members" ON public.group_members FOR UPDATE USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

DROP POLICY IF EXISTS "Users can leave or admins can remove" ON public.group_members;
CREATE POLICY "Users can leave or admins can remove" ON public.group_members FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

-- Group Invitations
DROP POLICY IF EXISTS "Users can view invitations for their groups or email" ON public.group_invitations;
CREATE POLICY "Users can view invitations for their groups or email" ON public.group_invitations FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()) OR email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Admins can create invitations" ON public.group_invitations;
CREATE POLICY "Admins can create invitations" ON public.group_invitations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

DROP POLICY IF EXISTS "Users can update invitations sent to them" ON public.group_invitations;
CREATE POLICY "Users can update invitations sent to them" ON public.group_invitations FOR UPDATE USING (email = (auth.jwt() ->> 'email') OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.group_invitations;
CREATE POLICY "Admins can delete invitations" ON public.group_invitations FOR DELETE USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

-- Tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Permissions for Supabase API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
`;
