<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowUpRight, ArrowDownRight, Wallet, Activity, Tags } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string, tz: string) {
		return new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			month: 'short',
			day: 'numeric'
		}).format(new Date(dateString));
	}
</script>

<div class="space-y-6 pb-20 md:pb-6">
	<div class="flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Overview</h2>
	</div>

	<!-- Balance & Monthly Summary -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
		<div class="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
			<div class="flex items-center justify-between space-y-0 pb-2">
				<h3 class="tracking-tight text-sm font-medium">Total Balance</h3>
				<Wallet class="h-4 w-4 text-muted-foreground" />
			</div>
			<div class="text-2xl font-bold">¥{data.totalBalance.toFixed(2)}</div>
		</div>

		<div class="grid grid-cols-2 gap-4 md:col-span-2">
			<div class="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
				<div class="flex items-center justify-between space-y-0 pb-2">
					<h3 class="tracking-tight text-sm font-medium">Income (This Month)</h3>
					<ArrowUpRight class="h-4 w-4 text-green-500" />
				</div>
				<div class="text-2xl font-bold text-green-600">¥{data.monthlyIncome.toFixed(2)}</div>
			</div>
			<div class="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
				<div class="flex items-center justify-between space-y-0 pb-2">
					<h3 class="tracking-tight text-sm font-medium">Expense (This Month)</h3>
					<ArrowDownRight class="h-4 w-4 text-destructive" />
				</div>
				<div class="text-2xl font-bold text-destructive">¥{data.monthlyExpense.toFixed(2)}</div>
			</div>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<!-- Top Categories -->
		<div class="rounded-xl border bg-card text-card-foreground shadow col-span-4 lg:col-span-3 flex flex-col">
			<div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
				<div class="space-y-1">
					<h3 class="font-semibold leading-none tracking-tight">Top Expenses</h3>
					<p class="text-sm text-muted-foreground">Where your money went this month</p>
				</div>
				<Tags class="h-4 w-4 text-muted-foreground" />
			</div>
			<div class="p-6 pt-0 flex-1">
				{#if data.topCategories.length === 0}
					<div class="flex h-[150px] items-center justify-center text-muted-foreground text-sm">
						No expenses this month
					</div>
				{:else}
					<div class="space-y-6 mt-4">
						{#each data.topCategories as category}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="text-xl bg-muted h-10 w-10 flex items-center justify-center rounded-full">
										{category.icon}
									</div>
									<div class="space-y-1.5">
										<p class="text-sm font-medium leading-none">{category.name}</p>
										<div class="bg-secondary h-1.5 mt-2 rounded-full overflow-hidden w-24 sm:w-32">
											<div class="bg-primary h-full rounded-full" style="width: {(category.amount / data.monthlyExpense) * 100}%"></div>
										</div>
									</div>
								</div>
								<div class="font-medium text-sm">¥{category.amount.toFixed(2)}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent Transactions -->
		<div class="rounded-xl border bg-card text-card-foreground shadow col-span-4 flex flex-col">
			<div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
				<div class="space-y-1">
					<h3 class="font-semibold leading-none tracking-tight">Recent Transactions</h3>
					<p class="text-sm text-muted-foreground">Your latest activity</p>
				</div>
				<Activity class="h-4 w-4 text-muted-foreground" />
			</div>
			<div class="p-6 pt-0 flex-1">
				{#if data.recentTransactions.length === 0}
					<div class="flex h-[150px] items-center justify-center text-muted-foreground text-sm">
						No transactions yet
					</div>
				{:else}
					<div class="space-y-6 mt-4">
						{#each data.recentTransactions as tx}
							<a href="/transactions/{tx.id}" class="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer">
								<div class="flex items-center gap-4">
									<div class="text-xl bg-muted h-10 w-10 flex items-center justify-center rounded-full">
										{tx.type === 'transfer' ? '🔄' : (tx.categories?.icon ?? (tx.type === 'income' ? '💰' : '📝'))}
									</div>
									<div class="space-y-1">
										<p class="text-sm font-medium leading-none">{tx.type === 'transfer' ? 'Transfer' : (tx.categories?.name ?? 'Uncategorized')}</p>
										<p class="text-xs text-muted-foreground">
											{#if tx.type === 'transfer'}
												{tx.accounts?.name} ➡️ {tx.destination_account?.name}
											{:else}
												{tx.accounts?.name}
											{/if}
											 • {formatDate(tx.date, data.profile?.timezone || 'UTC')}
										</p>
									</div>
								</div>
								<div class="font-medium text-sm {tx.type === 'expense' ? 'text-destructive' : tx.type === 'income' ? 'text-green-600' : 'text-blue-600'}">
									{tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}¥{Math.abs(tx.amount).toFixed(2)}
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
