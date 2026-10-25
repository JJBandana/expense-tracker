<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { ChevronDown, Plus } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade, slide } from 'svelte/transition';
	import type { Database } from '$lib/database.types';
	import type { PageData } from './$types';

	type Task = Database['public']['Tables']['tasks']['Row'];
	type Filter = 'pending' | 'completed' | 'all';

	const priorities: Record<string, { label: string; dot: string; badge: string }> = {
		high: { label: 'High', dot: 'bg-destructive', badge: 'border-destructive/30 text-destructive' },
		medium: { label: 'Medium', dot: 'bg-amber-500', badge: 'border-amber-500/30 text-amber-600' },
		low: { label: 'Low', dot: 'bg-muted-foreground/50', badge: 'text-muted-foreground' }
	};
	const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

	let { data }: { data: PageData } = $props();

	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const listDuration = reduceMotion ? 0 : 180;

	let tasks = $state<Task[]>(untrack(() => data.tasks));
	let errorMsg = $state(untrack(() => data.tasksError ?? ''));
	let filter = $state<Filter>('pending');
	let sort = $state<'due' | 'priority'>('due');

	let newTitle = $state('');
	let adding = $state(false);

	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let draft = $state({ title: '', notes: '', dueDate: '', priority: 'medium' });

	const timeZone = $derived(data.profile?.timezone || 'UTC');
	const todayStr = $derived(
		new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date())
	);

	const pendingCount = $derived(tasks.filter((task) => !task.completed).length);
	const completedCount = $derived(tasks.length - pendingCount);

	const visible = $derived.by(() => {
		const list = tasks.filter(
			(task) => filter === 'all' || task.completed === (filter === 'completed')
		);

		return list.sort((a, b) => {
			if (sort === 'priority') {
				const diff = (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
				if (diff !== 0) return diff;
			}
			const dueDiff = (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31');
			if (dueDiff !== 0) return dueDiff;
			return b.created_at.localeCompare(a.created_at);
		});
	});

	const emptyMessage = $derived(
		filter === 'completed'
			? 'No completed tasks yet.'
			: filter === 'pending'
				? 'All caught up. Add a task to get started.'
				: 'No tasks yet. Add your first one above.'
	);

	function priorityOf(task: Task) {
		return priorities[task.priority] ?? priorities.medium;
	}

	function formatDue(date: string) {
		const [year, month, day] = date.split('-').map(Number);
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
			new Date(year, month - 1, day)
		);
	}

	function isOverdue(task: Task) {
		return !task.completed && !!task.due_date && task.due_date < todayStr;
	}

	async function addTask(event: SubmitEvent) {
		event.preventDefault();
		const title = newTitle.trim();
		if (!title || adding) return;

		adding = true;
		errorMsg = '';

		const { data: created, error } = await data
			.supabase!.from('tasks')
			.insert({ title, user_id: data.user!.id })
			.select()
			.single();

		adding = false;

		if (error) {
			errorMsg = error.message;
			return;
		}

		tasks = [created, ...tasks];
		newTitle = '';
	}

	async function toggleTask(task: Task) {
		const next = !task.completed;
		task.completed = next;
		errorMsg = '';

		const { error } = await data
			.supabase!.from('tasks')
			.update({ completed: next })
			.eq('id', task.id);

		if (error) {
			task.completed = !next;
			errorMsg = error.message;
		}
	}

	function openEditor(task: Task) {
		if (editingId === task.id) {
			editingId = null;
			return;
		}
		editingId = task.id;
		draft = {
			title: task.title,
			notes: task.notes ?? '',
			dueDate: task.due_date ?? '',
			priority: task.priority
		};
	}

	async function saveTask(event: SubmitEvent) {
		event.preventDefault();
		const title = draft.title.trim();
		const id = editingId;
		if (!title || !id || saving) return;

		saving = true;
		errorMsg = '';

		const { data: updated, error } = await data
			.supabase!.from('tasks')
			.update({
				title,
				notes: draft.notes.trim() || null,
				due_date: draft.dueDate || null,
				priority: draft.priority
			})
			.eq('id', id)
			.select()
			.single();

		saving = false;

		if (error) {
			errorMsg = error.message;
			return;
		}

		const index = tasks.findIndex((task) => task.id === id);
		if (index !== -1) tasks[index] = updated;
		editingId = null;
	}

	async function deleteTask(task: Task) {
		if (!confirm(`Delete "${task.title}"?`)) return;

		errorMsg = '';
		const { error } = await data.supabase!.from('tasks').delete().eq('id', task.id);

		if (error) {
			errorMsg = error.message;
			return;
		}

		tasks = tasks.filter((t) => t.id !== task.id);
		if (editingId === task.id) editingId = null;
	}
</script>

<div class="mx-auto w-full max-w-3xl space-y-6 pb-20 md:pb-6">
	<header>
		<h2 class="text-3xl font-bold tracking-tight">Tasks</h2>
		<p class="text-sm text-muted-foreground">
			{pendingCount} pending · {completedCount} completed
		</p>
	</header>

	<form onsubmit={addTask} class="flex gap-2">
		<Input
			bind:value={newTitle}
			placeholder="Add a task and press Enter"
			aria-label="New task title"
			maxlength={200}
			class="bg-background"
		/>
		<Button type="submit" disabled={adding || !newTitle.trim()}>
			<Plus class="h-4 w-4" />
			<span class="hidden sm:inline">{adding ? 'Adding…' : 'Add'}</span>
		</Button>
	</form>

	{#if errorMsg}
		<div
			role="alert"
			transition:fade|local={{ duration: 150 }}
			class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			{errorMsg}
		</div>
	{/if}

	<div class="flex flex-wrap items-center justify-between gap-3">
		<div
			class="inline-flex rounded-lg border bg-muted/40 p-1"
			role="tablist"
			aria-label="Filter tasks"
		>
			{#each [{ value: 'pending', label: 'Pending', count: pendingCount }, { value: 'completed', label: 'Completed', count: completedCount }, { value: 'all', label: 'All', count: tasks.length }] as option (option.value)}
				<button
					type="button"
					role="tab"
					aria-selected={filter === option.value}
					onclick={() => (filter = option.value as Filter)}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {filter ===
					option.value
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{option.label}
					<span class="ml-1 text-xs text-muted-foreground">{option.count}</span>
				</button>
			{/each}
		</div>

		<label class="flex items-center gap-2 text-sm text-muted-foreground">
			Sort
			<select
				bind:value={sort}
				class="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
			>
				<option value="due">Due date</option>
				<option value="priority">Priority</option>
			</select>
		</label>
	</div>

	<ul class="space-y-3">
		{#each visible as task (task.id)}
			{@const priority = priorityOf(task)}
			{@const overdue = isOverdue(task)}
			<li
				class="rounded-xl border bg-card text-card-foreground shadow transition-colors hover:border-primary/40"
				animate:flip={{ duration: listDuration }}
				transition:slide|local={{ duration: listDuration }}
			>
				<div class="flex items-start gap-3 p-4">
					<input
						type="checkbox"
						class="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-primary"
						checked={task.completed}
						onchange={() => toggleTask(task)}
						aria-label={`Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`}
					/>

					<button
						type="button"
						class="min-w-0 flex-1 text-left"
						onclick={() => openEditor(task)}
						aria-expanded={editingId === task.id}
					>
						<span class="flex flex-wrap items-center gap-2">
							<span
								class="font-medium transition-colors duration-200 {task.completed
									? 'text-muted-foreground line-through'
									: ''}">{task.title}</span
							>
							<span
								class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs {priority.badge}"
							>
								<span class="h-1.5 w-1.5 rounded-full {priority.dot}"></span>
								{priority.label}
							</span>
						</span>
						<span
							class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
						>
							{#if task.due_date}
								<span class={overdue ? 'font-medium text-destructive' : ''}>
									{overdue ? 'Overdue · ' : task.due_date === todayStr ? 'Today · ' : ''}{formatDue(
										task.due_date
									)}
								</span>
							{/if}
							{#if task.notes}
								<span class="max-w-full truncate">{task.notes}</span>
							{/if}
						</span>
					</button>

					<ChevronDown
						class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {editingId ===
						task.id
							? 'rotate-180'
							: ''}"
					/>
				</div>

				{#if editingId === task.id}
					<form
						onsubmit={saveTask}
						class="space-y-4 border-t p-4"
						transition:slide={{ duration: listDuration }}
					>
						<div class="space-y-2">
							<Label for="task-title-{task.id}">Title</Label>
							<Input id="task-title-{task.id}" bind:value={draft.title} required maxlength={200} />
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="task-due-{task.id}">Due date</Label>
								<Input id="task-due-{task.id}" type="date" bind:value={draft.dueDate} />
							</div>

							<div class="space-y-2">
								<Label for="task-priority-{task.id}">Priority</Label>
								<Select.Root type="single" bind:value={draft.priority}>
									<Select.Trigger id="task-priority-{task.id}">
										{priorities[draft.priority]?.label ?? 'Medium'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="low">Low</Select.Item>
										<Select.Item value="medium">Medium</Select.Item>
										<Select.Item value="high">High</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="task-notes-{task.id}">Notes</Label>
							<textarea
								id="task-notes-{task.id}"
								bind:value={draft.notes}
								rows="3"
								maxlength={2000}
								class="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
							></textarea>
						</div>

						<div class="flex flex-wrap gap-2">
							<Button type="submit" disabled={saving || !draft.title.trim()}>
								{saving ? 'Saving…' : 'Save'}
							</Button>
							<Button type="button" variant="outline" onclick={() => (editingId = null)}>
								Cancel
							</Button>
							<Button
								type="button"
								variant="ghost"
								class="text-destructive hover:text-destructive sm:ml-auto"
								onclick={() => deleteTask(task)}
							>
								Delete
							</Button>
						</div>
					</form>
				{/if}
			</li>
		{:else}
			<li
				class="rounded-xl border bg-card p-10 text-center"
				transition:fade|local={{ duration: listDuration }}
			>
				<p class="text-muted-foreground">{emptyMessage}</p>
			</li>
		{/each}
	</ul>
</div>
