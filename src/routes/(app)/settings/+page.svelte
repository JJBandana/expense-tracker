<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let loading = $state(false);
	
	let selectedTimezone = $state(data.profile.timezone);
	let errorMsg = $state('');
	let successMsg = $state(false);

	// Get a list of common timezones
	const timezones = Intl.supportedValuesOf('timeZone');

	async function handleSave(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		successMsg = false;

		try {
			Intl.DateTimeFormat(undefined, { timeZone: selectedTimezone });
		} catch (err) {
			errorMsg = 'Invalid timezone';
			loading = false;
			return;
		}

		const { error } = await data.supabase!
			.from('profiles')
			.upsert({ id: data.user!.id, timezone: selectedTimezone })
			.eq('id', data.user!.id);

		loading = false;

		if (error) {
			errorMsg = error.message;
		} else {
			successMsg = true;
		}
	}
</script>

<div class="max-w-md mx-auto mt-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Settings</h2>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		{#if errorMsg}
			<div class="mb-4 text-sm font-medium text-destructive">{errorMsg}</div>
		{/if}
		{#if successMsg}
			<div class="mb-4 text-sm font-medium text-green-600">Settings saved successfully!</div>
		{/if}

		<form onsubmit={handleSave} class="space-y-4">
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
				<p class="text-xs text-muted-foreground mt-1">This ensures your transactions show the correct date and time regardless of where you travel.</p>
			</div>

			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Saving...' : 'Save Preferences'}
			</Button>
		</form>
	</div>
</div>
