import { decodeHtmlEntities } from '$lib/utils';

const API_BASE = 'https://api.myquran.com/v3';

async function safeFetch(url: string, timeoutMs = 8000) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		const data = await res.json();
		return decodeHtmlEntities(data.data);
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
			...decodeHtmlEntities(result.data),
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

export interface DoaItem {
	id: number;
	grup: string;
	nama: string;
	ar: string;
	tr: string;
	idn: string;
	tentang: string;
	tag?: string[];
}

export async function fetchDoaList(): Promise<DoaItem[]> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);
		const res = await fetch('https://equran.id/api/doa', { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		const result = await res.json();
		return decodeHtmlEntities(result.data || []);
	} catch (e) {
		console.error('Failed to fetch doa list:', e);
		return [];
	}
}

export interface HaditsArbainItem {
	no: string;
	judul: string;
	arab: string;
	indo: string;
	tema?: string;
}

export interface PerawiItem {
	name: string;
	slug: string;
	total: number;
}

export interface HaditsPerawiDetail {
	number: number;
	arab: string;
	id: string;
	perawi?: {
		name: string;
		slug: string;
		total: number;
	};
}

export async function fetchHaditsArbainList(): Promise<HaditsArbainItem[]> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);
		const res = await fetch('https://api.myquran.com/v2/hadits/arbain/semua', { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		const result = await res.json();
		return decodeHtmlEntities(result.data || []);
	} catch (e) {
		console.error('Failed to fetch hadits arbain:', e);
		return [];
	}
}

export async function fetchHaditsPerawiList(): Promise<PerawiItem[]> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);
		const res = await fetch('https://api.myquran.com/v2/hadits/perawi', { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		const result = await res.json();
		return decodeHtmlEntities(result.data || []);
	} catch (e) {
		console.error('Failed to fetch perawi list:', e);
		return [];
	}
}

export async function fetchHaditsDetail(perawiSlug: string, nomor: number): Promise<HaditsPerawiDetail | null> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);
		const res = await fetch(`https://api.myquran.com/v2/hadits/${perawiSlug}/${nomor}`, { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		const result = await res.json();
		return {
			...decodeHtmlEntities(result.data),
			perawi: result.info?.perawi
		};
	} catch (e) {
		console.error(`Failed to fetch hadits ${perawiSlug} ${nomor}:`, e);
		return null;
	}
}


