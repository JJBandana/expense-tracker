import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
	const groupId = params.id;

	const { data: group, error: groupError } = await supabase
		.from('groups')
		.select('*')
		.eq('id', groupId)
		.single();

	if (groupError || !group) {
		throw error(404, 'Group not found');
	}

	const { data: members, error: membersError } = await supabase
		.from('group_members')
		.select('*, profiles(email, full_name)')
		.eq('group_id', groupId);
	
	const isMember = members?.some((m) => m.user_id === user!.id);
	if (!isMember) {
		throw error(403, 'You do not have access to this group');
	}

	const isAdmin = members?.some((m) => m.user_id === user!.id && m.role === 'admin');

	const { data: invitations } = await supabase
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

export const actions: Actions = {
	invite: async ({ request, params, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const role = formData.get('role') as string;

		if (!email || !role) {
			return fail(400, { missing: true });
		}

		const { error } = await supabase.from('group_invitations').insert({
			group_id: params.id,
			email,
			role,
			invited_by: user!.id
		});

		if (error) {
			return fail(400, { error: true, message: error.message });
		}
		return { success: true };
	},
	removeMember: async ({ request, params, locals: { supabase } }) => {
		const formData = await request.formData();
		const userId = formData.get('user_id') as string;

		if (!userId) return fail(400, { missing: true });

		const { error } = await supabase
			.from('group_members')
			.delete()
			.eq('group_id', params.id)
			.eq('user_id', userId);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}
		return { success: true };
	},
	revokeInvite: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const invitationId = formData.get('invitation_id') as string;

		if (!invitationId) return fail(400, { missing: true });

		const { error } = await supabase
			.from('group_invitations')
			.delete()
			.eq('id', invitationId);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}
		return { success: true };
	},
	updateRole: async ({ request, params, locals: { supabase } }) => {
		const formData = await request.formData();
		const userId = formData.get('user_id') as string;
		const role = formData.get('role') as string;

		if (!userId || !role) return fail(400, { missing: true });

		const { error } = await supabase
			.from('group_members')
			.update({ role })
			.eq('group_id', params.id)
			.eq('user_id', userId);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}
		return { success: true };
	},
	updateGroup: async ({ request, params, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name) return fail(400, { missing: true });

		const { error } = await supabase
			.from('groups')
			.update({ name })
			.eq('id', params.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}
		return { success: true };
	},
	deleteGroup: async ({ params, locals: { supabase } }) => {
		const { error } = await supabase
			.from('groups')
			.delete()
			.eq('id', params.id);

		if (error) {
			return fail(400, { error: true, message: error.message });
		}
		
		redirect(303, '/groups');
	}
};
