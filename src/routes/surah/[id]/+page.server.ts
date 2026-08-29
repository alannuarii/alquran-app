import type { PageServerLoad, Actions } from './$types';
import { fetchQuranSurahDetail } from '$lib/api';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingSessions, lastRead, khatamPlans } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ params, url }) => {
	const surahId = parseInt(params.id);
	if (isNaN(surahId) || surahId < 1 || surahId > 114) {
		throw error(404, 'Surah tidak ditemukan');
	}

	const khatamPlanId = url.searchParams.get('khatam_plan_id');
	const page = parseInt(url.searchParams.get('page') || '1');

	try {
		const surahDetail = await fetchQuranSurahDetail(surahId, isNaN(page) ? 1 : page);
		return {
			surah: surahDetail,
			khatamPlanId,
			currentPage: isNaN(page) ? 1 : page
		};
	} catch (e) {
		console.error('Failed to fetch surah detail', e);
		throw error(500, 'Gagal mengambil data surah');
	}
};

export const actions: Actions = {
	saveSession: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const khatamPlanId = data.get('khatamPlanId')?.toString();
		const startSurah = parseInt(data.get('startSurah')?.toString() || '0');
		const startAyah = parseInt(data.get('startAyah')?.toString() || '0');
		const endSurah = parseInt(params.id);
		const endAyah = parseInt(data.get('endAyah')?.toString() || '0');

		if (!khatamPlanId || !startSurah || !startAyah || !endSurah || !endAyah) {
			return fail(400, { error: 'Data sesi tidak lengkap' });
		}

		// Kalkulasi totalAyahRead
		const ayahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
		
		let totalAyahRead = 0;
		if (startSurah === endSurah) {
			totalAyahRead = (endAyah >= startAyah) ? (endAyah - startAyah + 1) : 0;
		} else if (startSurah < endSurah) {
			// Ayat di surah pertama (dari startAyah sampai akhir surah)
			const firstSurahTotal = ayahCounts[startSurah - 1];
			totalAyahRead += (firstSurahTotal - startAyah + 1);
			
			// Surah-surah di tengah
			for (let i = startSurah + 1; i < endSurah; i++) {
				totalAyahRead += ayahCounts[i - 1];
			}
			
			// Ayat di surah terakhir
			totalAyahRead += endAyah;
		}

		try {
			// Simpan sesi
			await db.insert(readingSessions).values({
				id: randomUUID(),
				userId: locals.user.id,
				khatamPlanId,
				startSurah,
				startAyah,
				endSurah,
				endAyah,
				totalAyahRead
			});

			// Update Last Read
			const existingLastRead = await db.select().from(lastRead).where(eq(lastRead.userId, locals.user.id));
			if (existingLastRead.length > 0) {
				await db.update(lastRead).set({
					surahNumber: endSurah,
					ayahNumber: endAyah,
					updatedAt: new Date()
				}).where(eq(lastRead.userId, locals.user.id));
			} else {
				await db.insert(lastRead).values({
					userId: locals.user.id,
					surahNumber: endSurah,
					ayahNumber: endAyah
				});
			}

			return { success: true };
		} catch (e: any) {
			console.error('Error saving reading session:', e);
			return fail(500, { error: 'Gagal menyimpan sesi bacaan' });
		}
	}
};
