import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name) {
			return fail(400, { missing: true });
		}

		const { data, error } = await supabase
			.from('groups')
			.insert({
				name,
				created_by: user!.id
			})
			.select()
			.single();

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		redirect(303, `/groups/${data.id}`);
	}
};
