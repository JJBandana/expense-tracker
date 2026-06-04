import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	const email = user!.email ?? '';

	const [groupsResult, invitationsResult] = await Promise.all([
		supabase
			.from('groups')
			.select('*, group_members!inner(role)')
			.order('name'),
		supabase
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

export const actions: Actions = {
	accept: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const invitationId = formData.get('invitation_id') as string;
		if (!invitationId) return fail(400, { missing: true });

		const { data: inv } = await supabase.from('group_invitations').select('*').eq('id', invitationId).single();
		if (!inv || inv.status !== 'pending' || inv.email !== user!.email) {
			return fail(403, { error: 'Invalid invitation' });
		}

		await supabase.from('group_invitations').update({ status: 'accepted' }).eq('id', invitationId);

		await supabase.from('group_members').insert({
			group_id: inv.group_id,
			user_id: user!.id,
			role: inv.role
		});

		return { success: true };
	},
	decline: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const invitationId = formData.get('invitation_id') as string;
		if (!invitationId) return fail(400, { missing: true });

		const { data: inv } = await supabase.from('group_invitations').select('*').eq('id', invitationId).single();
		if (!inv || inv.status !== 'pending' || inv.email !== user!.email) {
			return fail(403, { error: 'Invalid invitation' });
		}

		await supabase.from('group_invitations').update({ status: 'declined' }).eq('id', invitationId);

		return { success: true };
	}
};
