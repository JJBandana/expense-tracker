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
		<h2 class="text-3xl font-bold tracking-tight">New Account</h2>
		<a href="/accounts" class={buttonVariants({ variant: 'outline' })}>Cancel</a>
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
				<Label for="name">Account Name</Label>
				<Input id="name" name="name" placeholder="e.g. Main Checking" required />
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
				<Label for="balance">Initial Balance (¥)</Label>
				<Input id="balance" name="balance" type="number" step="1" defaultValue="0" required />
			</div>

			<Button type="submit" class="w-full" disabled={loading || !selectedType}>
				{loading ? 'Saving...' : 'Create Account'}
			</Button>
		</form>
	</div>
</div>
