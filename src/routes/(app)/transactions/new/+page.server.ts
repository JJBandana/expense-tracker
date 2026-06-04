import { fail, redirect } from '@sveltejs/kit';
import { toDate } from 'date-fns-tz';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [accountsResult, categoriesResult] = await Promise.all([
		supabase.from('accounts').select('id, name').order('name'),
		supabase.from('categories').select('id, name, type, icon').order('name')
	]);

	return {
		accounts: accountsResult.data ?? [],
		categories: categoriesResult.data ?? []
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const amount = parseFloat(formData.get('amount') as string);
		const type = formData.get('type') as string;
		const dateStr = formData.get('date') as string;
		const account_id = formData.get('account_id') as string;
		const category_id = formData.get('category_id') as string;
		const notes = formData.get('notes') as string;

		if (!amount || !type || !dateStr || !account_id) {
			return fail(400, { missing: true });
		}

		// Fetch user's timezone from profile
		const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user!.id).single();
		const timeZone = profile?.timezone || 'UTC';

		// Parse the local date string into UTC using the selected timezone
		let utcDateString;
		try {
			const parsedDateStr = dateStr.length === 16 ? `${dateStr}:00` : dateStr;
			const utcDate = toDate(parsedDateStr, { timeZone });
			utcDateString = utcDate.toISOString();
		} catch (e) {
			utcDateString = new Date().toISOString();
		}

		const { error } = await supabase.from('transactions').insert({
			amount,
			type,
			date: utcDateString,
			account_id,
			category_id: category_id || null,
			notes: notes || null,
			user_id: user!.id
		});

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/transactions');
	}
};
