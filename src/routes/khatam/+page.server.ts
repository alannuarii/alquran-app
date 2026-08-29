import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { khatamPlans, readingSessions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;
	
	if (!userId) {
		return { plans: [] };
	}

	// Fetch all khatam plans for this user
	const plans = await db
		.select()
		.from(khatamPlans)
		.where(eq(khatamPlans.userId, userId))
		.orderBy(desc(khatamPlans.createdAt));

	// Fetch all reading sessions to calculate progress for each plan
	const sessions = await db
		.select()
		.from(readingSessions)
		.where(eq(readingSessions.userId, userId));

	// Calculate progress
	const plansWithProgress = plans.map(plan => {
		const planSessions = sessions.filter(s => s.khatamPlanId === plan.id);
		const totalAyahsRead = planSessions.reduce((acc, curr) => acc + (curr.totalAyahRead || 0), 0);
		// 6236 is the total number of ayahs in the Quran
		const progressPercentage = Math.min(100, (totalAyahsRead / 6236) * 100);

		return {
			...plan,
			totalAyahsRead,
			progressPercentage,
			sessionCount: planSessions.length
		};
	});

	return {
		plans: plansWithProgress
	};
};

export const actions: Actions = {
	createPlan: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const title = data.get('title')?.toString();
		const targetDate = data.get('targetDate')?.toString();

		if (!title || !targetDate) {
			return fail(400, { error: 'Judul dan Tanggal Target wajib diisi' });
		}

		try {
			await db.insert(khatamPlans).values({
				id: randomUUID(),
				userId: locals.user.id,
				title,
				targetDate,
				isCompleted: false
			});
			return { success: true };
		} catch (e: any) {
			console.error('Error creating plan:', e);
			return fail(500, { error: 'Gagal membuat program khatam baru' });
		}
	}
};
