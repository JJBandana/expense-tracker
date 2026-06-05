import type { PageLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageLoad = async ({ parent }) => {
	const { supabase, user } = await parent();
	const email = user!.email ?? '';

	const [groupsResult, invitationsResult] = await Promise.all([
		supabase!
			.from('groups')
			.select('*, group_members!inner(role)')
			.order('name'),
		supabase!
			.from('group_invitations')
			.select('*, groups(name)')
			.eq('email', email)
			.eq('status', 'pending')
	]);

	return {
		groups: groupsResult.data ?? [],
		invitations: invitationsResult.data ?? []
	};
};


