/**
 * Supabase Management API Service
 * Handles listing projects, reading API keys, and executing SQL migrations.
 */

export interface SupabaseProject {
	id: string;
	name: string;
	ref: string;
	region: string;
	created_at: string;
	status: string;
}

export interface SupabaseApiKey {
	name: string;
	api_key: string;
}

const MANAGEMENT_API_BASE = 'https://api.supabase.com/v1';

/**
 * Lists all projects owned or accessible by the user's Supabase account.
 */
export async function listProjects(accessToken: string): Promise<SupabaseProject[]> {
	const res = await fetch(`${MANAGEMENT_API_BASE}/projects`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to list Supabase projects (${res.status}): ${err}`);
	}

	const data = (await res.json()) as SupabaseProject[];
	return data;
}

/**
 * Retrieves the API keys (specifically the `anon` public key) and project URL for a project.
 */
export async function getProjectCredentials(
	accessToken: string,
	projectRef: string
): Promise<{ anonKey: string; url: string }> {
	const res = await fetch(`${MANAGEMENT_API_BASE}/projects/${projectRef}/api-keys`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to fetch API keys for project ${projectRef} (${res.status}): ${err}`);
	}

	const keys = (await res.json()) as SupabaseApiKey[];
	const anonKeyObj = keys.find((k) => k.name === 'anon');

	if (!anonKeyObj || !anonKeyObj.api_key) {
		throw new Error(`Could not find the 'anon' public API key for project ${projectRef}.`);
	}

	return {
		anonKey: anonKeyObj.api_key,
		url: `https://${projectRef}.supabase.co`
	};
}

/**
 * Runs SQL database query/migration directly against the user's Supabase project.
 */
export async function runDatabaseMigrations(
	accessToken: string,
	projectRef: string,
	sql: string
): Promise<{ success: boolean; result?: unknown }> {
	const res = await fetch(`${MANAGEMENT_API_BASE}/projects/${projectRef}/database/query`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query: sql })
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Migration execution failed (${res.status}): ${err}`);
	}

	const result = await res.json();
	return { success: true, result };
}
