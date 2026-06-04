<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	let loading = $state(false);

	const signInWithGoogle = async () => {
		loading = true;
		await data.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${location.origin}/auth/callback`
			}
		});
	};
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
	<div class="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow">
		<div class="flex flex-col space-y-1.5 p-6">
			<h3 class="font-semibold leading-none tracking-tight">Login</h3>
			<p class="text-sm text-muted-foreground">Enter your email and password to access your account.</p>
		</div>
		<div class="p-6 pt-0">
			{#if form?.message}
				<div class="mb-4 text-sm font-medium text-destructive">{form.message}</div>
			{/if}
			<form method="POST" action="?/login" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					update();
				};
			}} class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" placeholder="m@example.com" value={form?.email ?? ''} required />
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required />
				</div>
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Logging in...' : 'Login'}
				</Button>
			</form>
			
			<div class="relative my-4">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-card px-2 text-muted-foreground">Or continue with</span>
				</div>
			</div>
			
			<Button variant="outline" type="button" class="w-full" disabled={loading} onclick={signInWithGoogle}>
				Google
			</Button>

			<div class="mt-4 text-center text-sm">
				Don't have an account? <a href="/register" class="underline">Register</a>
			</div>
		</div>
	</div>
</div>
