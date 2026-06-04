<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Users, Mail, Trash2, UserPlus } from '@lucide/svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	
	let loading = $state(false);
	let selectedRole = $state('member');
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

	{#if form?.message}
		<div class="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-medium text-destructive">
			{form.message}
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
									<form method="POST" action="?/removeMember" use:enhance>
										<input type="hidden" name="user_id" value={member.user_id} />
										<Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive hover:bg-destructive/10">
											<Trash2 class="h-4 w-4" />
										</Button>
									</form>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Leave Group -->
			<form method="POST" action="?/removeMember" use:enhance class="text-right">
				<input type="hidden" name="user_id" value={data.user?.id} />
				<Button type="submit" variant="destructive">Leave Group</Button>
			</form>
		</div>

		<!-- Invites -->
		{#if data.isAdmin}
			<div class="space-y-6">
				<div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
					<h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
						<UserPlus class="h-5 w-5" />
						Invite New Member
					</h3>
					<form
						method="POST"
						action="?/invite"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								update();
							};
						}}
						class="space-y-4"
					>
						<div class="space-y-2">
							<Label for="email">Email Address</Label>
							<Input id="email" name="email" type="email" placeholder="friend@example.com" required />
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
							<input type="hidden" name="role" value={selectedRole} />
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
									<form method="POST" action="?/revokeInvite" use:enhance>
										<input type="hidden" name="invitation_id" value={inv.id} />
										<Button type="submit" variant="ghost" size="sm" class="text-destructive">Revoke</Button>
									</form>
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
					<form
						method="POST"
						action="?/updateGroup"
						use:enhance
						class="space-y-4 mb-6"
					>
						<div class="space-y-2">
							<Label for="group_name">Rename Group</Label>
							<div class="flex gap-2">
								<Input id="group_name" name="name" value={data.group.name} required />
								<Button type="submit" variant="secondary">Rename</Button>
							</div>
						</div>
					</form>
					<form
						method="POST"
						action="?/deleteGroup"
						use:enhance={(e) => {
							if (!confirm('Are you sure you want to delete this entire group? This action cannot be undone.')) {
								e.cancel();
							}
						}}
					>
						<Button type="submit" variant="destructive" class="w-full">Delete Group</Button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
