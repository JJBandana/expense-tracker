<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let loading = $state(false);
	let isDeleting = $state(false);
	
	let selectedType = $state(data.transaction.type);
	let selectedAccount = $state(data.transaction.account_id);
	let selectedDestinationAccount = $state(data.transaction.destination_account_id ?? '');
	let selectedCategory = $state(data.transaction.category_id ?? '');

	let tz = data.profile?.timezone || 'UTC';
	let transactionDate = new Date(data.transaction.date);
	let localDateTime = new Intl.DateTimeFormat('en-CA', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(transactionDate).replace(', ', 'T');

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
		<h2 class="text-3xl font-bold tracking-tight">Edit Transaction</h2>
		<a href="/transactions" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if form?.message}
			<div class="mb-4 text-sm font-medium text-destructive">{form.message}</div>
		{/if}
		
		<form method="POST" action="?/update" use:enhance={() => {
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
					<label class="flex items-center gap-2">
						<input type="radio" bind:group={selectedType} name="type" value="transfer" />
						Transfer
					</label>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="amount">Amount (¥)</Label>
				<Input id="amount" name="amount" type="number" step="0.01" value={data.transaction.amount} inputmode="decimal" required />
			</div>

			<div class="space-y-2">
				<Label for="date">Date & Time</Label>
				<Input id="date" name="date" type="datetime-local" required value={localDateTime} />
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
				<input type="hidden" name="account" value={selectedAccount} required />
			</div>

			{#if selectedType === 'transfer'}
				<div class="space-y-2">
					<Label for="destination_account">To Account</Label>
					<Select.Root type="single" bind:value={selectedDestinationAccount}>
						<Select.Trigger>
							{data.accounts.find(a => a.id === selectedDestinationAccount)?.name ?? 'Select account'}
						</Select.Trigger>
						<Select.Content>
							{#each data.accounts.filter(a => a.id !== selectedAccount) as account}
								<Select.Item value={account.id}>{account.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="destination_account" value={selectedDestinationAccount} />
				</div>
			{:else}
				<div class="space-y-2">
					<Label for="category">Category</Label>
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
					<input type="hidden" name="category" value={selectedCategory} />
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="notes">Notes (Optional)</Label>
				<Input id="notes" name="notes" value={data.transaction.notes ?? ''} />
			</div>

			<Button type="submit" class="w-full" disabled={loading || isDeleting || !selectedAccount}>
				{loading ? 'Saving...' : 'Update Transaction'}
			</Button>
		</form>

		<div class="mt-8 border-t pt-6">
			<form method="POST" action="?/delete" use:enhance={(e) => {
				if (!confirm('Are you sure you want to delete this transaction?')) {
					e.cancel();
					return;
				}
				isDeleting = true;
				return async ({ update }) => {
					isDeleting = false;
					update();
				};
			}}>
				<Button type="submit" variant="destructive" class="w-full" disabled={loading || isDeleting}>
					{isDeleting ? 'Deleting...' : 'Delete Transaction'}
				</Button>
			</form>
		</div>
	</div>
</div>
