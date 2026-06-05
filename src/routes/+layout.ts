import { createBrowserClient } from '@supabase/ssr';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = async ({ fetch, depends, url }) => {
	depends('supabase:auth');

	if (!browser) {
		return { supabase: null, session: null, user: null };
	}

	const supabaseUrl = localStorage.getItem('supabase_url');
	const supabaseAnonKey = localStorage.getItem('supabase_anon_key');

	if (!supabaseUrl || !supabaseAnonKey) {
		if (url.pathname !== '/onboarding') {
			throw redirect(303, '/onboarding');
		}
		return { supabase: null, session: null, user: null };
	}

	const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
		global: { fetch }
	});

	const {
		data: { session }
	} = await supabase!.auth.getSession();

	const user = session?.user ?? null;

	if (!user && url.pathname !== '/login' && url.pathname !== '/register' && url.pathname !== '/onboarding') {
		throw redirect(303, '/login');
	}

	return { supabase, session, user };
};
