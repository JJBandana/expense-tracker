<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let loading = $state(false);
	
	let selectedTimezone = $state(data.profile.timezone);

	// Get a list of common timezones
	const timezones = Intl.supportedValuesOf('timeZone');
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Settings</h2>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if form?.error}
			<div class="mb-4 text-sm font-medium text-destructive">{form.message}</div>
		{/if}
		{#if form?.success}
			<div class="mb-4 text-sm font-medium text-green-600">Settings saved successfully!</div>
		{/if}

		<form method="POST" use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}} class="space-y-4">
			<div class="space-y-2">
				<Label for="timezone">Time Zone</Label>
				<Select.Root type="single" bind:value={selectedTimezone}>
					<Select.Trigger>
						{selectedTimezone}
					</Select.Trigger>
					<Select.Content class="max-h-60">
						{#each timezones as tz}
							<Select.Item value={tz}>{tz}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<input type="hidden" name="timezone" value={selectedTimezone} required />
				<p class="text-xs text-muted-foreground mt-1">This ensures your transactions show the correct date and time regardless of where you travel.</p>
			</div>

			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Saving...' : 'Save Preferences'}
			</Button>
		</form>
	</div>
</div>
