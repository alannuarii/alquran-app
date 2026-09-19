import type { PageServerLoad } from './$types';
import { fetchDoaList, type DoaItem } from '$lib/api';

export const load: PageServerLoad = async () => {
	let doas: DoaItem[] = [];
	try {
		doas = await fetchDoaList();
	} catch (e) {
		console.error('Failed to fetch doa list in load():', e);
	}

	return {
		doas
	};
};
