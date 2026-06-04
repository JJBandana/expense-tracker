<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Calendar } from '@lucide/svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let loading = $state(false);
	let showDate = $state(false);

	let lastTx = data.lastTx;
	let selectedType = $state(lastTx?.type || 'expense');
	let selectedAccount = $state(lastTx?.account_id || (data.accounts.length > 0 ? data.accounts[0].id : ''));
	let selectedCategory = $state(lastTx?.category_id || '');
	let selectedDestinationAccount = $state('');

	let now = new Date();
	let tz = data.profile?.timezone || 'UTC';
	let currentDateTime = new Intl.DateTimeFormat('en-CA', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(now).replace(', ', 'T');

	// Filter categories based on transaction type
	let filteredCategories = $derived(data.categories.filter((c) => c.type === selectedType));

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

<div class="mx-auto mt-8 max-w-md">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">New Transaction</h2>
		<a href="/transactions" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
		{#if form?.message}
			<div class="mb-4 text-sm font-medium text-destructive">{form.message}</div>
		{/if}

		{#if data.accounts.length === 0}
			<div class="py-4 text-center">
				<p class="mb-4 text-muted-foreground">You need to create an account first.</p>
				<a href="/accounts/new" class={buttonVariants()}>Create Account</a>
			</div>
		{:else}
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
					<div class="flex gap-2 items-center">
						<Input
							id="amount"
							name="amount"
							type="number"
							step="0.01"
							placeholder="0.00"
							class="flex-1 text-lg h-12"
							inputmode="decimal"
							autofocus
							required
						/>
						<Button
							type="button"
							variant="outline"
							onclick={() => (showDate = !showDate)}
							class="h-12 w-12 shrink-0 p-0"
							title="Toggle Date"
						>
							<Calendar class="h-5 w-5 text-muted-foreground" />
						</Button>
					</div>
				</div>

				{#if showDate}
					<div class="space-y-2">
						<Label for="date">Date & Time</Label>
						<Input
							id="date"
							name="date"
							type="datetime-local"
							required
							value={currentDateTime}
						/>
					</div>
				{:else}
					<input type="hidden" name="date" value={currentDateTime} />
				{/if}

				<div class="space-y-2">
					<Label for="account_id">Account</Label>
					<Select.Root type="single" bind:value={selectedAccount}>
						<Select.Trigger>
							{data.accounts.find((a) => a.id === selectedAccount)?.name ?? 'Select account'}
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
								{data.accounts.find((a) => a.id === selectedDestinationAccount)?.name ?? 'Select account'}
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
								{filteredCategories.find((c) => c.id === selectedCategory)?.name ?? 'Select category'}
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
					<Input id="notes" name="notes" placeholder="What was this for?" />
				</div>

				<Button type="submit" class="w-full" disabled={loading || !selectedAccount}>
					{loading ? 'Saving...' : 'Save Transaction'}
				</Button>
			</form>
		{/if}
	</div>
</div>
