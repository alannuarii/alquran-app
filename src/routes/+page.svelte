<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { Play, Pause, ArrowRight, Book, Target, Sparkles, Clock, MapPin, CalendarDays } from 'lucide-svelte';
	import { getPrayerStatus, type PrayerStatusResult } from '$lib/prayer';
	import { fetchHijriOffset, formatHijriDate } from '$lib/calendar';

	let { data }: { data: PageData } = $props();

	let isAudioPlaying = $state(false);
	let audioInstance: HTMLAudioElement | null = null;

	// Prayer reminder states for Homepage
	let prayerLoading = $state(true);
	let currentCity = $state('KOTA JAKARTA');
	let currentTime = $state(new Date());
	let prayerInterval: ReturnType<typeof setInterval>;
	let scheduleData = $state<any>(null);
	let hijriOffset = $state(0);

	const timeFormatted = $derived(
		currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')
	);

	const masehiDateFormatted = $derived(
		currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/\bMinggu\b/gi, 'Ahad')
	);

	const hijriDateFormatted = $derived(
		formatHijriDate(currentTime, hijriOffset)
	);

	const getTodayParts = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return { year, month, day };
	};

	const prayerStatus = $derived<PrayerStatusResult | null>(
		getPrayerStatus(scheduleData, currentTime)
	);

	async function fetchScheduleForCity(cityId: string, cityName: string) {
		try {
			const { year, month, day } = getTodayParts();
			const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
			const resData = await res.json();
			if (resData.status && resData.data) {
				currentCity = resData.data.lokasi || cityName;
				scheduleData = resData.data.jadwal;
			}
		} catch (e) {
			console.error('Fetch schedule error:', e);
		} finally {
			prayerLoading = false;
		}
	}

	async function initPrayerReminder() {
		if (typeof window === 'undefined') return;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					try {
						const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
						const data = await res.json();
						const candidates = [
							data.address.county,
							data.address.city,
							data.address.municipality,
							data.address.town,
							data.address.state,
							'Jakarta'
						];
						
						let cityName = 'Jakarta';
						for (const name of candidates) {
							if (name && typeof name === 'string') {
								const lower = name.toLowerCase();
								if (!lower.includes('kelurahan') && !lower.includes('desa') && !lower.includes('kecamatan')) {
									cityName = name;
									break;
								}
							}
						}
						
						cityName = cityName.replace(/kota|kabupaten|selatan|utara|timur|barat|pusat/gi, '').trim();
						const searchRes = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(cityName)}`);
						const searchData = await searchRes.json();
						if (searchData.status && searchData.data && searchData.data.length > 0) {
							await fetchScheduleForCity(searchData.data[0].id, searchData.data[0].lokasi);
						} else {
							await fetchScheduleForCity('1301', 'KOTA JAKARTA');
						}
					} catch {
						await fetchScheduleForCity('1301', 'KOTA JAKARTA');
					}
				},
				async () => {
					await fetchScheduleForCity('1301', 'KOTA JAKARTA');
				},
				{ timeout: 8000 }
			);
		} else {
			await fetchScheduleForCity('1301', 'KOTA JAKARTA');
		}
	}

	onMount(async () => {
		initPrayerReminder();
		try {
			hijriOffset = await fetchHijriOffset();
		} catch (e) {
			console.error('Failed to fetch Hijri offset:', e);
		}
		prayerInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
	});

	onDestroy(() => {
		if (prayerInterval) clearInterval(prayerInterval);
	});

	function toggleAyahAudio(audioUrl: string) {
		if (isAudioPlaying) {
			audioInstance?.pause();
			isAudioPlaying = false;
		} else {
			if (!audioInstance || audioInstance.src !== audioUrl) {
				if (audioInstance) {
					audioInstance.pause();
				}
				audioInstance = new Audio(audioUrl);
				audioInstance.onended = () => {
					isAudioPlaying = false;
				};
				audioInstance.onerror = (e) => {
					console.error('Audio playback error:', e);
					isAudioPlaying = false;
				};
			}
			audioInstance.play();
			isAudioPlaying = true;
		}
	}
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
	<!-- Header with Salam & Realtime Timer / Hijri Calendar -->
	<header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<h1 class="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Assalamu'alaikum</h1>
			{#if data.user}
				<p class="text-sm sm:text-base text-muted-foreground mt-0.5">Selamat datang kembali, {data.user.name}</p>
			{:else}
				<p class="text-sm sm:text-base text-muted-foreground mt-0.5">Selamat datang di Aplikasi Al-Qur'an</p>
			{/if}
		</div>

		<!-- Realtime Clock, Masehi & Hijri Calendar Widget -->
		<div class="bg-card/80 border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm backdrop-blur-sm flex items-center justify-between md:justify-end gap-3 sm:gap-5">
			<div class="flex flex-col text-left md:text-right space-y-0.5">
				<div class="flex items-center gap-1.5 md:justify-end text-xs sm:text-sm font-bold text-foreground">
					<CalendarDays class="w-3.5 h-3.5 text-primary shrink-0" />
					<span>{masehiDateFormatted}</span>
				</div>
				<div class="flex items-center gap-1.5 md:justify-end text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
					<span>{hijriDateFormatted}</span>
				</div>
			</div>
			
			<div class="h-8 w-px bg-border hidden sm:block"></div>
			
			<div class="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-primary shrink-0">
				<Clock class="w-4 h-4 text-primary animate-pulse shrink-0" />
				<span class="font-mono font-black text-base sm:text-lg tracking-wider tabular-nums">{timeFormatted}</span>
			</div>
		</div>
	</header>

	<!-- Prayer Reminder Widget Card -->
	<section class="bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
			<!-- Left side info -->
			<div class="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
				<div class="w-12 h-12 rounded-2xl {prayerStatus?.state === 'entered' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-primary/10 text-primary'} flex items-center justify-center shrink-0 transition-colors">
					<Clock size={24} />
				</div>
				<div class="space-y-1 min-w-0 flex-1">
					<div class="flex items-center gap-2 min-w-0">
						<span class="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">Pengingat Sholat</span>
						<span 
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full max-w-[130px] xs:max-w-[170px] sm:max-w-[260px] min-w-0 shrink"
							title={currentCity}
						>
							<MapPin class="w-3.5 h-3.5 shrink-0 text-primary" />
							<span class="truncate whitespace-nowrap">{currentCity}</span>
						</span>
					</div>
					{#if prayerLoading}
						<p class="text-sm font-medium text-muted-foreground animate-pulse">Memuat jadwal waktu sholat...</p>
					{:else if prayerStatus}
						{#if prayerStatus.state === 'entered'}
							<div class="flex flex-wrap items-baseline gap-1.5 md:gap-2">
								<h3 class="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 animate-pulse">
									Waktu Sholat {prayerStatus.prayer.name} Telah Masuk!
								</h3>
								<span class="text-[10px] md:text-xs font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">
									Pukul {prayerStatus.prayer.time}
								</span>
							</div>
						{:else if prayerStatus.state === 'passed_recently'}
							<div class="flex flex-wrap items-baseline gap-1.5 md:gap-2">
								<h3 class="text-base md:text-lg font-bold text-foreground">
									Waktu sholat <span class="text-amber-600 dark:text-amber-400 font-extrabold">{prayerStatus.prayer.name}</span> telah lewat {prayerStatus.passedMins} menit
								</h3>
								<span class="text-[10px] md:text-xs font-medium text-muted-foreground">
									(Pukul {prayerStatus.prayer.time})
								</span>
							</div>
						{:else if prayerStatus.state === 'approaching'}
							<div class="flex flex-wrap items-baseline gap-1.5 md:gap-2">
								<h3 class="text-base md:text-lg font-extrabold text-foreground">
									{prayerStatus.headline}
								</h3>
								<span class="text-xs md:text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md animate-pulse">
									{prayerStatus.diffStr} lagi
								</span>
							</div>
						{:else}
							<div class="flex flex-wrap items-baseline gap-1.5 md:gap-2">
								<h3 class="text-base md:text-lg font-extrabold text-foreground">
									Menuju <span class="text-primary font-black">{prayerStatus.prayer.name}</span> ({prayerStatus.prayer.time})
								</h3>
								<span class="text-xs md:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
									{prayerStatus.diffStr} lagi
								</span>
							</div>
						{/if}
					{:else}
						<p class="text-sm font-medium text-foreground">Jadwal sholat hari ini telah selesai</p>
					{/if}
				</div>
			</div>

			<!-- Right side CTA Button -->
			<div class="shrink-0">
				<a 
					href="/jadwal-sholat" 
					class="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm hover:shadow hover:-translate-y-0.5 w-full md:w-auto"
				>
					<span>Lihat Jadwal Lengkap</span>
					<ArrowRight size={16} />
				</a>
			</div>
		</div>
	</section>

	<!-- Quick Access Cards Section -->
	{#if data.activeKhatamPlan || data.userLastRead}
		<div class="grid grid-cols-1 {data.activeKhatamPlan && data.userLastRead ? 'md:grid-cols-2' : 'w-full'} gap-6">
			<!-- Active Khatam Program Card -->
			{#if data.activeKhatamPlan}
				<section class="w-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 md:p-7 shadow-lg shadow-emerald-500/15 relative overflow-hidden flex flex-col justify-between group hover:shadow-emerald-500/25 transition-all">
					<div class="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-105 transition-transform duration-500">
						<Target size={160} />
					</div>
					<div class="relative z-10 space-y-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider">
								<Target size={15} />
								<span>Program Khatam Aktif</span>
							</div>
							<span class="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-md">
								{data.activeKhatamPlan.progressPercentage.toFixed(1)}%
							</span>
						</div>

						<div>
							<h2 class="text-xl md:text-2xl font-bold line-clamp-1">{data.activeKhatamPlan.title}</h2>
							<p class="text-emerald-100 text-sm mt-1">
								Lanjut ke: <span class="font-bold text-white underline decoration-emerald-300 decoration-2 underline-offset-2">Surah Ke-{data.activeKhatamPlan.nextSurah} Ayat {data.activeKhatamPlan.nextAyah}</span>
							</p>
						</div>

						<!-- Mini Progress Bar -->
						<div class="space-y-2 pt-1">
							<div class="h-2.5 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
								<div 
									class="h-full bg-white rounded-full transition-all duration-700 shadow-sm" 
									style="width: {data.activeKhatamPlan.progressPercentage}%"
								></div>
							</div>
							<div class="flex justify-between text-xs text-emerald-100/90 font-medium">
								<span>{data.activeKhatamPlan.totalAyahsRead.toLocaleString('id-ID')} / 6.236 Ayat</span>
								<span>{data.activeKhatamPlan.sessionCount} Sesi Tercatat</span>
							</div>
						</div>

						<div class="pt-2">
							<a 
								href="/surah/{data.activeKhatamPlan.nextSurah}?page={data.activeKhatamPlan.targetPage}&khatam_plan_id={data.activeKhatamPlan.id}#ayah-{data.activeKhatamPlan.nextAyah}" 
								class="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 transition-all font-bold px-6 py-3 rounded-full text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
							>
								<span>Lanjutkan Khatam</span>
								<ArrowRight size={16} />
							</a>
						</div>
					</div>
				</section>
			{/if}

			<!-- Last Read Reguler Card -->
			{#if data.userLastRead}
				<section class="bg-gradient-to-br from-primary/95 to-primary text-primary-foreground rounded-3xl p-6 md:p-7 shadow-lg shadow-primary/15 relative overflow-hidden flex flex-col justify-between group hover:shadow-primary/25 transition-all">
					<div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-105 transition-transform duration-500">
						<Book size={150} />
					</div>
					<div class="relative z-10 space-y-4">
						<div class="flex items-center gap-2 text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">
							<Book size={15} />
							<span>Terakhir Dibaca</span>
						</div>

						<div>
							<h2 class="text-xl md:text-2xl font-bold">Surah Ke-{data.userLastRead.surahNumber}</h2>
							<p class="text-primary-foreground/90 text-sm mt-1">
								Terakhir: Ayat {data.userLastRead.ayahNumber} &bull; Lanjut: <span class="font-bold text-white">Ayat {data.userLastRead.nextAyah}</span>
							</p>
						</div>

						<div class="pt-4">
							<a 
								href="/surah/{data.userLastRead.nextSurah}?page={data.userLastRead.targetPage}#ayah-{data.userLastRead.nextAyah}" 
								class="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-all text-white font-bold px-6 py-3 rounded-full text-sm backdrop-blur-md hover:-translate-y-0.5"
							>
								<span>Lanjutkan Membaca</span>
								<ArrowRight size={16} />
							</a>
						</div>
					</div>
				</section>
			{/if}
		</div>
	{/if}

	<!-- Ayat Hari Ini Section (Polished for Desktop) -->
	{#if data.randomAyah}
		<section class="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
			<!-- Header -->
			<div class="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4 mb-6">
				<div class="flex items-center gap-2.5">
					<div class="p-2 rounded-xl bg-primary/10 text-primary">
						<Sparkles size={18} />
					</div>
					<div>
						<h3 class="text-lg font-bold text-foreground leading-none">Ayat Hari Ini</h3>
						<p class="text-xs text-muted-foreground mt-1">Inspirasi harian dari kalam ilahi</p>
					</div>
				</div>
				<span class="text-xs md:text-sm text-primary font-bold bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full">
					Surah {data.randomAyah.surah.name_latin} ({data.randomAyah.surah.number}:{data.randomAyah.ayah_number})
				</span>
			</div>
			
			<!-- Content Body -->
			<div class="py-4 space-y-6 max-w-3xl mx-auto">
				<!-- Arabic Verse -->
				<div class="bg-muted/30 dark:bg-muted/20 border border-border/40 rounded-2xl p-6 md:p-8">
					<p class="font-uthmani text-2xl md:text-4xl text-right leading-[2.5] md:leading-[2.8] text-foreground" dir="rtl">
						{data.randomAyah.arab}
					</p>
				</div>

				<!-- Translation -->
				<div class="px-2">
					<p class="text-muted-foreground text-sm md:text-base leading-relaxed italic text-center md:text-left">
						"{data.randomAyah.translation}"
					</p>
				</div>
			</div>

			<!-- Footer Controls -->
			<div class="pt-6 mt-6 flex items-center justify-between border-t border-border/60">
				{#if data.randomAyah.audio_url}
					<button 
						onclick={() => toggleAyahAudio(data.randomAyah.audio_url)}
						class="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all px-5 py-2.5 rounded-full text-sm font-bold shadow-md shadow-primary/20 hover:-translate-y-0.5"
					>
						{#if isAudioPlaying}
							<Pause size={16} /> Jeda Audio
						{:else}
							<Play size={16} class="fill-current" /> Putar Audio
						{/if}
					</button>
				{/if}
				<a 
					href="/surah/{data.randomAyah.surah.number}?page={Math.ceil(data.randomAyah.ayah_number / 10)}#ayah-{data.randomAyah.ayah_number}" 
					class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-colors ml-auto"
				>
					<span>Buka Surah & Tafsir</span>
					<ArrowRight size={15} />
				</a>
			</div>
		</section>
	{/if}
</div>
