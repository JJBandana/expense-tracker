import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { supabase, user } = await parent();

	if (!user) {
		redirect(303, '/login');
	}

	const { data: profile } = await supabase!
			.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	return {
		profile: profile || { timezone: 'UTC' }
	};
};
