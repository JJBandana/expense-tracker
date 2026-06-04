import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: accounts } = await supabase
		.from('accounts')
		.select('*')
		.order('name');

	return {
		accounts: accounts ?? []
	};
};
