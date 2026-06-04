<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let selectedType = $state('');
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">New Category</h2>
		<a href="/dashboard/categories" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if form?.message}
			<div class="mb-4 text-sm font-medium text-destructive">{form.message}</div>
		{/if}
		<form method="POST" use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Category Name</Label>
				<Input id="name" name="name" placeholder="e.g. Groceries" required />
			</div>
			
			<div class="space-y-2">
				<Label for="icon">Icon (Emoji)</Label>
				<Input id="icon" name="icon" placeholder="e.g. 🛒" />
			</div>

			<div class="space-y-2">
				<Label for="type">Category Type</Label>
				<Select.Root type="single" bind:value={selectedType}>
					<Select.Trigger>
						{selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : 'Select category type'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="expense">Expense</Select.Item>
						<Select.Item value="income">Income</Select.Item>
						<Select.Item value="transfer">Transfer</Select.Item>
					</Select.Content>
				</Select.Root>
				<input type="hidden" name="type" value={selectedType} required />
			</div>

			<Button type="submit" class="w-full" disabled={loading || !selectedType}>
				{loading ? 'Saving...' : 'Create Category'}
			</Button>
		</form>
	</div>
</div>
