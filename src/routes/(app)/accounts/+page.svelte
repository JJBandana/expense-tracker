<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex items-center justify-between space-y-2 mb-6">
	<h2 class="text-3xl font-bold tracking-tight">Accounts</h2>
	<a href="/accounts/new" class={buttonVariants()}>Add Account</a>
</div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
	{#each data.accounts as account}
		<a href="/accounts/{account.id}" class="rounded-xl border bg-card text-card-foreground shadow p-6 hover:border-primary transition-colors block cursor-pointer">
			<h3 class="font-semibold leading-none tracking-tight">{account.name}</h3>
			<p class="mt-4 text-2xl font-bold">¥{account.balance}</p>
			<p class="text-sm text-muted-foreground mt-2 capitalize">{account.type}</p>
		</a>
	{:else}
		<p class="text-muted-foreground">No accounts found. Create one to get started.</p>
	{/each}
</div>
