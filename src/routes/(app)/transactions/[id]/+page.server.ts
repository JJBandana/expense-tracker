import { fail, redirect } from '@sveltejs/kit';
import { toDate } from 'date-fns-tz';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const [transactionResult, accountsResult, categoriesResult] = await Promise.all([
		supabase.from('transactions').select('*').eq('id', params.id).single(),
		supabase.from('accounts').select('id, name').order('name'),
		supabase.from('categories').select('id, name, type, icon').order('name')
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

export const actions: Actions = {
	update: async ({ request, params, locals: { supabase, user } }) => {
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

		const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user!.id).single();
		const timeZone = profile?.timezone || 'UTC';

		let utcDateString;
		try {
			const parsedDateStr = dateStr.length === 16 ? `${dateStr}:00` : dateStr;
			const utcDate = toDate(parsedDateStr, { timeZone });
			utcDateString = utcDate.toISOString();
		} catch (e) {
			utcDateString = new Date().toISOString();
		}

		const { error } = await supabase
			.from('transactions')
			.update({
				amount,
				type,
				date: utcDateString,
				account_id,
				category_id: category_id || null,
				notes: notes || null
			})
			.eq('id', params.id)
			.eq('user_id', user!.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/transactions');
	},
	delete: async ({ params, locals: { supabase, user } }) => {
		const { error } = await supabase
			.from('transactions')
			.delete()
			.eq('id', params.id)
			.eq('user_id', user!.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/transactions');
	}
};
