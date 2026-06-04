import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: accounts } = await supabase.from('accounts').select('balance');
	const totalBalance = (accounts ?? []).reduce((sum, account) => sum + Number(account.balance), 0);
	return { totalBalance };
};

export const actions: Actions = {
	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/login');
	}
};
