import type { PageLoad } from './$types';
import { toDate } from 'date-fns-tz';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();
	const { profile } = await parent();
	const timeZone = profile?.timezone || 'UTC';

	const now = new Date();
	const formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' });
	const parts = formatter.formatToParts(now);
	const year = parts.find((p) => p.type === 'year')?.value;
	const month = parts.find((p) => p.type === 'month')?.value;
	const localStartStr = `${year}-${month}-01T00:00:00`;
	const utcStart = toDate(localStartStr, { timeZone }).toISOString();

	const [categoriesResult, transactionsResult] = await Promise.all([
		supabase!.from('categories').select('*').order('name'),
		supabase!.from('transactions').select('category_id, amount, type').gte('date', utcStart).eq('type', 'expense')
	]);

	const categories = categoriesResult.data ?? [];
	const transactions = transactionsResult.data ?? [];

	const expenseSums: Record<string, number> = {};
	for (const tx of transactions) {
		const cid = tx.category_id || 'uncategorized';
		expenseSums[cid] = (expenseSums[cid] || 0) + Number(tx.amount);
	}

	return {
		categories: categories.map(cat => ({
			...cat,
			current_month_spent: expenseSums[cat.id] || 0
		}))
	};
};
