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
	let selectedType = $state(data.account.type);
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Edit Account</h2>
		<a href="/accounts" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
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
				<Label for="name">Account Name</Label>
				<Input id="name" name="name" value={data.account.name} required />
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
				<input type="hidden" name="type" value={selectedType} required />
			</div>

			<div class="space-y-2">
				<Label for="balance">Current Balance (¥)</Label>
				<Input id="balance" name="balance" type="number" step="1" value={data.account.balance} required />
			</div>

			<Button type="submit" class="w-full" disabled={loading || isDeleting || !selectedType}>
				{loading ? 'Saving...' : 'Update Account'}
			</Button>
		</form>

		<div class="mt-8 border-t pt-6">
			<h3 class="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
			<p class="text-sm text-muted-foreground mb-4">Deleting this account will also delete all associated transactions.</p>
			
			<form method="POST" action="?/delete" use:enhance={(e) => {
				if (!confirm('Are you sure you want to delete this account? This cannot be undone.')) {
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
					{isDeleting ? 'Deleting...' : 'Delete Account'}
				</Button>
			</form>
		</div>
	</div>
</div>
