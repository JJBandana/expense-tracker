<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex items-center justify-between space-y-2">
	<h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
</div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
	<div class="rounded-xl border bg-card text-card-foreground shadow p-6">
		<h3 class="font-semibold leading-none tracking-tight">Total Balance</h3>
		<p class="mt-4 text-2xl font-bold">¥{data.totalBalance.toFixed(2)}</p>
	</div>
</div>
