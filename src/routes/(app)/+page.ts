import type { PageLoad } from './$types';
import { toDate } from 'date-fns-tz';

export const load: PageLoad = async ({ parent }) => {
	const { supabase, profile } = await parent();
	const timeZone = profile?.timezone || 'UTC';

	const now = new Date();
	const formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
	const parts = formatter.formatToParts(now);
	const year = parts.find((p) => p.type === 'year')?.value;
	const month = parts.find((p) => p.type === 'month')?.value;
	
	const localStartStr = `${year}-${month}-01T00:00:00`;
	const utcStartOfMonth = toDate(localStartStr, { timeZone }).toISOString();

	const [accountsResult, transactionsResult] = await Promise.all([
		supabase!.from('accounts').select('balance'),
		supabase!
			.from('transactions')
			.select('*, categories(name, icon, type), accounts!transactions_account_id_fkey(name), destination_account:accounts!transactions_destination_account_id_fkey(name)')
			.gte('date', utcStartOfMonth)
			.order('date', { ascending: false })
	]);

	const accounts = accountsResult.data ?? [];
	const transactions = transactionsResult.data ?? [];

	const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

	let monthlyIncome = 0;
	let monthlyExpense = 0;
	const categoryExpenses: Record<string, { name: string; amount: number; icon: string }> = {};

	transactions.forEach((tx) => {
		if (tx.type === 'income') {
			monthlyIncome += Number(tx.amount);
		} else if (tx.type === 'expense') {
			monthlyExpense += Number(tx.amount);
			
			const catId = tx.category_id || 'uncategorized';
			if (!categoryExpenses[catId]) {
				categoryExpenses[catId] = {
					name: tx.categories?.name || 'Uncategorized',
					amount: 0,
					icon: tx.categories?.icon || '📝'
				};
			}
			categoryExpenses[catId].amount += Number(tx.amount);
		}
	});

	const topCategories = Object.values(categoryExpenses)
		.sort((a, b) => b.amount - a.amount)
		.slice(0, 5);

	const recentTransactions = transactions.slice(0, 5);

	return { 
		totalBalance, 
		monthlyIncome, 
		monthlyExpense, 
		recentTransactions,
		topCategories
	};
};
