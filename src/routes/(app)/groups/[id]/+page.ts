import { error, fail, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { supabase, user } = await parent();
	const groupId = params.id;

	const { data: group, error: groupError } = await supabase!
			.from('groups')
		.select('*')
		.eq('id', groupId)
		.single();

	if (groupError || !group) {
		throw error(404, 'Group not found');
	}

	const { data: members, error: membersError } = await supabase!
			.from('group_members')
		.select('*, profiles(email, full_name)')
		.eq('group_id', groupId);
	
	const isMember = members?.some((m) => m.user_id === user!.id);
	if (!isMember) {
		throw error(403, 'You do not have access to this group');
	}

	const isAdmin = members?.some((m) => m.user_id === user!.id && m.role === 'admin');

	const { data: invitations } = await supabase!
			.from('group_invitations')
		.select('*')
		.eq('group_id', groupId)
		.eq('status', 'pending');

	return {
		group,
		members: members ?? [],
		invitations: invitations ?? [],
		isAdmin,
		user
	};
};


