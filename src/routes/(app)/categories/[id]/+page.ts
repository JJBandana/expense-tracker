import { fail, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { supabase } = await parent();
	const { data: category } = await supabase!
			.from('categories')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!category) {
		redirect(303, '/categories');
	}

	return { category };
};


