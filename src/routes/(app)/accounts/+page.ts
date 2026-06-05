import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();
	const { data: accounts } = await supabase!
			.from('accounts')
		.select('*')
		.order('name');

	return {
		accounts: accounts ?? []
	};
};
