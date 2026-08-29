import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session') ?? null;
	
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await validateSessionToken(token);
		if (session !== null) {
			setSessionTokenCookie(event, token, session.expiresAt);
		} else {
			deleteSessionTokenCookie(event);
		}
		event.locals.session = session;
		event.locals.user = user;
	}

	// Route Guard
	const pathname = event.url.pathname;
	const isAuthRoute = pathname === '/login' || pathname.startsWith('/login/') || pathname.startsWith('/auth/') || pathname === '/logout' || pathname.startsWith('/api/');

	if (!event.locals.user && !isAuthRoute) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && pathname === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
