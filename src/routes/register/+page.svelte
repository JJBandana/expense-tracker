<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data }: { data: PageData } = $props();

	let loading = $state(false);
	let email = $state('');
	let password = $state('');
	let errorMsg = $state('');
	let successMsg = $state('');

	const handleRegister = async (e: Event) => {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		successMsg = '';

		const { error } = await data.supabase!.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${location.origin}/auth/callback`
			}
		});

		loading = false;

		if (error) {
			errorMsg = error.message;
		} else {
			successMsg = 'Check your email for the confirmation link.';
			email = '';
			password = '';
		}
	};
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
	<div class="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow">
		<div class="flex flex-col space-y-1.5 p-6">
			<h3 class="font-semibold leading-none tracking-tight">Register</h3>
			<p class="text-sm text-muted-foreground">Create a new account to get started.</p>
		</div>
		<div class="p-6 pt-0">
			{#if errorMsg}
				<div class="mb-4 text-sm font-medium text-destructive">{errorMsg}</div>
			{/if}
			{#if successMsg}
				<div class="mb-4 text-sm font-medium text-green-600">{successMsg}</div>
			{/if}
			<form onsubmit={handleRegister} class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" bind:value={email} required />
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input id="password" type="password" bind:value={password} required />
				</div>
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Creating account...' : 'Register'}
				</Button>
			</form>

			<div class="mt-4 text-center text-sm">
				Already have an account? <a href="/login" class="underline">Login</a>
			</div>
		</div>
	</div>
</div>
