<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Database } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let supabaseUrl = $state('');
	let supabaseAnonKey = $state('');
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
			error = 'Please enter a valid Supabase Project URL.';
			return;
		}

		if (!supabaseAnonKey.startsWith('ey')) {
			error = 'Please enter a valid Supabase Anon Key (starts with "ey").';
			return;
		}

		localStorage.setItem('supabase_url', supabaseUrl.trim());
		localStorage.setItem('supabase_anon_key', supabaseAnonKey.trim());

		// Reload the entire app to initialize the Supabase client in +layout.ts
		window.location.href = '/login';
	}
</script>

<svelte:head>
	<title>Connect your Database | Expense Tracker</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
	<div class="w-full max-w-md space-y-8 rounded-2xl border bg-card p-8 shadow-lg">
		<div class="flex flex-col items-center space-y-2 text-center">
			<div class="rounded-full bg-primary/10 p-4">
				<Database class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Bring Your Own Database</h1>
			<p class="text-sm text-muted-foreground">
				Connect your own Supabase project. You retain 100% ownership of your financial data.
			</p>
		</div>

		{#if error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label for="url">Supabase Project URL</Label>
				<Input
					id="url"
					type="url"
					placeholder="https://xxxxxx.supabase.co"
					bind:value={supabaseUrl}
					required
				/>
			</div>
			
			<div class="space-y-2">
				<Label for="key">Supabase Anon Key</Label>
				<Input
					id="key"
					type="password"
					placeholder="eyJh..."
					bind:value={supabaseAnonKey}
					required
				/>
				<p class="text-xs text-muted-foreground">
					Found in your Supabase Dashboard under Settings > API.
				</p>
			</div>

			<Button type="submit" class="w-full mt-4">Connect Database</Button>
		</form>

		<div class="text-center text-xs text-muted-foreground">
			<p>Your credentials are saved securely in your browser's Local Storage.</p>
			<p>They are never sent to any centralized server.</p>
		</div>
	</div>
</div>
