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
	let errorMsg = $state('');

	let selectedType = $state(data.transaction.type);
	let selectedAccount = $state(data.transaction.account_id);
	let selectedDestinationAccount = $state(data.transaction.destination_account_id ?? '');
	let selectedCategory = $state(data.transaction.category_id ?? '');
	
	let amount = $state(data.transaction.amount.toString());
	let notes = $state(data.transaction.notes ?? '');

	let tz = data.profile?.timezone || 'UTC';
	let transactionDate = new Date(data.transaction.date);
	let localDateTime = $state(new Intl.DateTimeFormat('en-CA', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(transactionDate).replace(', ', 'T'));

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

	async function handleUpdate(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		if (!selectedAccount) {
			errorMsg = 'Please select an account';
			loading = false;
			return;
		}

		if (selectedType === 'transfer' && !selectedDestinationAccount) {
			errorMsg = 'Please select a destination account';
			loading = false;
			return;
		}

		const [datePart, timePart] = localDateTime.split('T');
		let utcDate;
		try {
			const localDateObj = new Date(`${datePart}T${timePart}:00`);
			utcDate = localDateObj.toISOString();
		} catch (err) {
			errorMsg = 'Invalid date';
			loading = false;
			return;
		}

		const updateData: any = {
			type: selectedType,
			amount: Number(amount),
			date: utcDate,
			notes: notes || null,
			account_id: selectedAccount
		};

		if (selectedType === 'transfer') {
			updateData.destination_account_id = selectedDestinationAccount;
			updateData.category_id = null;
		} else {
			updateData.destination_account_id = null;
			updateData.category_id = selectedCategory || null;
		}

		const { error } = await data.supabase!
			.from('transactions')
			.update(updateData)
			.eq('id', data.transaction.id)
			.eq('user_id', data.user!.id);

		loading = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/transactions');
		}
	}

	async function handleDelete(e: Event) {
		e.preventDefault();
		if (!confirm('Are you sure you want to delete this transaction?')) {
			return;
		}
		
		isDeleting = true;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('transactions')
			.delete()
			.eq('id', data.transaction.id)
			.eq('user_id', data.user!.id);

		isDeleting = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/transactions');
		}
	}
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Edit Transaction</h2>
		<a href="/transactions" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if errorMsg}
			<div class="mb-4 text-sm font-medium text-destructive">{errorMsg}</div>
		{/if}
		
		<form onsubmit={handleUpdate} class="space-y-4">
			
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
				<Input id="amount" type="number" step="0.01" bind:value={amount} inputmode="decimal" required />
			</div>

			<div class="space-y-2">
				<Label for="date">Date & Time</Label>
				<Input id="date" type="datetime-local" required bind:value={localDateTime} />
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
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="notes">Notes (Optional)</Label>
				<Input id="notes" bind:value={notes} />
			</div>

			<Button type="submit" class="w-full" disabled={loading || isDeleting || !selectedAccount}>
				{loading ? 'Saving...' : 'Update Transaction'}
			</Button>
		</form>

		<div class="mt-8 border-t pt-6">
			<form onsubmit={handleDelete}>
				<Button type="submit" variant="destructive" class="w-full" disabled={loading || isDeleting}>
					{isDeleting ? 'Deleting...' : 'Delete Transaction'}
				</Button>
			</form>
		</div>
	</div>
</div>
