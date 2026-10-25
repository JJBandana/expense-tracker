<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Database, Zap, ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from '@lucide/svelte';

	let supabaseUrl = $state('');
	let supabaseAnonKey = $state('');
	let customClientId = $state('');
	let showManual = $state(false);
	let showAdvancedOAuth = $state(false);
	let error = $state('');
	let isConnectingOAuth = $state(false);

	const defaultClientId = (import.meta.env.PUBLIC_SUPABASE_OAUTH_CLIENT_ID as string) || '';

	function handleConnectOAuth() {
		error = '';
		const clientId = (customClientId || defaultClientId).trim();

		if (!clientId) {
			showAdvancedOAuth = true;
			error = 'Please provide your Supabase OAuth App Client ID below to connect.';
			return;
		}

		isConnectingOAuth = true;
		const state = crypto.randomUUID();
		sessionStorage.setItem('supabase_oauth_state', state);
		if (customClientId.trim()) {
			sessionStorage.setItem('supabase_oauth_custom_client_id', customClientId.trim());
		}

		const redirectUri = `${window.location.origin}/onboarding/callback`;
		const authorizeUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
		authorizeUrl.searchParams.set('client_id', clientId);
		authorizeUrl.searchParams.set('redirect_uri', redirectUri);
		authorizeUrl.searchParams.set('response_type', 'code');
		authorizeUrl.searchParams.set('state', state);
		authorizeUrl.searchParams.set('scope', 'all');

		window.location.href = authorizeUrl.toString();
	}

	async function handleManualSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
			error = 'Please enter a valid Supabase Project URL (e.g. https://xyz.supabase.co).';
			return;
		}

		if (!supabaseAnonKey.startsWith('ey')) {
			error = 'Please enter a valid Supabase Anon Key (starts with "ey").';
			return;
		}

		localStorage.setItem('supabase_url', supabaseUrl.trim());
		localStorage.setItem('supabase_anon_key', supabaseAnonKey.trim());

		// Reload to initialize Supabase client in root layout
		window.location.href = '/login';
	}
</script>

<svelte:head>
	<title>Connect your Database | Expense Tracker</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
	<div class="w-full max-w-lg space-y-6 rounded-2xl border bg-card p-6 md:p-8 shadow-xl">
		<div class="flex flex-col items-center space-y-3 text-center">
			<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
				<Database class="h-7 w-7" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Connect Your Supabase</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Bring your own Supabase project. You retain 100% ownership and privacy of your data.
				</p>
			</div>
		</div>

		{#if error}
			<div class="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm font-medium text-destructive">
				{error}
			</div>
		{/if}

		<!-- Primary 1-Click OAuth Option -->
		<div class="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
			<div class="flex items-start gap-3">
				<div class="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400">
					<Zap class="h-5 w-5" />
				</div>
				<div>
					<h2 class="text-base font-semibold">1-Click Fast Connect (OAuth)</h2>
					<p class="text-xs text-muted-foreground mt-0.5">
						Automatically discovers your projects, extracts your API keys, and provisions your database schema.
					</p>
				</div>
			</div>

			<Button
				onclick={handleConnectOAuth}
				disabled={isConnectingOAuth}
				class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all h-11"
			>
				{#if isConnectingOAuth}
					Redirecting to Supabase...
				{:else}
					<span class="flex items-center justify-center gap-2">
						<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24">
							<path d="M21.362 9.354H12v-7.2a.6.6 0 0 0-1.077-.375l-8.4 10.8A.6.6 0 0 0 3 13.646h9.362v7.2a.6.6 0 0 0 1.077.375l8.4-10.8a.6.6 0 0 0-.477-1.067z"/>
						</svg>
						Connect with Supabase
					</span>
				{/if}
			</Button>

			<!-- Advanced OAuth toggle if no default client ID configured or self-hosted -->
			<div class="text-center">
				<button
					type="button"
					onclick={() => (showAdvancedOAuth = !showAdvancedOAuth)}
					class="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
				>
					<span>{showAdvancedOAuth ? 'Hide Custom OAuth Client ID' : 'Using a custom Supabase OAuth App?'}</span>
					{#if showAdvancedOAuth}
						<ChevronUp class="h-3 w-3" />
					{:else}
						<ChevronDown class="h-3 w-3" />
					{/if}
				</button>
			</div>

			{#if showAdvancedOAuth}
				<div class="space-y-2 pt-2 border-t border-emerald-500/20">
					<Label for="custom_client_id" class="text-xs">Custom OAuth Client ID</Label>
					<Input
						id="custom_client_id"
						placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
						bind:value={customClientId}
						class="text-xs h-9 bg-background"
					/>
					<p class="text-[11px] text-muted-foreground">
						Created in your <a href="https://supabase.com/dashboard/account/apps" target="_blank" rel="noopener noreferrer" class="underline hover:text-emerald-500 inline-flex items-center gap-0.5">Supabase Dashboard Apps <ExternalLink class="h-2.5 w-2.5" /></a> with redirect URI <code class="bg-muted px-1 py-0.5 rounded text-[10px]">/onboarding/callback</code>.
					</p>
				</div>
			{/if}
		</div>

		<!-- Divider -->
		<div class="relative my-4">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t"></span>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-card px-3 text-muted-foreground font-medium">Or connect manually</span>
			</div>
		</div>

		<!-- Manual Connection Form (Collapsible) -->
		<div class="rounded-xl border bg-card/60 p-4">
			<button
				type="button"
				onclick={() => (showManual = !showManual)}
				class="flex w-full items-center justify-between text-left text-sm font-medium hover:text-primary transition-colors"
			>
				<span class="flex items-center gap-2">
					<ShieldCheck class="h-4 w-4 text-muted-foreground" />
					Manual Project URL & Anon Key
				</span>
				{#if showManual}
					<ChevronUp class="h-4 w-4 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-4 w-4 text-muted-foreground" />
				{/if}
			</button>

			{#if showManual}
				<form onsubmit={handleManualSubmit} class="space-y-4 pt-4 mt-3 border-t">
					<div class="space-y-1.5">
						<Label for="url" class="text-xs">Supabase Project URL</Label>
						<Input
							id="url"
							type="url"
							placeholder="https://xxxxxx.supabase.co"
							bind:value={supabaseUrl}
							required
						/>
					</div>

					<div class="space-y-1.5">
						<Label for="key" class="text-xs">Supabase Anon Key</Label>
						<Input
							id="key"
							type="password"
							placeholder="eyJh..."
							bind:value={supabaseAnonKey}
							required
						/>
						<p class="text-[11px] text-muted-foreground">
							Found in Supabase Dashboard under <strong>Project Settings &gt; API</strong>.
						</p>
					</div>

					<Button type="submit" variant="secondary" class="w-full">
						Save &amp; Connect Manually
					</Button>

					<p class="text-[11px] text-muted-foreground">
						Manual setup does not create tables. Run the initial schema in the
						<a
							href="https://supabase.com/dashboard/project/_/sql/new"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-foreground">Supabase SQL Editor</a
						>
						before connecting.
					</p>
				</form>
			{/if}
		</div>

		<div class="text-center text-xs text-muted-foreground">
			<p>Your credentials are saved securely in your browser's LocalStorage.</p>
			<p>They are never transmitted to any centralized backend.</p>
		</div>
	</div>
</div>
