<script lang="ts">
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Users, Mail, Trash2, UserPlus } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	let loading = $state(false);
	let selectedRole = $state('member');
	let errorMsg = $state('');
	
	let inviteEmail = $state('');
	let renameGroupName = $state(data.group.name);

	async function handleRemoveMember(userId: string) {
		loading = true;
		errorMsg = '';
		const { error } = await data.supabase!
			.from('group_members')
			.delete()
			.eq('group_id', data.group.id)
			.eq('user_id', userId);

		loading = false;
		if (error) {
			errorMsg = error.message;
		} else {
			if (userId === data.user?.id) {
				goto('/groups');
			} else {
				invalidateAll();
			}
		}
	}

	async function handleInvite(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		const { error } = await data.supabase!.from('group_invitations').insert({
			group_id: data.group.id,
			email: inviteEmail,
			role: selectedRole,
			invited_by: data.user!.id
		});

		loading = false;
		if (error) {
			errorMsg = error.message;
		} else {
			inviteEmail = '';
			invalidateAll();
		}
	}

	async function handleRevokeInvite(inviteId: string) {
		loading = true;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('group_invitations')
			.delete()
			.eq('id', inviteId)
			.eq('group_id', data.group.id);

		loading = false;
		if (error) {
			errorMsg = error.message;
		} else {
			invalidateAll();
		}
	}

	async function handleUpdateGroup(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('groups')
			.update({ name: renameGroupName })
			.eq('id', data.group.id);

		loading = false;
		if (error) {
			errorMsg = error.message;
		} else {
			invalidateAll();
		}
	}

	async function handleDeleteGroup(e: Event) {
		e.preventDefault();
		if (!confirm('Are you sure you want to delete this entire group? This action cannot be undone.')) {
			return;
		}

		loading = true;
		errorMsg = '';

		const { error } = await data.supabase!
			.from('groups')
			.delete()
			.eq('id', data.group.id);

		loading = false;
		if (error) {
			errorMsg = error.message;
		} else {
			goto('/groups');
		}
	}
</script>

<div class="mx-auto mt-8 max-w-4xl space-y-8">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<div class="text-3xl bg-muted h-16 w-16 flex items-center justify-center rounded-full">
				<Users class="h-8 w-8" />
			</div>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">{data.group.name}</h2>
				<p class="text-muted-foreground">{data.members.length} member{data.members.length === 1 ? '' : 's'}</p>
			</div>
		</div>
		<a href="/groups" class={buttonVariants({ variant: 'outline' })}>Back</a>
	</div>

	{#if errorMsg}
		<div class="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-medium text-destructive">
			{errorMsg}
		</div>
	{/if}

	<div class="grid gap-8 md:grid-cols-2">
		<!-- Members List -->
		<div class="space-y-6">
			<div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
				<h3 class="text-xl font-semibold mb-4">Members</h3>
				<div class="space-y-4">
					{#each data.members as member}
						<div class="flex items-center justify-between py-2 border-b last:border-0">
							<div>
								<p class="font-medium">{member.profiles?.full_name || 'Anonymous User'}</p>
								<p class="text-sm text-muted-foreground">{member.profiles?.email}</p>
							</div>
							<div class="flex items-center gap-2">
								<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
									{member.role.charAt(0).toUpperCase() + member.role.slice(1)}
								</span>
								{#if data.isAdmin && member.user_id !== data.user?.id}
									<Button type="button" variant="ghost" size="icon" class="text-destructive hover:text-destructive hover:bg-destructive/10" onclick={() => handleRemoveMember(member.user_id)} disabled={loading}>
										<Trash2 class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Leave Group -->
			<div class="text-right">
				<Button type="button" variant="destructive" onclick={() => handleRemoveMember(data.user!.id)} disabled={loading}>Leave Group</Button>
			</div>
		</div>

		<!-- Invites -->
		{#if data.isAdmin}
			<div class="space-y-6">
				<div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
					<h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
						<UserPlus class="h-5 w-5" />
						Invite New Member
					</h3>
					<form onsubmit={handleInvite} class="space-y-4">
						<div class="space-y-2">
							<Label for="email">Email Address</Label>
							<Input id="email" type="email" bind:value={inviteEmail} placeholder="friend@example.com" required />
						</div>

						<div class="space-y-2">
							<Label for="role">Role</Label>
							<Select.Root type="single" bind:value={selectedRole}>
								<Select.Trigger>
									{selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="member">Member</Select.Item>
									<Select.Item value="admin">Admin</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<Button type="submit" class="w-full" disabled={loading}>
							{loading ? 'Sending Invite...' : 'Send Invitation'}
						</Button>
					</form>
				</div>

				{#if data.invitations.length > 0}
					<div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
						<h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
							<Mail class="h-5 w-5" />
							Pending Invitations
						</h3>
						<div class="space-y-4">
							{#each data.invitations as inv}
								<div class="flex items-center justify-between py-2 border-b last:border-0">
									<div>
										<p class="font-medium">{inv.email}</p>
										<p class="text-sm text-muted-foreground">Role: {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}</p>
									</div>
									<Button type="button" variant="ghost" size="sm" class="text-destructive" onclick={() => handleRevokeInvite(inv.id)} disabled={loading}>Revoke</Button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Group Settings (Admin Only) -->
			<div class="space-y-6">
				<div class="rounded-xl border border-destructive/20 bg-card p-6 text-card-foreground shadow">
					<h3 class="text-xl font-semibold mb-4 text-destructive">Group Settings</h3>
					<form onsubmit={handleUpdateGroup} class="space-y-4 mb-6">
						<div class="space-y-2">
							<Label for="group_name">Rename Group</Label>
							<div class="flex gap-2">
								<Input id="group_name" bind:value={renameGroupName} required />
								<Button type="submit" variant="secondary" disabled={loading}>Rename</Button>
							</div>
						</div>
					</form>
					<form onsubmit={handleDeleteGroup}>
						<Button type="submit" variant="destructive" class="w-full" disabled={loading}>Delete Group</Button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
