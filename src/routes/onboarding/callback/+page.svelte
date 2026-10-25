<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Database,
		CheckCircle2,
		AlertCircle,
		Loader2,
		ArrowRight,
		Server,
		ExternalLink,
		RefreshCw
	} from '@lucide/svelte';
	import {
		listProjects,
		getProjectCredentials,
		runDatabaseMigrations,
		type SupabaseProject
	} from '$lib/supabase/management';
	import { INITIAL_DATABASE_MIGRATION_SQL } from '$lib/supabase/migrations';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Step = 'exchanging_token' | 'selecting_project' | 'migrating_database' | 'complete' | 'error';

	let currentStep = $state<Step>('exchanging_token');
	let errorMessage = $state('');
	let accessToken = $state('');
	let projects = $state<SupabaseProject[]>([]);
	let selectedProject = $state<SupabaseProject | null>(null);

	let migrationStatusText = $state('Initializing migration...');
	let migrationSubText = $state('Connecting to Supabase Management API...');

	onMount(async () => {
		if (data.error) {
			currentStep = 'error';
			errorMessage = data.errorDescription || data.error || 'Authentication with Supabase was cancelled or failed.';
			return;
		}

		if (!data.code) {
			currentStep = 'error';
			errorMessage = 'Missing authorization code from Supabase.';
			return;
		}

		const savedState = sessionStorage.getItem('supabase_oauth_state');
		if (savedState && data.state && savedState !== data.state) {
			currentStep = 'error';
			errorMessage = 'Invalid OAuth state nonce. Please try connecting again for security.';
			return;
		}

		await exchangeCodeForToken(data.code);
	});

	async function exchangeCodeForToken(code: string) {
		currentStep = 'exchanging_token';
		errorMessage = '';

		try {
			const redirectUri = `${window.location.origin}/onboarding/callback`;
			const customClientId = sessionStorage.getItem('supabase_oauth_custom_client_id') || undefined;

			const response = await fetch('/api/oauth/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code,
					redirect_uri: redirectUri,
					client_id: customClientId
				})
			});

			const tokenData = await response.json();

			if (!response.ok || tokenData.error) {
				throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for token.');
			}

			accessToken = tokenData.access_token;
			await fetchUserProjects(accessToken);
		} catch (err: unknown) {
			currentStep = 'error';
			errorMessage = err instanceof Error ? err.message : 'Unknown error during token exchange.';
		}
	}

	async function fetchUserProjects(token: string) {
		try {
			const fetchedProjects = await listProjects(token);
			projects = fetchedProjects;

			if (projects.length === 0) {
				currentStep = 'selecting_project';
				return;
			}

			if (projects.length === 1) {
				// Single project found - auto-select and proceed with setup
				await handleSelectProject(projects[0]);
			} else {
				currentStep = 'selecting_project';
			}
		} catch (err: unknown) {
			currentStep = 'error';
			errorMessage = err instanceof Error ? err.message : 'Failed to retrieve your Supabase projects.';
		}
	}

	async function handleSelectProject(project: SupabaseProject) {
		selectedProject = project;
		currentStep = 'migrating_database';
		errorMessage = '';

		try {
			// Step 1: Extract API Keys
			migrationStatusText = 'Retrieving Project Credentials...';
			migrationSubText = `Fetching public API key for project "${project.name}" (${project.ref})`;
			const { anonKey, url } = await getProjectCredentials(accessToken, project.ref);

			// Step 2: Run Idempotent Migrations
			migrationStatusText = 'Provisioning Database Schema...';
			migrationSubText = 'Executing SQL tables, triggers, and Row Level Security policies...';
			await runDatabaseMigrations(accessToken, project.ref, INITIAL_DATABASE_MIGRATION_SQL);

			// Step 3: Save to LocalStorage
			migrationStatusText = 'Finalizing Setup...';
			migrationSubText = 'Saving local configuration securely to your browser...';
			localStorage.setItem('supabase_url', url);
			localStorage.setItem('supabase_anon_key', anonKey);

			// Clean up OAuth session nonces
			sessionStorage.removeItem('supabase_oauth_state');
			sessionStorage.removeItem('supabase_oauth_custom_client_id');

			currentStep = 'complete';
		} catch (err: unknown) {
			currentStep = 'error';
			errorMessage = err instanceof Error ? err.message : 'Failed to complete database setup.';
		}
	}

	function handleContinueToApp() {
		// Reload app to re-run root layout with new Supabase client
		window.location.href = '/login';
	}
</script>

<svelte:head>
	<title>Setting up Supabase | Expense Tracker</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
	<div class="w-full max-w-lg space-y-6 rounded-2xl border bg-card p-6 md:p-8 shadow-xl">
		<div class="flex flex-col items-center space-y-3 text-center">
			<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
				<Database class="h-7 w-7" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Supabase Setup</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Configuring your own database automatically.
				</p>
			</div>
		</div>

		<!-- Step 1: Exchanging Token -->
		{#if currentStep === 'exchanging_token'}
			<div class="flex flex-col items-center justify-center py-10 space-y-4 text-center">
				<Loader2 class="h-8 w-8 animate-spin text-emerald-600" />
				<div>
					<p class="font-semibold">Authorizing with Supabase...</p>
					<p class="text-xs text-muted-foreground mt-1">Exchanging authorization code for management token</p>
				</div>
			</div>
		{/if}

		<!-- Step 2: Selecting Project -->
		{#if currentStep === 'selecting_project'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-semibold">Select Supabase Project</h2>
					<span class="text-xs text-muted-foreground">{projects.length} project{projects.length === 1 ? '' : 's'} found</span>
				</div>

				{#if projects.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-center space-y-3">
						<Server class="h-8 w-8 mx-auto text-muted-foreground" />
						<div>
							<p class="font-medium text-sm">No Supabase Projects Found</p>
							<p class="text-xs text-muted-foreground mt-1">
								Please create a project in your Supabase Dashboard first, then refresh this list.
							</p>
						</div>
						<div class="flex justify-center gap-2 pt-2">
							<a
								href="https://supabase.com/dashboard/new"
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 underline"
							>
								Create Project <ExternalLink class="h-3 w-3" />
							</a>
							<Button size="sm" variant="outline" onclick={() => fetchUserProjects(accessToken)} class="gap-1.5 text-xs">
								<RefreshCw class="h-3 w-3" /> Refresh
							</Button>
						</div>
					</div>
				{:else}
					<div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
						{#each projects as project}
							<button
								type="button"
								onclick={() => handleSelectProject(project)}
								class="w-full flex items-center justify-between p-3.5 rounded-xl border bg-background hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group cursor-pointer"
							>
								<div class="space-y-0.5">
									<div class="flex items-center gap-2">
										<p class="font-semibold text-sm group-hover:text-emerald-600 transition-colors">{project.name}</p>
										<span class="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{project.region}</span>
									</div>
									<p class="text-xs font-mono text-muted-foreground">{project.ref}.supabase.co</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium {project.status === 'ACTIVE_HEALTHY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}">
										{project.status || 'Active'}
									</span>
									<ArrowRight class="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Step 3: Migrating Database -->
		{#if currentStep === 'migrating_database'}
			<div class="flex flex-col items-center justify-center py-10 space-y-4 text-center">
				<div class="relative">
					<div class="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin"></div>
					<div class="absolute inset-0 flex items-center justify-center">
						<Database class="h-5 w-5 text-emerald-600" />
					</div>
				</div>
				<div class="space-y-1">
					<p class="font-semibold text-base">{migrationStatusText}</p>
					<p class="text-xs text-muted-foreground max-w-xs mx-auto">{migrationSubText}</p>
				</div>
			</div>
		{/if}

		<!-- Step 4: Complete -->
		{#if currentStep === 'complete'}
			<div class="flex flex-col items-center justify-center py-6 space-y-4 text-center">
				<div class="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
					<CheckCircle2 class="h-8 w-8" />
				</div>
				<div>
					<h2 class="text-lg font-bold">Database Ready!</h2>
					<p class="text-xs text-muted-foreground mt-1 max-w-sm">
						Your Supabase project is connected and all database tables &amp; security policies have been provisioned successfully.
					</p>
				</div>

				<Button
					onclick={handleContinueToApp}
					class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 mt-2"
				>
					Continue to Login <ArrowRight class="h-4 w-4 ml-1.5" />
				</Button>
			</div>
		{/if}

		<!-- Error State -->
		{#if currentStep === 'error'}
			<div class="space-y-4">
				<div class="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
					<AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
					<div class="space-y-1 text-sm">
						<p class="font-semibold">Setup Encountered an Issue</p>
						<p class="text-xs leading-relaxed text-destructive/90">{errorMessage}</p>
					</div>
				</div>

				<div class="flex gap-2">
					<a href="/onboarding" class="w-full">
						<Button variant="outline" class="w-full">Back to Onboarding</Button>
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
