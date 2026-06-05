<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	let loading = $state(false);
	let selectedType = $state('');
	let name = $state('');
	let icon = $state('');
	let budget = $state('');
	let errorMsg = $state('');

	async function handleCreate(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		if (!selectedType) {
			errorMsg = 'Please select a category type';
			loading = false;
			return;
		}

		const insertData: any = {
			name,
			type: selectedType,
			icon: icon || null,
			user_id: data.user!.id
		};

		if (selectedType === 'expense' && budget) {
			insertData.monthly_budget = Number(budget);
		}

		const { error } = await data.supabase!.from('categories').insert(insertData);

		loading = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/categories');
		}
	}
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">New Category</h2>
		<a href="/categories" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if errorMsg}
			<div class="mb-4 text-sm font-medium text-destructive">{errorMsg}</div>
		{/if}
		<form onsubmit={handleCreate} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Category Name</Label>
				<Input id="name" bind:value={name} placeholder="e.g. Groceries" required />
			</div>
			
			<div class="space-y-2">
				<Label for="icon">Icon (Emoji)</Label>
				<Input id="icon" bind:value={icon} placeholder="e.g. 🛒" />
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
			</div>

			{#if selectedType === 'expense'}
				<div class="space-y-2">
					<Label for="budget">Monthly Budget (Optional)</Label>
					<Input type="number" step="0.01" id="budget" bind:value={budget} placeholder="0.00" min="0" />
					<p class="text-xs text-muted-foreground">Set a limit to track your spending.</p>
				</div>
			{/if}

			<Button type="submit" class="w-full" disabled={loading || !selectedType}>
				{loading ? 'Saving...' : 'Create Category'}
			</Button>
		</form>
	</div>
</div>
