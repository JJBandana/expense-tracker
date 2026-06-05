import { fail, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { supabase } = await parent();
	const { data: account } = await supabase!
			.from('accounts')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!account) {
		redirect(303, '/accounts');
	}

	return { account };
};


