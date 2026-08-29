export interface PrayerKeyItem {
	key: string;
	name: string;
}

export const PRAYER_KEYS: PrayerKeyItem[] = [
	{ key: 'imsak', name: 'Imsak' },
	{ key: 'subuh', name: 'Subuh' },
	{ key: 'terbit', name: 'Terbit' },
	{ key: 'dhuha', name: 'Dhuha' },
	{ key: 'dzuhur', name: 'Dzuhur' },
	{ key: 'ashar', name: 'Ashar' },
	{ key: 'maghrib', name: 'Maghrib' },
	{ key: 'isya', name: 'Isya' },
];

export interface PrayerInfo {
	key: string;
	name: string;
	time: string;
	dateObj: Date;
}

export type PrayerState =
	| 'entered'           // 0 - 1 min after prayer time ("Sudah memasuki waktu sholat...")
	| 'passed_recently'   // 1 - 10 min after prayer time ("Waktu sholat ... telah lewat X menit")
	| 'approaching'       // <= 10 min before next prayer ("X menit menuju waktu ...")
	| 'upcoming';         // > 10 min before next prayer ("Menuju waktu ...")

export interface PrayerStatusResult {
	state: PrayerState;
	prayer: PrayerInfo;
	headline: string;
	subline: string;
	diffStr: string;
	passedMins?: number;
	badgeLabel: string;
	targetPrayerKey: string;
	isLiveHighlight: boolean;
}

export function parseTimeStr(timeStr: string, baseDate = new Date()): Date {
	const [hours, minutes] = timeStr.split(':').map(Number);
	const d = new Date(baseDate);
	d.setHours(hours, minutes, 0, 0);
	return d;
}

export function formatCountdown(diffMs: number): string {
	const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
	const hours = Math.floor(totalSecs / 3600);
	const mins = Math.floor((totalSecs % 3600) / 60);
	const secs = totalSecs % 60;

	let diffStr = '';
	if (hours > 0) diffStr += `${hours}j `;
	if (mins > 0 || hours > 0) diffStr += `${mins}m `;
	diffStr += `${secs}d`;
	return diffStr.trim() || '0d';
}

export function getPrayerStatus(
	scheduleData: Record<string, string> | null | undefined,
	now = new Date()
): PrayerStatusResult | null {
	if (!scheduleData) return null;

	const prayersToday: PrayerInfo[] = [];
	for (const p of PRAYER_KEYS) {
		const timeStr = scheduleData[p.key];
		if (timeStr) {
			prayersToday.push({
				key: p.key,
				name: p.name,
				time: timeStr,
				dateObj: parseTimeStr(timeStr, now),
			});
		}
	}

	if (prayersToday.length === 0) return null;

	const TEN_MINUTES_MS = 10 * 60 * 1000;
	const ONE_MINUTE_MS = 60 * 1000;

	// 1. Check if any prayer was reached within the last 10 minutes (0 <= now - prayerTime <= 10m)
	// We check from the latest prayer in the day backwards
	for (let i = prayersToday.length - 1; i >= 0; i--) {
		const p = prayersToday[i];
		const elapsedMs = now.getTime() - p.dateObj.getTime();

		if (elapsedMs >= 0 && elapsedMs <= TEN_MINUTES_MS) {
			if (elapsedMs < ONE_MINUTE_MS) {
				// Phase 1: Within 1 minute of prayer entry
				return {
					state: 'entered',
					prayer: p,
					headline: `Sudah Memasuki Waktu Sholat ${p.name}`,
					subline: `Pukul ${p.time}`,
					diffStr: 'Waktu Masuk',
					badgeLabel: 'TELAH MASUK',
					targetPrayerKey: p.key,
					isLiveHighlight: true,
				};
			} else {
				// Phase 2: 1 to 10 minutes after prayer entry
				const passedMins = Math.floor(elapsedMs / ONE_MINUTE_MS);
				return {
					state: 'passed_recently',
					prayer: p,
					headline: `Waktu Sholat ${p.name} telah lewat ${passedMins} menit`,
					subline: `Pukul ${p.time}`,
					diffStr: `+${passedMins}m`,
					passedMins,
					badgeLabel: `LEWAT ${passedMins} MENIT`,
					targetPrayerKey: p.key,
					isLiveHighlight: false,
				};
			}
		}
	}

	// 2. Otherwise find the upcoming prayer
	let nextP: PrayerInfo | null = null;
	for (const p of prayersToday) {
		if (p.dateObj.getTime() > now.getTime()) {
			nextP = p;
			break;
		}
	}

	// If all prayers passed today, next prayer is Imsak tomorrow
	if (!nextP && scheduleData['imsak']) {
		const tomorrowDate = new Date(now);
		tomorrowDate.setDate(tomorrowDate.getDate() + 1);
		nextP = {
			key: 'imsak',
			name: 'Imsak',
			time: scheduleData['imsak'],
			dateObj: parseTimeStr(scheduleData['imsak'], tomorrowDate),
		};
	}

	if (!nextP) return null;

	const diffMs = nextP.dateObj.getTime() - now.getTime();
	const diffStr = formatCountdown(diffMs);

	if (diffMs <= TEN_MINUTES_MS) {
		// Phase 3: <= 10 minutes before next prayer
		const minsLeft = Math.ceil(diffMs / ONE_MINUTE_MS);
		return {
			state: 'approaching',
			prayer: nextP,
			headline: `${minsLeft} menit lagi menuju waktu ${nextP.name}`,
			subline: `Pukul ${nextP.time}`,
			diffStr,
			badgeLabel: `${minsLeft}m MENUJU WAKTU`,
			targetPrayerKey: nextP.key,
			isLiveHighlight: true,
		};
	}

	// Phase 4: > 10 minutes before next prayer
	return {
		state: 'upcoming',
		prayer: nextP,
		headline: `Menuju Waktu ${nextP.name}`,
		subline: `Pukul ${nextP.time}`,
		diffStr,
		badgeLabel: 'SELANJUTNYA',
		targetPrayerKey: nextP.key,
		isLiveHighlight: false,
	};
}

export function sortPrayersBySchedule(
	scheduleData: Record<string, string> | null | undefined,
	now = new Date(),
	activeTargetKey?: string
): PrayerKeyItem[] {
	if (!scheduleData) return PRAYER_KEYS;

	const TEN_MINUTES_MS = 10 * 60 * 1000;

	return [...PRAYER_KEYS].sort((a, b) => {
		const timeStrA = scheduleData[a.key];
		const timeStrB = scheduleData[b.key];
		if (!timeStrA || !timeStrB) return 0;

		// If one matches the currently active transition prayer, it always stays at top
		if (activeTargetKey) {
			if (a.key === activeTargetKey) return -1;
			if (b.key === activeTargetKey) return 1;
		}

		const dateA = parseTimeStr(timeStrA, now);
		const dateB = parseTimeStr(timeStrB, now);

		// An item is considered past if its elapsed time is > 10 minutes ago
		const isPastA = (now.getTime() - dateA.getTime()) > TEN_MINUTES_MS;
		const isPastB = (now.getTime() - dateB.getTime()) > TEN_MINUTES_MS;

		if (isPastA && !isPastB) return 1;
		if (!isPastA && isPastB) return -1;
		return dateA.getTime() - dateB.getTime();
	});
}
