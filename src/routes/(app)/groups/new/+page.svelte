<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<div class="mx-auto mt-8 max-w-md">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Create Group</h2>
		<a href="/groups" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
		{#if form?.message}
			<div class="mb-4 text-sm font-medium text-destructive">{form.message}</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					update();
				};
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="name">Group Name</Label>
				<Input id="name" name="name" placeholder="E.g., Apartment, Trip to Tokyo" autofocus required />
			</div>

			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Creating...' : 'Create Group'}
			</Button>
		</form>
	</div>
</div>
