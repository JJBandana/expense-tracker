import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: category } = await supabase
		.from('categories')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!category) {
		redirect(303, '/categories');
	}

	return { category };
};

export const actions: Actions = {
	update: async ({ request, params, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const icon = formData.get('icon') as string;
		const type = formData.get('type') as string;

		if (!name || !type) {
			return fail(400, { missing: true });
		}

		const { error } = await supabase
			.from('categories')
			.update({ name, icon: icon || null, type })
			.eq('id', params.id)
			.eq('user_id', user!.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/categories');
	},
	delete: async ({ params, locals: { supabase, user } }) => {
		const { error } = await supabase
			.from('categories')
			.delete()
			.eq('id', params.id)
			.eq('user_id', user!.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, '/categories');
	}
};
