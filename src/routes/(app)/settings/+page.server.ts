import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { profile } = await parent();
	return { profile };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const timezone = formData.get('timezone') as string;

		if (!timezone) {
			return fail(400, { missing: true });
		}

		try {
			Intl.DateTimeFormat(undefined, { timeZone: timezone });
		} catch (e) {
			return fail(400, { error: true, message: 'Invalid timezone' });
		}

		const { error } = await supabase
			.from('profiles')
			.upsert({ id: user!.id, timezone })
			.eq('id', user!.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}

		return { success: true };
	}
};
