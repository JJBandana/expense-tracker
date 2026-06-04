<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string, tz: string) {
		return new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(dateString));
	}
</script>

<div class="flex items-center justify-between space-y-2 mb-6">
	<h2 class="text-3xl font-bold tracking-tight">Transactions</h2>
	<a href="/transactions/new" class={buttonVariants()}>Add Transaction</a>
</div>

<div class="space-y-4">
	{#each data.transactions as transaction}
		<a href="/transactions/{transaction.id}" class="rounded-xl border bg-card text-card-foreground shadow p-4 flex justify-between items-center hover:border-primary transition-colors cursor-pointer block">
			<div class="flex items-center gap-4">
				<div class="text-2xl">{transaction.categories?.icon ?? '📝'}</div>
				<div>
					<p class="font-medium">{transaction.categories?.name ?? 'Uncategorized'}</p>
					<p class="text-sm text-muted-foreground">{transaction.accounts?.name} • {formatDate(transaction.date, data.profile?.timezone || 'UTC')}</p>
				</div>
			</div>
			<div class="font-bold {transaction.type === 'expense' ? 'text-destructive' : 'text-green-600'}">
				{transaction.type === 'expense' ? '-' : '+'}¥{Math.abs(transaction.amount)}
			</div>
		</a>
	{:else}
		<p class="text-muted-foreground">No transactions found.</p>
	{/each}
</div>
