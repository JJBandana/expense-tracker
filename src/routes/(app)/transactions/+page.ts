import type { PageLoad } from './$types';
import { toDate } from 'date-fns-tz';

export const load: PageLoad = async ({ parent, url }) => {
	const { supabase } = await parent();
	const { profile } = await parent();
	const timeZone = profile?.timezone || 'UTC';

	const searchQuery = url.searchParams.get('q') || '';
	
	let selectedMonthStr = url.searchParams.get('month');
	if (!selectedMonthStr) {
		const now = new Date();
		const formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' });
		const parts = formatter.formatToParts(now);
		const year = parts.find((p) => p.type === 'year')?.value;
		const month = parts.find((p) => p.type === 'month')?.value;
		selectedMonthStr = `${year}-${month}`;
	}

	const [year, month] = selectedMonthStr.split('-');
	const localStartStr = `${year}-${month}-01T00:00:00`;
	
	const nextMonthDate = new Date(Number(year), Number(month), 1);
	const nextYear = nextMonthDate.getFullYear();
	const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
	const localEndStr = `${nextYear}-${nextMonth}-01T00:00:00`;

	const utcStart = toDate(localStartStr, { timeZone }).toISOString();
	const utcEnd = toDate(localEndStr, { timeZone }).toISOString();

	const { data: transactions } = await supabase!
			.from('transactions')
		.select('*, accounts!transactions_account_id_fkey(name), categories(name, icon), destination_account:accounts!transactions_destination_account_id_fkey(name)')
		.gte('date', utcStart)
		.lt('date', utcEnd)
		.order('date', { ascending: false });

	let filteredTransactions = transactions ?? [];

	if (searchQuery) {
		const lowerQ = searchQuery.toLowerCase();
		filteredTransactions = filteredTransactions.filter(tx => 
			tx.notes?.toLowerCase().includes(lowerQ) ||
			tx.categories?.name?.toLowerCase().includes(lowerQ) ||
			tx.accounts?.name?.toLowerCase().includes(lowerQ) ||
			tx.amount.toString().includes(lowerQ)
		);
	}

	return {
		transactions: filteredTransactions,
		selectedMonthStr,
		searchQuery
	};
};
