<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { LayoutDashboard, Wallet, Tags, ArrowRightLeft, LogOut } from '@lucide/svelte';

	let { children } = $props();

	const navItems = [
		{ name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
		{ name: 'Accounts', href: '/dashboard/accounts', icon: Wallet },
		{ name: 'Categories', href: '/dashboard/categories', icon: Tags },
		{ name: 'Transactions', href: '/dashboard/transactions', icon: ArrowRightLeft }
	];
</script>

<div class="flex min-h-screen w-full flex-col bg-zinc-50 pb-16 md:pb-0 dark:bg-zinc-950">
	<!-- Desktop Header Navigation -->
	<header
		class="sticky top-0 z-10 hidden h-16 items-center gap-4 border-b bg-background px-4 md:flex md:px-6"
	>
		<nav
			class="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
			<a href="/dashboard" class="flex items-center gap-2 text-lg font-semibold md:text-base">
				<span class="sr-only">Expense Tracker</span>
				🪙
			</a>
			{#each navItems as item}
				<a
					href={item.href}
					class="transition-colors hover:text-foreground {page.url.pathname === item.href
						? 'font-semibold text-foreground'
						: 'text-muted-foreground'}"
				>
					{item.name}
				</a>
			{/each}
		</nav>
		<div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
			<form method="POST" action="/dashboard?/logout" class="ml-auto">
				<Button variant="outline" size="sm" type="submit">Log out</Button>
			</form>
		</div>
	</header>

	<!-- Mobile Top Header -->
	<header
		class="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden"
	>
		<div class="flex items-center gap-2 font-semibold">🪙 Expense Tracker</div>
		<form method="POST" action="/dashboard?/logout">
			<button type="submit" class="p-2 text-muted-foreground hover:text-foreground">
				<LogOut class="h-5 w-5" />
				<span class="sr-only">Log out</span>
			</button>
		</form>
	</header>

	<main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
		{@render children()}
	</main>

	<!-- Mobile Bottom Navigation -->
	<nav class="fixed right-0 bottom-0 left-0 z-50 flex h-16 border-t bg-background md:hidden">
		{#each navItems as item}
			{@const isActive = page.url.pathname === item.href}
			<a
				href={item.href}
				class="flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors {isActive
					? 'font-medium text-primary'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<item.icon class="h-5 w-5 {isActive ? 'stroke-[2.5px]' : ''}" />
				<span>{item.name}</span>
			</a>
		{/each}
	</nav>
</div>
