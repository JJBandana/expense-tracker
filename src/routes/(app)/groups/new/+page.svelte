<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	let loading = $state(false);
	let name = $state('');
	let errorMsg = $state('');

	async function handleCreate(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		const { error } = await data.supabase!.from('groups').insert({
			name,
			created_by: data.user!.id
		});

		loading = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/groups');
		}
	}
</script>

<div class="mx-auto mt-8 max-w-md">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Create Group</h2>
		<a href="/groups" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
		{#if errorMsg}
			<div class="mb-4 text-sm font-medium text-destructive">{errorMsg}</div>
		{/if}

		<form onsubmit={handleCreate} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Group Name</Label>
				<Input id="name" bind:value={name} placeholder="E.g., Apartment, Trip to Tokyo" autofocus required />
			</div>

			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Creating...' : 'Create Group'}
			</Button>
		</form>
	</div>
</div>
