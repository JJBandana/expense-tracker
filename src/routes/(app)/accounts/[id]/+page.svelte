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
	let selectedType = $state(data.account.type);
	let name = $state(data.account.name);
	let balance = $state(data.account.balance.toString());
	let errorMsg = $state('');

	async function handleUpdate(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('accounts')
			.update({
				name,
				type: selectedType,
				balance: Number(balance)
			})
			.eq('id', data.account.id)
			.eq('user_id', data.user!.id);

		loading = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/accounts');
		}
	}

	async function handleDelete(e: Event) {
		e.preventDefault();
		if (!confirm('Are you sure you want to delete this account? This cannot be undone.')) {
			return;
		}
		
		isDeleting = true;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('accounts')
			.delete()
			.eq('id', data.account.id)
			.eq('user_id', data.user!.id);

		isDeleting = false;

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/accounts');
		}
	}
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Edit Account</h2>
		<a href="/accounts" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if errorMsg}
			<div class="mb-4 text-sm font-medium text-destructive">{errorMsg}</div>
		{/if}
		<form onsubmit={handleUpdate} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Account Name</Label>
				<Input id="name" bind:value={name} required />
			</div>

			<div class="space-y-2">
				<Label for="type">Account Type</Label>
				<Select.Root type="single" bind:value={selectedType}>
					<Select.Trigger>
						{selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : 'Select account type'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="checking">Checking</Select.Item>
						<Select.Item value="savings">Savings</Select.Item>
						<Select.Item value="credit">Credit</Select.Item>
						<Select.Item value="cash">Cash</Select.Item>
						<Select.Item value="other">Other</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="balance">Current Balance (¥)</Label>
				<Input id="balance" type="number" step="1" bind:value={balance} required />
			</div>

			<Button type="submit" class="w-full" disabled={loading || isDeleting || !selectedType}>
				{loading ? 'Saving...' : 'Update Account'}
			</Button>
		</form>

		<div class="mt-8 border-t pt-6">
			<h3 class="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
			<p class="text-sm text-muted-foreground mb-4">Deleting this account will also delete all associated transactions.</p>
			
			<form onsubmit={handleDelete}>
				<Button type="submit" variant="destructive" class="w-full" disabled={loading || isDeleting}>
					{isDeleting ? 'Deleting...' : 'Delete Account'}
				</Button>
			</form>
		</div>
	</div>
</div>
