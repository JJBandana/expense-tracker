import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: account } = await supabase
		.from('accounts')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!account) {
		redirect(303, '/accounts');
	}

	return { account };
};

export const actions: Actions = {
	update: async ({ request, params, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const type = formData.get('type') as string;
		const balance = parseFloat(formData.get('balance') as string) || 0;

		if (!name || !type) {
			return fail(400, { missing: true });
		}

		const { error } = await supabase
			.from('accounts')
			.update({ name, type, balance })
			.eq('id', params.id)
			.eq('user_id', user!.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/accounts');
	},
	delete: async ({ params, locals: { supabase, user } }) => {
		const { error } = await supabase
			.from('accounts')
			.delete()
			.eq('id', params.id)
			.eq('user_id', user!.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/accounts');
	}
};
