-- Accounts Table
CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'other')),
    balance numeric DEFAULT 0.00 NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Categories Table
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- null means default system category
    name text NOT NULL,
    icon text,
    parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Transactions Table
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    amount numeric NOT NULL,
    type text NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    notes text,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Accounts RLS
CREATE POLICY "Users can view their own accounts"
    ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
    ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON public.accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON public.accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Categories RLS
CREATE POLICY "Users can view default categories and their own"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions RLS
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);
    
-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_modtime
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
