<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Users, Mail } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	let loadingId = $state('');
	let errorMsg = $state('');

	async function handleAccept(invId: string, groupId: string, role: string) {
		loadingId = invId;
		errorMsg = '';

		const { error: insertError } = await data.supabase!.from('group_members').insert({
			group_id: groupId,
			user_id: data.user!.id,
			role: role
		});

		if (insertError) {
			errorMsg = insertError.message;
			loadingId = '';
			return;
		}

		const { error: deleteError } = await data.supabase!
			.from('group_invitations')
			.delete()
			.eq('id', invId);

		loadingId = '';
		
		if (deleteError) {
			errorMsg = deleteError.message;
		} else {
			invalidateAll();
		}
	}

	async function handleDecline(invId: string) {
		loadingId = invId;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('group_invitations')
			.delete()
			.eq('id', invId);

		loadingId = '';
		
		if (error) {
			errorMsg = error.message;
		} else {
			invalidateAll();
		}
	}
</script>

<div class="flex items-center justify-between space-y-2 mb-6">
	<h2 class="text-3xl font-bold tracking-tight">Shared Groups</h2>
	<a href="/groups/new" class={buttonVariants()}>Create Group</a>
</div>

{#if errorMsg}
	<div class="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-medium text-destructive">
		{errorMsg}
	</div>
{/if}

{#if data.invitations.length > 0}
	<div class="mb-8">
		<h3 class="text-lg font-semibold mb-4">Pending Invitations</h3>
		<div class="space-y-4">
			{#each data.invitations as inv}
				<div class="rounded-xl border border-primary/50 bg-primary/5 text-card-foreground p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
					<div class="flex items-center gap-4">
						<div class="bg-primary/20 p-2 rounded-full text-primary">
							<Mail class="h-6 w-6" />
						</div>
						<div>
							<p class="font-medium">You were invited to <strong>{inv.groups?.name}</strong></p>
							<p class="text-sm text-muted-foreground">Role: {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}</p>
						</div>
					</div>
					<div class="flex gap-2">
						<Button type="button" size="sm" onclick={() => handleAccept(inv.id, inv.group_id, inv.role)} disabled={loadingId === inv.id}>Accept</Button>
						<Button type="button" variant="outline" size="sm" onclick={() => handleDecline(inv.id)} disabled={loadingId === inv.id}>Decline</Button>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<div>
	<h3 class="text-lg font-semibold mb-4">Your Groups</h3>
	{#if data.groups.length === 0}
		<div class="text-center py-12 border rounded-xl bg-card border-dashed">
			<Users class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
			<h3 class="text-lg font-medium mb-2">No Groups Yet</h3>
			<p class="text-muted-foreground mb-4 max-w-sm mx-auto">Create a shared group to track expenses with your partner, roommates, or friends.</p>
			<a href="/groups/new" class={buttonVariants()}>Create your first Group</a>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.groups as group}
				<a href="/groups/{group.id}" class="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between hover:border-primary transition-colors cursor-pointer group">
					<div class="flex items-center gap-4 mb-4">
						<div class="text-3xl bg-muted h-14 w-14 flex items-center justify-center rounded-full group-hover:bg-primary/10 transition-colors">
							<Users class="h-6 w-6" />
						</div>
						<div class="flex-1">
							<p class="font-medium text-lg">{group.name}</p>
							<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mt-1 text-muted-foreground">
								{group.group_members[0].role.charAt(0).toUpperCase() + group.group_members[0].role.slice(1)}
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
