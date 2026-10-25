import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase, user } = await parent();

	const { data: tasks, error } = await supabase!
		.from('tasks')
		.select('*')
		.eq('user_id', user!.id)
		.order('created_at', { ascending: false });

	return {
		tasks: tasks ?? [],
		tasksError: error?.message ?? null
	};
};
