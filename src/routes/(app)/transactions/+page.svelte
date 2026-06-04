<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Search } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

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
	<a href="/transactions/new" class={buttonVariants()}>Add New</a>
</div>

<!-- Filter Bar -->
<form method="GET" class="flex flex-col sm:flex-row gap-3 mb-6 bg-muted/30 p-3 rounded-xl border">
	<div class="flex-1">
		<Input 
			type="month" 
			name="month" 
			value={data.selectedMonthStr} 
			onchange={(e) => e.currentTarget.form?.submit()} 
			class="bg-background"
		/>
	</div>
	<div class="flex gap-2 flex-1 sm:flex-[2]">
		<div class="relative flex-1">
			<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input 
				type="search" 
				name="q" 
				placeholder="Search notes, categories, accounts..." 
				value={data.searchQuery}
				class="pl-9 bg-background"
			/>
		</div>
		<Button type="submit" variant="secondary">Filter</Button>
	</div>
</form>

<div class="space-y-4 pb-20 md:pb-4">
	{#each data.transactions as transaction}
		<a href="/transactions/{transaction.id}" class="rounded-xl border bg-card text-card-foreground shadow p-4 flex justify-between items-center hover:border-primary transition-colors cursor-pointer block">
			<div class="flex items-center gap-4">
				<div class="text-2xl bg-muted h-10 w-10 flex items-center justify-center rounded-full">
					{transaction.categories?.icon ?? '📝'}
				</div>
				<div>
					<p class="font-medium">{transaction.categories?.name ?? 'Uncategorized'}</p>
					<p class="text-sm text-muted-foreground">
						{transaction.accounts?.name} • {formatDate(transaction.date, data.profile?.timezone || 'UTC')}
						{#if transaction.notes}
							<br/><span class="text-xs italic truncate max-w-[150px] inline-block">{transaction.notes}</span>
						{/if}
					</p>
				</div>
			</div>
			<div class="font-bold {transaction.type === 'expense' ? 'text-destructive' : 'text-green-600'}">
				{transaction.type === 'expense' ? '-' : '+'}¥{Math.abs(transaction.amount).toFixed(2)}
			</div>
		</a>
	{:else}
		<div class="text-center py-10 border rounded-xl bg-card">
			<p class="text-muted-foreground">No transactions found for this period.</p>
		</div>
	{/each}
</div>
