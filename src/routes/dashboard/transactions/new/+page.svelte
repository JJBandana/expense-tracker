<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let loading = $state(false);
	
	let selectedType = $state('expense');
	let selectedAccount = $state(data.accounts.length > 0 ? data.accounts[0].id : '');
	let selectedCategory = $state('');

	// Filter categories based on transaction type
	let filteredCategories = $derived(
		data.categories.filter((c) => c.type === selectedType)
	);

	$effect(() => {
		if (filteredCategories.length > 0) {
			if (!filteredCategories.find((c) => c.id === selectedCategory)) {
				selectedCategory = filteredCategories[0].id;
			}
		} else {
			selectedCategory = '';
		}
	});
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">New Transaction</h2>
		<a href="/dashboard/transactions" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if form?.message}
			<div class="mb-4 text-sm font-medium text-destructive">{form.message}</div>
		{/if}
		
		{#if data.accounts.length === 0}
			<div class="text-center py-4">
				<p class="text-muted-foreground mb-4">You need to create an account first.</p>
				<a href="/dashboard/accounts/new" class={buttonVariants()}>Create Account</a>
			</div>
		{:else}
		<form method="POST" use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}} class="space-y-4">
			
			<div class="space-y-2">
				<Label>Transaction Type</Label>
				<div class="flex gap-4">
					<label class="flex items-center gap-2">
						<input type="radio" bind:group={selectedType} name="type" value="expense" />
						Expense
					</label>
					<label class="flex items-center gap-2">
						<input type="radio" bind:group={selectedType} name="type" value="income" />
						Income
					</label>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="amount">Amount (¥)</Label>
				<Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
			</div>

			<div class="space-y-2">
				<Label for="date">Date</Label>
				<Input id="date" name="date" type="date" required value={new Date().toISOString().split('T')[0]} />
			</div>

			<div class="space-y-2">
				<Label for="account_id">Account</Label>
				<Select.Root type="single" bind:value={selectedAccount}>
					<Select.Trigger>
						{data.accounts.find(a => a.id === selectedAccount)?.name ?? 'Select account'}
					</Select.Trigger>
					<Select.Content>
						{#each data.accounts as account}
							<Select.Item value={account.id}>{account.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<input type="hidden" name="account_id" value={selectedAccount} required />
			</div>

			<div class="space-y-2">
				<Label for="category_id">Category</Label>
				<Select.Root type="single" bind:value={selectedCategory}>
					<Select.Trigger>
						{filteredCategories.find(c => c.id === selectedCategory)?.name ?? 'Select category'}
					</Select.Trigger>
					<Select.Content>
						{#each filteredCategories as category}
							<Select.Item value={category.id}>{category.icon ?? ''} {category.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<input type="hidden" name="category_id" value={selectedCategory} />
			</div>

			<div class="space-y-2">
				<Label for="notes">Notes (Optional)</Label>
				<Input id="notes" name="notes" placeholder="What was this for?" />
			</div>

			<Button type="submit" class="w-full" disabled={loading || !selectedAccount}>
				{loading ? 'Saving...' : 'Save Transaction'}
			</Button>
		</form>
		{/if}
	</div>
</div>
