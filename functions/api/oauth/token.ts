/**
 * Cloudflare Pages Function for exchanging Supabase OAuth authorization code for access token.
 * Route: POST /api/oauth/token
 */

interface TokenRequestBody {
	code: string;
	redirect_uri: string;
	client_id?: string;
	client_secret?: string;
}

interface Env {
	PUBLIC_SUPABASE_OAUTH_CLIENT_ID?: string;
	SUPABASE_OAUTH_CLIENT_SECRET?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
	try {
		const body = (await context.request.json()) as TokenRequestBody;
		const { code, redirect_uri } = body;

		if (!code || !redirect_uri) {
			return new Response(
				JSON.stringify({ error: 'Missing required parameters: code, redirect_uri' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const clientId = body.client_id || context.env.PUBLIC_SUPABASE_OAUTH_CLIENT_ID || process?.env?.PUBLIC_SUPABASE_OAUTH_CLIENT_ID;
		const clientSecret = body.client_secret || context.env.SUPABASE_OAUTH_CLIENT_SECRET || process?.env?.SUPABASE_OAUTH_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			return new Response(
				JSON.stringify({
					error:
						'OAuth Client ID or Client Secret not configured. Please provide them or set SUPABASE_OAUTH_CLIENT_SECRET.'
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri
			})
		});

		const tokenData = await tokenResponse.json();

		return new Response(JSON.stringify(tokenData), {
			status: tokenResponse.status,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
