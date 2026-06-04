import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const type = formData.get('type') as string;
		const icon = formData.get('icon') as string;
		const budget = formData.get('budget') as string;

		if (!name || !type) {
			return fail(400, { missing: true });
		}

		const { error } = await supabase.from('categories').insert({
			name,
			type,
			icon: icon || '📝',
			monthly_budget: budget ? parseFloat(budget) : null,
			user_id: user!.id
		});

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/categories');
	}
};
