import type { PageServerLoad } from './$types';
import { fetchQuranRandomAyah } from '$lib/api';
import { db } from '$lib/server/db';
import { lastRead, khatamPlans, readingSessions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	let randomAyah = null;
	try {
		randomAyah = await fetchQuranRandomAyah();
	} catch (e) {
		console.error('Failed to fetch random ayah', e);
	}

	const ayahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

	let userLastRead = null;
	let activeKhatamPlan = null;

	if (locals.user) {
		// 1. Ambil data Last Read reguler
		const result = await db.select().from(lastRead).where(eq(lastRead.userId, locals.user.id));
		if (result.length > 0) {
			const lr = result[0];
			let nextSurah = lr.surahNumber;
			let nextAyah = lr.ayahNumber + 1;
			const totalInSurah = ayahCounts[lr.surahNumber - 1] || 7;
			
			if (nextAyah > totalInSurah) {
				if (lr.surahNumber < 114) {
					nextSurah = lr.surahNumber + 1;
					nextAyah = 1;
				} else {
					nextSurah = 1;
					nextAyah = 1;
				}
			}

			userLastRead = {
				...lr,
				nextSurah,
				nextAyah,
				targetPage: Math.ceil(nextAyah / 10)
			};
		}

		// 2. Ambil data Program Khatam Terakhir (1 program saja)
		const plans = await db
			.select()
			.from(khatamPlans)
			.where(eq(khatamPlans.userId, locals.user.id))
			.orderBy(desc(khatamPlans.createdAt))
			.limit(1);

		if (plans.length > 0) {
			const plan = plans[0];
			const sessions = await db
				.select()
				.from(readingSessions)
				.where(eq(readingSessions.khatamPlanId, plan.id))
				.orderBy(desc(readingSessions.createdAt));

			const totalAyahsRead = sessions.reduce((acc, curr) => acc + (curr.totalAyahRead || 0), 0);
			const progressPercentage = Math.min(100, (totalAyahsRead / 6236) * 100);

			let nextSurah = 1;
			let nextAyah = 1;

			if (sessions.length > 0) {
				const lastSession = sessions[0];
				const lastSurah = lastSession.endSurah;
				const lastAyah = lastSession.endAyah;
				const totalInLastSurah = ayahCounts[lastSurah - 1] || 7;

				if (lastAyah < totalInLastSurah) {
					nextSurah = lastSurah;
					nextAyah = lastAyah + 1;
				} else {
					if (lastSurah < 114) {
						nextSurah = lastSurah + 1;
						nextAyah = 1;
					} else {
						nextSurah = 1;
						nextAyah = 1;
					}
				}
			}

			activeKhatamPlan = {
				...plan,
				totalAyahsRead,
				progressPercentage,
				sessionCount: sessions.length,
				nextSurah,
				nextAyah,
				targetPage: Math.ceil(nextAyah / 10)
			};
		}
	}

	return {
		randomAyah,
		userLastRead,
		activeKhatamPlan
	};
};
