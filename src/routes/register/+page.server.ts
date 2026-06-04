import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) {
		redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	register: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { email, missing: true });
		}

		const { error } = await supabase.auth.signUp({
			email,
			password
		});

		if (error) {
			return fail(400, { email, error: true, message: error.message });
		}

		redirect(303, '/dashboard');
	}
};
