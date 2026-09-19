import type { PageServerLoad } from './$types';
import { fetchHaditsArbainList, fetchHaditsPerawiList, type HaditsArbainItem, type PerawiItem } from '$lib/api';

// Pemetaan tema kategori untuk 42 Hadits Arba'in An-Nawawi
const temaMap: Record<number, string> = {
	1: "Niat & Keimanan",
	2: "Niat & Keimanan",
	3: "Ibadah & Syariat",
	4: "Niat & Keimanan",
	5: "Ibadah & Syariat",
	6: "Halal, Haram & Wara'",
	7: "Zuhud, Hati & Ampunan",
	8: "Halal, Haram & Wara'",
	9: "Ibadah & Syariat",
	10: "Halal, Haram & Wara'",
	11: "Halal, Haram & Wara'",
	12: "Halal, Haram & Wara'",
	13: "Akhlak & Muamalah",
	14: "Halal, Haram & Wara'",
	15: "Akhlak & Muamalah",
	16: "Akhlak & Muamalah",
	17: "Akhlak & Muamalah",
	18: "Akhlak & Muamalah",
	19: "Zuhud, Hati & Ampunan",
	20: "Akhlak & Muamalah",
	21: "Niat & Keimanan",
	22: "Ibadah & Syariat",
	23: "Niat & Keimanan",
	24: "Zuhud, Hati & Ampunan",
	25: "Zuhud, Hati & Ampunan",
	26: "Akhlak & Muamalah",
	27: "Akhlak & Muamalah",
	28: "Ibadah & Syariat",
	29: "Ibadah & Syariat",
	30: "Ibadah & Syariat",
	31: "Zuhud, Hati & Ampunan",
	32: "Halal, Haram & Wara'",
	33: "Halal, Haram & Wara'",
	34: "Akhlak & Muamalah",
	35: "Akhlak & Muamalah",
	36: "Akhlak & Muamalah",
	37: "Zuhud, Hati & Ampunan",
	38: "Ibadah & Syariat",
	39: "Zuhud, Hati & Ampunan",
	40: "Zuhud, Hati & Ampunan",
	41: "Zuhud, Hati & Ampunan",
	42: "Zuhud, Hati & Ampunan",
};

export const load: PageServerLoad = async () => {
	let rawHadits: HaditsArbainItem[] = [];
	let perawiList: PerawiItem[] = [];

	try {
		const [haditsRes, perawiRes] = await Promise.all([
			fetchHaditsArbainList(),
			fetchHaditsPerawiList()
		]);

		rawHadits = haditsRes;
		perawiList = perawiRes;
	} catch (e) {
		console.error('Failed to load hadits data:', e);
	}

	// Enrich hadits dengan tema kategori
	const arbainList = rawHadits.map((item) => {
		const noNum = parseInt(item.no, 10);
		return {
			...item,
			tema: temaMap[noNum] || 'Umum & Faedah'
		};
	});

	return {
		arbainList,
		perawiList
	};
};
