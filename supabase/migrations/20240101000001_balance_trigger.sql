CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Revert old amount
        IF OLD.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        END IF;
        
        -- Apply new amount
        IF NEW.type = 'expense' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_change
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();
