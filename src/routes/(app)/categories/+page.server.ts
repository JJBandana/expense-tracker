import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: categories } = await supabase
		.from('categories')
		.select('*')
		.order('name');

	return {
		categories: categories ?? []
	};
};
