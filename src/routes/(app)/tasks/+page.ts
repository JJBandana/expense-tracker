import type { PageLoad } from './$types';
import { cacheTasks, readCachedTasks, readPendingTasks } from '$lib/tasks-cache';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('tasks:list');
	const { supabase, user } = await parent();
	const project = localStorage.getItem('supabase_url') ?? '';
	let pendingTasks: Awaited<ReturnType<typeof readPendingTasks>> = [];
	let pendingError = '';
	try {
		pendingTasks = await readPendingTasks(project, user!.id);
	} catch {
		pendingError = 'Could not read locally saved pending tasks.';
	}

	const { data: tasks, error } = await supabase!
		.from('tasks')
		.select('*')
		.eq('user_id', user!.id)
		.order('created_at', { ascending: false });

	if (!error && tasks) {
		try {
			await cacheTasks(project, user!.id, tasks);
		} catch (cacheError) {
			console.error('Could not cache tasks:', cacheError);
		}
		const pendingIds = new Set(pendingTasks.map((task) => task.id));
		return { tasks: [...pendingTasks, ...tasks.filter((task) => !pendingIds.has(task.id))], pendingTaskIds: [...pendingIds], tasksError: pendingError || null };
	}

	if (!navigator.onLine || (error?.code === '' && /fetch|network/i.test(error.message))) {
		try {
			const cached = await readCachedTasks(project, user!.id);
			if (cached) {
				return {
					tasks: [...pendingTasks, ...cached],
					pendingTaskIds: pendingTasks.map((task) => task.id),
					tasksError: pendingError || 'Showing the last saved copy. Only new tasks can be saved offline.'
				};
			}
		} catch (cacheError) {
			console.error('Could not read cached tasks:', cacheError);
		}
	}
	return { tasks: pendingTasks, pendingTaskIds: pendingTasks.map((task) => task.id), tasksError: pendingError || error?.message || 'Could not load tasks.' };
};
