<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	let loading = $state(false);
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
	<div class="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow">
		<div class="flex flex-col space-y-1.5 p-6">
			<h3 class="font-semibold leading-none tracking-tight">Register</h3>
			<p class="text-sm text-muted-foreground">Create a new account to get started.</p>
		</div>
		<div class="p-6 pt-0">
			{#if form?.message}
				<div class="mb-4 text-sm font-medium {form.error ? 'text-destructive' : 'text-green-600'}">{form.message}</div>
			{/if}
			<form method="POST" action="?/register" use:enhance={() => {
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
					{loading ? 'Creating account...' : 'Register'}
				</Button>
			</form>

			<div class="mt-4 text-center text-sm">
				Already have an account? <a href="/login" class="underline">Login</a>
			</div>
		</div>
	</div>
</div>
