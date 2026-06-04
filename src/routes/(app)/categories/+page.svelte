<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex items-center justify-between space-y-2 mb-6">
	<h2 class="text-3xl font-bold tracking-tight">Categories</h2>
	<a href="/categories/new" class={buttonVariants()}>Add New</a>
</div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-20 md:pb-4">
	{#each data.categories as category}
		<a href="/categories/{category.id}" class="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between hover:border-primary transition-colors cursor-pointer">
			<div class="flex items-center gap-4 mb-4">
				<div class="text-3xl bg-muted h-14 w-14 flex items-center justify-center rounded-full">
					{category.icon ?? '📝'}
				</div>
				<div class="flex-1">
					<p class="font-medium text-lg">{category.name}</p>
					<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mt-1 {category.type === 'expense' ? 'border-destructive text-destructive' : 'border-green-600 text-green-600'}">
						{category.type.charAt(0).toUpperCase() + category.type.slice(1)}
					</span>
				</div>
			</div>
			
			{#if category.type === 'expense' && category.monthly_budget}
				<div class="mt-2 space-y-2 border-t pt-4">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Budget</span>
						<span class="font-medium {category.current_month_spent > category.monthly_budget ? 'text-destructive' : ''}">
							¥{category.current_month_spent.toFixed(2)} <span class="text-muted-foreground">/ ¥{category.monthly_budget.toFixed(2)}</span>
						</span>
					</div>
					<div class="w-full bg-secondary h-2 rounded-full overflow-hidden">
						<div 
							class="h-full rounded-full transition-all {category.current_month_spent > category.monthly_budget ? 'bg-destructive' : 'bg-primary'}" 
							style="width: {Math.min((category.current_month_spent / category.monthly_budget) * 100, 100)}%"
						></div>
					</div>
					{#if category.current_month_spent > category.monthly_budget}
						<p class="text-xs text-destructive text-right">Over budget by ¥{(category.current_month_spent - category.monthly_budget).toFixed(2)}</p>
					{/if}
				</div>
			{/if}
		</a>
	{:else}
		<p class="text-muted-foreground">No categories found.</p>
	{/each}
</div>
