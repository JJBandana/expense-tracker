import { fail, redirect } from '@sveltejs/kit';
import { toDate } from 'date-fns-tz';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();
	const [accountsResult, categoriesResult, lastTxResult] = await Promise.all([
		supabase!.from('accounts').select('id, name').order('name'),
		supabase!.from('categories').select('id, name, type, icon').order('name'),
		supabase!.from('transactions').select('account_id, category_id, type').order('created_at', { ascending: false }).limit(1).maybeSingle()
	]);

	return {
		accounts: accountsResult.data ?? [],
		categories: categoriesResult.data ?? [],
		lastTx: lastTxResult.data ?? null
	};
};


