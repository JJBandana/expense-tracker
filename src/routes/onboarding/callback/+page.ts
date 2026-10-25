import type { PageLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: PageLoad = async ({ url }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	return {
		code,
		state,
		error,
		errorDescription
	};
};
