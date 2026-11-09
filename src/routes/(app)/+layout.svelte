<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidate } from '$app/navigation';
	import { acknowledgePendingTask, readPendingTasks } from '$lib/tasks-cache';
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { LayoutDashboard, ArrowRightLeft, ListTodo, LogOut, Settings } from '@lucide/svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData, children: any } = $props();
	let syncing = $state(false);
	let syncError = $state('');

	async function syncPendingTasks() {
		if (syncing || !navigator.onLine || !data.supabase || !data.user) return;
		const supabase = data.supabase;
		const userId = data.user.id;
		const project = localStorage.getItem('supabase_url') ?? '';
		syncing = true;
		syncError = '';
		try {
			const pending = await readPendingTasks(project, userId);
			for (const task of pending) {
				const { error } = await supabase.from('tasks').upsert(task, {
					onConflict: 'id', ignoreDuplicates: true
				});
				if (error) throw error;
				const { data: saved, error: readError } = await supabase.from('tasks')
					.select('*').eq('id', task.id).eq('user_id', userId).single();
				if (readError) throw readError;
				if (saved.title !== task.title || saved.notes !== task.notes || saved.completed !== task.completed ||
					saved.priority !== task.priority || saved.due_date !== task.due_date ||
					Date.parse(saved.created_at) !== Date.parse(task.created_at)) {
					throw new Error('The server has a different version of this task.');
				}
				await acknowledgePendingTask(project, userId, saved);
			}
			if (pending.length) await invalidate('tasks:list');
		} catch (error) {
			console.error('Task synchronization failed:', error);
			syncError = 'Some tasks could not be synchronized. They remain saved on this device.';
			await invalidate('tasks:list');
		} finally {
			syncing = false;
		}
	}

	$effect(() => {
		// Re-run for the signed-in user, including after returning to the app.
		if (!data.user || !data.supabase) return;
		untrack(() => void syncPendingTasks());
		window.addEventListener('task-queued', syncPendingTasks);
		return () => window.removeEventListener('task-queued', syncPendingTasks);
	});

	const handleLogout = async () => {
		await data.supabase!.auth.signOut();
		goto('/login');
	};

	const navItems = [
		{ name: 'Overview', href: '/', icon: LayoutDashboard },
		{ name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
		{ name: 'Tasks', href: '/tasks', icon: ListTodo },
		{ name: 'Settings', href: '/settings', icon: Settings }
	];
</script>

<svelte:window ononline={syncPendingTasks} onfocus={syncPendingTasks} />

<div class="flex min-h-screen w-full flex-col bg-zinc-50 pb-16 md:pb-0 dark:bg-zinc-950">
	<!-- Desktop Header Navigation -->
	<header
		class="sticky top-0 z-10 hidden h-16 items-center gap-4 border-b bg-background px-4 md:flex md:px-6"
	>
		<nav
			class="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
			<a href="/" class="flex items-center gap-2 text-lg font-semibold md:text-base">
				<span class="sr-only">Expense Tracker</span>
				🪙
			</a>
			{#each navItems as item}
				<a
					href={item.href}
					class="transition-colors hover:text-foreground {page.url.pathname === item.href
						? 'font-semibold text-foreground'
						: 'text-muted-foreground'}"
				>
					{item.name}
				</a>
			{/each}
		</nav>
		<div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
			<Button variant="outline" size="sm" type="button" class="ml-auto" onclick={handleLogout}>Log out</Button>
		</div>
	</header>

	<!-- Mobile Top Header -->
	<header
		class="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden"
	>
		<div class="flex items-center gap-2 font-semibold">🪙 Expense Tracker</div>
		<button type="button" class="p-2 text-muted-foreground hover:text-foreground" onclick={handleLogout}>
			<LogOut class="h-5 w-5" />
			<span class="sr-only">Log out</span>
		</button>
	</header>

	<main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
		{#if syncing}<p role="status" class="text-sm">Synchronizing locally saved tasks…</p>{/if}
		{#if syncError}
			<div role="alert" class="rounded-lg border p-3 text-sm">{syncError} <button type="button" class="underline" onclick={syncPendingTasks}>Retry</button></div>
		{/if}
		{@render children()}
	</main>

	<!-- Mobile Bottom Navigation -->
	<nav class="fixed right-0 bottom-0 left-0 z-50 flex h-16 border-t bg-background md:hidden">
		{#each navItems as item}
			{@const isActive = page.url.pathname === item.href}
			<a
				href={item.href}
				class="flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors {isActive
					? 'font-medium text-primary'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<item.icon class="h-5 w-5 {isActive ? 'stroke-[2.5px]' : ''}" />
				<span>{item.name}</span>
			</a>
		{/each}
	</nav>
</div>
