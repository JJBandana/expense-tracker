import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: transactions } = await supabase
		.from('transactions')
		.select('*, accounts(name), categories(name, icon)')
		.order('date', { ascending: false });

	return {
		transactions: transactions ?? []
	};
};
