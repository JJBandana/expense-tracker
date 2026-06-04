import { fail, redirect } from '@sveltejs/kit';
import { toDate } from 'date-fns-tz';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [accountsResult, categoriesResult, lastTxResult] = await Promise.all([
		supabase.from('accounts').select('id, name').order('name'),
		supabase.from('categories').select('id, name, type, icon').order('name'),
		supabase.from('transactions').select('account_id, category_id, type').order('created_at', { ascending: false }).limit(1).maybeSingle()
	]);

	return {
		accounts: accountsResult.data ?? [],
		categories: categoriesResult.data ?? [],
		lastTx: lastTxResult.data ?? null
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const account = formData.get('account') as string;
		const destination_account = formData.get('destination_account') as string;
		const category = formData.get('category') as string;
		const amount = formData.get('amount') as string;
		const type = formData.get('type') as string;
		const notes = formData.get('notes') as string;
		const dateStr = formData.get('date') as string;

		if (!account || !amount || !type || !dateStr) {
			return fail(400, { missing: true });
		}
		if (type === 'transfer' && !destination_account) {
			return fail(400, { missing_destination: true });
		}
		if (type !== 'transfer' && !category) {
			return fail(400, { missing_category: true });
		}

		// Fetch user's timezone from profile
		const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user!.id).single();
		const timeZone = profile?.timezone || 'UTC';

		// Parse the local date string into UTC using the selected timezone
		let utcDateString;
		let utcDate;
		try {
			const parsedDateStr = dateStr.length === 16 ? `${dateStr}:00` : dateStr;
			utcDate = toDate(parsedDateStr, { timeZone });
			utcDateString = utcDate.toISOString();
		} catch (e) {
			utcDateString = new Date().toISOString();
		}

		const { error } = await supabase.from('transactions').insert({
			account_id: account,
			destination_account_id: type === 'transfer' ? destination_account : null,
			category_id: type === 'transfer' ? null : category,
			amount: parseFloat(amount),
			type,
			notes: notes || null,
			date: utcDateString,
			user_id: user!.id
		});

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/transactions');
	}
};
