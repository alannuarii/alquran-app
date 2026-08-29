import { google, generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { decodeIdToken } from 'arctic';

export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	
	const storedState = event.cookies.get('google_oauth_state') ?? null;
	const codeVerifier = event.cookies.get('google_oauth_code_verifier') ?? null;

	if (code === null || state === null || storedState === null || codeVerifier === null) {
		return new Response('Invalid request', { status: 400 });
	}

	if (state !== storedState) {
		return new Response('Invalid state', { status: 400 });
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const claims = decodeIdToken(tokens.idToken()) as Record<string, any>;
		
		const googleUserId = claims.sub as string;
		const name = claims.name as string;
		const email = claims.email as string;
		const picture = claims.picture as string | undefined;

		const existingUser = await db.select().from(users).where(eq(users.id, googleUserId));

		if (existingUser.length > 0) {
			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, googleUserId);
			setSessionTokenCookie(event, sessionToken, session.expiresAt);
			return new Response(null, {
				status: 302,
				headers: {
					Location: '/'
				}
			});
		}

		// check if email exists (due to migration)
		const existingEmail = await db.select().from(users).where(eq(users.email, email));
		let finalUserId = googleUserId;

		if (existingEmail.length > 0) {
			// Update existing user from migration to have the correct google ID and picture
			finalUserId = existingEmail[0].id; // We keep the old ID if it's already there
			await db.update(users).set({
				name,
				picture,
				updatedAt: new Date()
			}).where(eq(users.email, email));
		} else {
			await db.insert(users).values({
				id: googleUserId,
				email,
				name,
				picture,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, finalUserId);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	} catch (e) {
		console.error(e);
		return new Response('Invalid request or Google Auth error', { status: 400 });
	}
};
