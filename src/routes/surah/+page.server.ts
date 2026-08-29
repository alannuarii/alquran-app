import type { PageServerLoad } from './$types';
import { fetchQuranSurahs } from '$lib/api';

export const load: PageServerLoad = async () => {
	let surahs = [];
	try {
		surahs = await fetchQuranSurahs();
	} catch (e) {
		console.error('Failed to fetch surahs', e);
	}

	return {
		surahs
	};
};
