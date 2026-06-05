<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	let loading = $state(false);
	let isDeleting = $state(false);
	let selectedType = $state(data.category.type);
	let name = $state(data.category.name);
	let icon = $state(data.category.icon ?? '');
	let budget = $state(data.category.monthly_budget?.toString() ?? '');
	let errorMsg = $state('');

	async function handleUpdate(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		if (!selectedType) {
			errorMsg = 'Please select a category type';
			loading = false;
			return;
		}

		const updateData: any = {
			name,
			type: selectedType,
			icon: icon || null
		};

		if (selectedType === 'expense') {
			updateData.monthly_budget = budget ? Number(budget) : null;
		} else {
			updateData.monthly_budget = null;
		}

		const { error } = await data.supabase!
			.from('categories')
			.update(updateData)
			.eq('id', data.category.id)
			.eq('user_id', data.user!.id);

		loading = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/categories');
		}
	}

	async function handleDelete(e: Event) {
		e.preventDefault();
		if (!confirm('Are you sure you want to delete this category?')) {
			return;
		}
		
		isDeleting = true;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('categories')
			.delete()
			.eq('id', data.category.id)
			.eq('user_id', data.user!.id);

		isDeleting = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/categories');
		}
	}
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Edit Category</h2>
		<a href="/categories" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if errorMsg}
			<div class="mb-4 text-sm font-medium text-destructive">{errorMsg}</div>
		{/if}
		<form onsubmit={handleUpdate} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Category Name</Label>
				<Input id="name" bind:value={name} required />
			</div>
			
			<div class="space-y-2">
				<Label for="icon">Icon (Emoji)</Label>
				<Input id="icon" bind:value={icon} />
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

			<Button type="submit" class="w-full" disabled={loading || isDeleting || !selectedType}>
				{loading ? 'Saving...' : 'Update Category'}
			</Button>
		</form>

		<div class="mt-8 border-t pt-6">
			<h3 class="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
			<p class="text-sm text-muted-foreground mb-4">Deleting this category will set associated transactions to uncategorized.</p>
			
			<form onsubmit={handleDelete}>
				<Button type="submit" variant="destructive" class="w-full" disabled={loading || isDeleting}>
					{isDeleting ? 'Deleting...' : 'Delete Category'}
				</Button>
			</form>
		</div>
	</div>
</div>
