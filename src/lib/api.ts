const API_BASE = 'https://api.myquran.com/v3';

async function safeFetch(url: string, timeoutMs = 8000) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		const data = await res.json();
		return data.data;
	} catch (err) {
		clearTimeout(timeoutId);
		throw err;
	}
}

export async function fetchQuranSurahs() {
	try {
		return await safeFetch(`${API_BASE}/quran`);
	} catch (e) {
		console.error('Failed to fetch surahs:', e);
		return [];
	}
}

export async function fetchQuranSurahDetail(surahNumber: number, page: number = 1) {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);
		const res = await fetch(`${API_BASE}/quran/${surahNumber}?page=${page}`, { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		const result = await res.json();
		return {
			...result.data,
			pagination: result.pagination
		};
	} catch (e) {
		console.error(`Failed to fetch surah ${surahNumber}:`, e);
		throw e;
	}
}

export async function fetchQuranRandomAyah() {
	try {
		return await safeFetch(`${API_BASE}/quran/random`);
	} catch (e) {
		console.error('Failed to fetch random ayah:', e);
		return null;
	}
}

export async function fetchSholatSchedule(cityId: string, yearMonth: string) {
	try {
		return await safeFetch(`${API_BASE}/sholat/jadwal/${cityId}/${yearMonth}`);
	} catch (e) {
		console.error('Failed to fetch sholat schedule:', e);
		return null;
	}
}

export async function fetchSholatCities() {
	try {
		return await safeFetch(`${API_BASE}/sholat/kabkota/semua`);
	} catch (e) {
		console.error('Failed to fetch sholat cities:', e);
		return [];
	}
}
