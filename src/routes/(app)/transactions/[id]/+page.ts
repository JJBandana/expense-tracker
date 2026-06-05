import { fail, redirect } from '@sveltejs/kit';
import { toDate } from 'date-fns-tz';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { supabase } = await parent();
	const [transactionResult, accountsResult, categoriesResult] = await Promise.all([
		supabase!.from('transactions').select('*').eq('id', params.id).single(),
		supabase!.from('accounts').select('id, name').order('name'),
		supabase!.from('categories').select('id, name, type, icon').order('name')
	]);

	if (!transactionResult.data) {
		redirect(303, '/transactions');
	}

	return {
		transaction: transactionResult.data,
		accounts: accountsResult.data ?? [],
		categories: categoriesResult.data ?? []
	};
};


