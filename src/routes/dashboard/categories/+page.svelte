<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex items-center justify-between space-y-2 mb-6">
	<h2 class="text-3xl font-bold tracking-tight">Categories</h2>
	<a href="/dashboard/categories/new" class={buttonVariants()}>Add Category</a>
</div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
	{#each data.categories as category}
		<div class="rounded-xl border bg-card text-card-foreground shadow p-6 flex items-center gap-4">
			<div class="text-3xl">{category.icon ?? '📁'}</div>
			<div>
				<h3 class="font-semibold leading-none tracking-tight">{category.name}</h3>
				<p class="text-sm text-muted-foreground mt-2 capitalize">{category.type}</p>
			</div>
		</div>
	{:else}
		<p class="text-muted-foreground">No categories found.</p>
	{/each}
</div>
