import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	if (event.locals.session) {
		await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
	}
	redirect(302, '/');
};
