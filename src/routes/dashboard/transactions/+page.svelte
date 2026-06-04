<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex items-center justify-between space-y-2 mb-6">
	<h2 class="text-3xl font-bold tracking-tight">Transactions</h2>
	<a href="/dashboard/transactions/new" class={buttonVariants()}>Add Transaction</a>
</div>

<div class="space-y-4">
	{#each data.transactions as transaction}
		<div class="rounded-xl border bg-card text-card-foreground shadow p-4 flex justify-between items-center">
			<div class="flex items-center gap-4">
				<div class="text-2xl">{transaction.categories?.icon ?? '📝'}</div>
				<div>
					<p class="font-medium">{transaction.categories?.name ?? 'Uncategorized'}</p>
					<p class="text-sm text-muted-foreground">{transaction.accounts?.name} • {transaction.date}</p>
				</div>
			</div>
			<div class="font-bold {transaction.type === 'expense' ? 'text-destructive' : 'text-green-600'}">
				{transaction.type === 'expense' ? '-' : '+'}¥{Math.abs(transaction.amount)}
			</div>
		</div>
	{:else}
		<p class="text-muted-foreground">No transactions found.</p>
	{/each}
</div>
