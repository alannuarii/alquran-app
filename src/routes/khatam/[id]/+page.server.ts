import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { khatamPlans, readingSessions } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user?.id;
	
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const planId = params.id;

	const planResult = await db
		.select()
		.from(khatamPlans)
		.where(eq(khatamPlans.id, planId));

	if (planResult.length === 0) {
		throw error(404, 'Program khatam tidak ditemukan');
	}

	const plan = planResult[0];

	if (plan.userId !== userId) {
		throw error(403, 'Forbidden');
	}

	// Ambil semua riwayat sesi
	const sessions = await db
		.select()
		.from(readingSessions)
		.where(eq(readingSessions.khatamPlanId, planId))
		.orderBy(desc(readingSessions.createdAt));

	const totalAyahsRead = sessions.reduce((acc, curr) => acc + (curr.totalAyahRead || 0), 0);
	const progressPercentage = Math.min(100, (totalAyahsRead / 6236) * 100);

	const ayahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

	// Tentukan dari surah dan ayat mana user harus melanjutkan
	let nextSurahToRead = 1;
	let nextAyahToRead = 1;
	let targetPage = 1;

	if (sessions.length > 0) {
		const lastSession = sessions[0];
		const lastSurah = lastSession.endSurah;
		const lastAyah = lastSession.endAyah;
		const totalInLastSurah = ayahCounts[lastSurah - 1] || 7;

		if (lastAyah < totalInLastSurah) {
			nextSurahToRead = lastSurah;
			nextAyahToRead = lastAyah + 1;
		} else {
			// Jika sudah ayat terakhir di surah tersebut, lanjut ke surah berikutnya ayat 1
			if (lastSurah < 114) {
				nextSurahToRead = lastSurah + 1;
				nextAyahToRead = 1;
			} else {
				nextSurahToRead = 1;
				nextAyahToRead = 1;
			}
		}
		targetPage = Math.ceil(nextAyahToRead / 10);
	}

	return {
		plan: {
			...plan,
			totalAyahsRead,
			progressPercentage,
			sessionCount: sessions.length,
			nextSurahToRead,
			nextAyahToRead,
			targetPage
		},
		sessions
	};
};

export const actions: Actions = {
	deletePlan: async ({ params, locals }) => {
		const userId = locals.user?.id;
		if (!userId) {
			return fail(401, { error: 'Unauthorized' });
		}

		const planId = params.id;

		// 1. Verifikasi kepemilikan program khatam
		const planResult = await db
			.select()
			.from(khatamPlans)
			.where(and(eq(khatamPlans.id, planId), eq(khatamPlans.userId, userId)));

		if (planResult.length === 0) {
			return fail(404, { error: 'Program khatam tidak ditemukan atau Anda tidak memiliki akses' });
		}

		try {
			// 2. Cascade delete: hapus semua reading_sessions yang terkait dengan plan ini
			await db.delete(readingSessions).where(eq(readingSessions.khatamPlanId, planId));

			// 3. Hapus data program khatam
			await db.delete(khatamPlans).where(and(eq(khatamPlans.id, planId), eq(khatamPlans.userId, userId)));
		} catch (err) {
			console.error('Failed to delete khatam plan:', err);
			return fail(500, { error: 'Gagal menghapus program khatam' });
		}

		// 4. Redirect kembali ke daftar program khatam
		throw redirect(303, '/khatam');
	}
};
