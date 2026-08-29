<script lang="ts">
	import type { PageData } from './$types';
	import { Play, Pause, BookmarkPlus, Info, Type, ChevronLeft } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	
	let { data }: { data: PageData } = $props();
	let surah = $derived(data.surah);
	
	// Arab name mapping
	const arabNames: Record<number, string> = {
		1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
		6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
		11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
		16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
		21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
		26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
		31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبإ', 35: 'فاطر',
		36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
		41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
		46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
		51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
		56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
		61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
		66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
		71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
		76: 'الإنسان', 77: 'المرسلات', 78: 'النبإ', 79: 'النازعات', 80: 'عبس',
		81: 'التكوير', 82: 'الانفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
		86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
		91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
		96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
		101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
		106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
		111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس'
	};

	let fontSize = $state(30);
	let currentlyPlaying = $state<number | null>(null);
	let activeTafsir = $state<number | null>(null);
	let audioEl: HTMLAudioElement | null = null;
	
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	
	function toggleTafsir(ayahNumber: number) {
		activeTafsir = activeTafsir === ayahNumber ? null : ayahNumber;
	}
	
	function playAudio(ayahNumber: number, url: string) {
		if (currentlyPlaying === ayahNumber) {
			audioEl?.pause();
			currentlyPlaying = null;
		} else {
			if (audioEl) {
				audioEl.pause();
				audioEl = null;
			}
			const audio = new Audio(url);
			audioEl = audio;
			audio.play().catch(e => console.error('Audio error:', e));
			currentlyPlaying = ayahNumber;
			audio.onended = () => { currentlyPlaying = null; };
		}
	}

	let startSurah = $state(0);
	let startAyah = $state(1);
	let endAyah = $state(1);
	let isSavingSession = $state(false);
	let sessionPlanId = $derived(data.khatamPlanId);
	let highlightAyah = $state<number | null>(null);

	let bookmarkFormEl = $state<HTMLFormElement | null>(null);

	function endKhatamSessionAtAyah(ayahNum: number) {
		if (sessionPlanId) {
			if (confirm(`Akhiri sesi khatam dan simpan bacaan sampai Surah Ke-${surah?.number} Ayat ${ayahNum}?`)) {
				endAyah = ayahNum;
				setTimeout(() => {
					bookmarkFormEl?.requestSubmit();
				}, 50);
			}
		}
	}

	onMount(() => {
		if (browser) {
			if (data.khatamPlanId) {
				const hashAyah = parseInt(window.location.hash.replace('#ayah-', '')) || 1;
				// Cek apakah sudah ada sesi yang tercatat sebelumnya di storage
				const stored = sessionStorage.getItem('activeKhatamSession');
				if (stored) {
					try {
						const parsed = JSON.parse(stored);
						if (parsed.planId === data.khatamPlanId) {
							startSurah = parsed.startSurah;
							startAyah = parsed.startAyah;
						} else {
							// Sesi baru untuk plan berbeda
							startSurah = surah?.number || 1;
							startAyah = hashAyah;
							sessionStorage.setItem('activeKhatamSession', JSON.stringify({
								planId: data.khatamPlanId,
								startSurah,
								startAyah
							}));
						}
					} catch (e) {
						// Fallback
					}
				} else {
					startSurah = surah?.number || 1;
					startAyah = hashAyah;
					sessionStorage.setItem('activeKhatamSession', JSON.stringify({
						planId: data.khatamPlanId,
						startSurah,
						startAyah
					}));
				}
				endAyah = hashAyah;
			} else {
				// Mode Membaca Bebas: Pastikan sesi storage bersih
				sessionStorage.removeItem('activeKhatamSession');
			}
		}
	});

	$effect(() => {
		if (browser && surah) {
			// Deteksi dan scroll ke ayat target dari hash atau URL
			const currentHash = $page.url.hash || (typeof window !== 'undefined' ? window.location.hash : '');
			const hashAyah = parseInt(currentHash.replace('#ayah-', ''));
			if (!isNaN(hashAyah) && hashAyah > 0) {
				highlightAyah = hashAyah;
				setTimeout(() => {
					const el = document.getElementById(`ayah-${hashAyah}`);
					if (el) {
						el.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}, 350);
			} else {
				highlightAyah = null;
			}

			if (sessionPlanId) {
				// Track ayat terjauh yang dibaca di halaman ini
				const observer = new IntersectionObserver((entries) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							const ayahNum = parseInt(entry.target.getAttribute('data-ayah') || '0');
							if (ayahNum > endAyah) endAyah = ayahNum;
						}
					});
				}, { threshold: 0.5 });
				
				// Small delay to ensure DOM is updated after surah change
				const timeout = setTimeout(() => {
					document.querySelectorAll('.ayah-row').forEach(el => observer.observe(el));
				}, 500);

				return () => {
					clearTimeout(timeout);
					observer.disconnect();
				};
			}
		}
	});
</script>

<svelte:head>
	<title>{surah?.name_latin ?? 'Surah'} - Al-Qur'an Indonesia</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4 {sessionPlanId ? 'pb-24' : 'pb-8'}">
	<!-- Back button -->
	<a 
		href={sessionPlanId ? `/khatam/${sessionPlanId}` : '/surah'} 
		class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors font-medium"
	>
		<ChevronLeft size={16} />
		<span>Kembali</span>
	</a>

	<!-- Surah Header Card -->
	{#if surah}
	<div class="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 shadow-lg text-center mb-8 relative overflow-hidden">
		<div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px); background-size: 30px 30px;"></div>
		<div class="relative z-10">
			<p class="font-uthmani text-4xl mb-2" dir="rtl">{arabNames[surah.number] ?? surah.name_latin}</p>
			<h1 class="text-2xl font-bold">{surah.name_latin}</h1>
			<p class="text-primary-foreground/80 text-sm mt-1">{surah.translation}</p>
			<div class="flex items-center justify-center gap-4 text-sm font-medium border-t border-primary-foreground/20 pt-4 mt-4">
				<span class="uppercase tracking-widest">{surah.revelation === 'Makkiyah' ? 'Makkah' : 'Madinah'}</span>
				<span>&bull;</span>
				<span>{surah.number_of_ayahs} Ayat</span>
			</div>
		</div>
	</div>

	<!-- Sticky Toolbar -->
	<div class="sticky top-0 bg-background/95 backdrop-blur z-20 py-3 mb-8 border-b border-border flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Type size={16} class="text-muted-foreground" />
			<input type="range" min="20" max="60" bind:value={fontSize} class="w-28 accent-primary cursor-pointer">
			<span class="text-xs text-muted-foreground w-10">{fontSize}px</span>
		</div>
		{#if sessionPlanId}
			<span class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
				Mode Khatam Aktif
			</span>
		{/if}
	</div>

	<!-- Hidden Khatam Session Save Form (Only for Khatam Mode) -->
	{#if sessionPlanId}
		<form 
			bind:this={bookmarkFormEl} 
			method="POST" 
			action="?/saveSession"
			class="hidden"
			use:enhance={() => {
				isSavingSession = true;
				return async ({ update, result }) => {
					await update();
					isSavingSession = false;
					if (result.type === 'success') {
						sessionStorage.removeItem('activeKhatamSession');
						window.location.href = `/khatam/${sessionPlanId}`;
					}
				};
			}}
		>
			<input type="hidden" name="khatamPlanId" value={sessionPlanId} />
			<input type="hidden" name="startSurah" value={startSurah} />
			<input type="hidden" name="startAyah" value={startAyah} />
			<input type="hidden" name="endAyah" value={endAyah} />
		</form>
	{/if}

	<!-- Bismillah for non-Fatihah/Tawbah -->
	{#if surah.number !== 1 && surah.number !== 9}
		<div class="text-center py-8 mb-10">
			<p class="font-uthmani text-4xl text-foreground" dir="rtl">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
		</div>
	{/if}

	<!-- Ayahs List -->
	<div class="space-y-10">
		{#each surah.ayahs as ayah (ayah.ayah_number)}
			<div 
				id="ayah-{ayah.ayah_number}" 
				data-ayah={ayah.ayah_number} 
				class="scroll-mt-28 ayah-row transition-all duration-500 rounded-2xl {highlightAyah === ayah.ayah_number ? 'bg-emerald-500/10 border-2 border-emerald-500/80 ring-4 ring-emerald-500/20 p-4 shadow-md' : 'p-2'}"
			>
				<!-- Action bar -->
				<div class="flex items-center justify-between mb-4 bg-muted/40 rounded-xl px-4 py-2">
					<div class="flex items-center gap-2">
						<div class="flex items-center justify-center w-8 h-8 rounded-full {highlightAyah === ayah.ayah_number ? 'bg-emerald-500 text-white shadow-sm font-black' : 'bg-primary/10 text-primary font-bold'} text-sm">
							{ayah.ayah_number}
						</div>
						{#if highlightAyah === ayah.ayah_number}
							{#if sessionPlanId}
								<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm animate-pulse">
									🚩 Mulai Dari Sini
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm animate-pulse">
									✨ Ayat Hari Ini
								</span>
							{/if}
						{/if}
					</div>
					<div class="flex items-center gap-1">
						{#if ayah.audio_url}
							<button
								onclick={() => playAudio(ayah.ayah_number, ayah.audio_url)}
								class="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
								title="Putar Murottal"
							>
								{#if currentlyPlaying === ayah.ayah_number}
									<Pause size={18} />
								{:else}
									<Play size={18} />
								{/if}
							</button>
						{/if}
						
						<!-- Tombol Bookmark HANYA jika dalam Mode Khatam -->
						{#if sessionPlanId}
							<button
								onclick={() => endKhatamSessionAtAyah(ayah.ayah_number)}
								class="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors"
								title="Akhiri sesi khatam di ayat ini"
							>
								<BookmarkPlus size={18} />
							</button>
						{/if}

						<button
							onclick={() => toggleTafsir(ayah.ayah_number)}
							class="p-2 rounded-full {activeTafsir === ayah.ayah_number ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'} transition-colors"
							title="Tafsir"
						>
							<Info size={18} />
						</button>
					</div>
				</div>

				<!-- Arabic Text -->
				<p
					class="font-uthmani text-right leading-loose text-foreground mb-4 px-2"
					style="font-size: {fontSize}px; line-height: {fontSize < 35 ? '2.4' : '2.8'};"
					dir="rtl"
				>
					{ayah.arab}
				</p>

				<!-- Terjemahan -->
				<p class="text-muted-foreground leading-relaxed text-sm px-2">
					{ayah.translation}
				</p>

				<!-- Tafsir Section -->
				{#if activeTafsir === ayah.ayah_number}
					<div transition:slide={{ duration: 200 }} class="bg-muted/50 border border-border rounded-xl p-4 mt-4 text-sm">
						<h4 class="font-bold text-primary mb-2 text-xs uppercase tracking-wider">Tafsir Kemenag (Ringkas)</h4>
						<p class="text-foreground leading-relaxed">{ayah.tafsir?.kemenag?.short ?? 'Tafsir tidak tersedia.'}</p>
					</div>
				{/if}
				
				<div class="h-px bg-border/40 mt-8"></div>
			</div>
		{/each}
	</div>

	<!-- Pagination Controls (RTL-oriented for Quran reading) -->
	{#if surah.pagination}
		{@const totalPages = Math.ceil(surah.pagination.total / surah.pagination.limit)}
		{#if totalPages > 1}
			<div class="flex items-center justify-center gap-3 pt-8 pb-2">
				<!-- Next (Halaman Selanjutnya - Sisi Kiri) -->
				{#if surah.pagination.page < totalPages}
					<a href="/surah/{surah.number}?page={surah.pagination.page + 1}{sessionPlanId ? `&khatam_plan_id=${sessionPlanId}` : ''}" class="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
						&larr; Next
					</a>
				{:else}
					<button disabled class="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold opacity-50 cursor-not-allowed">
						&larr; Next
					</button>
				{/if}
				
				<span class="text-sm font-medium text-muted-foreground px-4">
					Hal. {surah.pagination.page} / {totalPages}
				</span>

				<!-- Prev (Halaman Sebelumnya - Sisi Kanan) -->
				{#if surah.pagination.page > 1}
					<a href="/surah/{surah.number}?page={surah.pagination.page - 1}{sessionPlanId ? `&khatam_plan_id=${sessionPlanId}` : ''}" class="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
						Prev &rarr;
					</a>
				{:else}
					<button disabled class="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold opacity-50 cursor-not-allowed">
						Prev &rarr;
					</button>
				{/if}
			</div>
		{/if}
	{/if}

	{:else}
		<div class="text-center py-20 text-muted-foreground">Surah tidak ditemukan.</div>
	{/if}
</div>

{#if sessionPlanId}
	<div class="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex items-center justify-between md:justify-center md:gap-4 animate-in slide-in-from-bottom-full duration-500" style="padding-bottom: max(1rem, env(safe-area-inset-bottom));">
		<div class="hidden md:block text-sm font-medium mr-4">
			Mode Khatam
			<span class="text-xs text-muted-foreground block font-normal">Dari Surah Ke-{startSurah} Ayat {startAyah}</span>
		</div>
		
		{#if surah?.number < 114 && (!surah.pagination || surah.pagination.page >= Math.ceil(surah.pagination.total / surah.pagination.limit))}
			<a 
				href="/surah/{surah.number + 1}?khatam_plan_id={sessionPlanId}"
				class="bg-secondary text-secondary-foreground px-4 md:px-6 py-3 rounded-full font-bold shadow-md hover:-translate-y-1 hover:shadow-lg transition-all w-full md:w-auto text-center text-sm md:text-base flex-1 md:flex-none"
			>
				Surah Selanjutnya
			</a>
		{/if}

		<form 
			method="POST" 
			action="?/saveSession"
			use:enhance={() => {
				isSavingSession = true;
				return async ({ update, result }) => {
					await update();
					isSavingSession = false;
					if (result.type === 'success') {
						sessionStorage.removeItem('activeKhatamSession');
						window.location.href = `/khatam/${sessionPlanId}`;
					}
				};
			}}
			class="flex-1 md:flex-none"
		>
			<input type="hidden" name="khatamPlanId" value={sessionPlanId} />
			<input type="hidden" name="startSurah" value={startSurah} />
			<input type="hidden" name="startAyah" value={startAyah} />
			<input type="hidden" name="endAyah" value={endAyah} />
			
			<button 
				type="submit" 
				disabled={isSavingSession}
				class="bg-primary text-primary-foreground px-4 md:px-6 py-3 rounded-full font-bold shadow-xl shadow-primary/30 hover:-translate-y-1 hover:shadow-primary/40 transition-all disabled:opacity-70 disabled:hover:translate-y-0 w-full md:w-auto text-sm md:text-base"
			>
				{isSavingSession ? 'Menyimpan...' : 'Akhiri & Simpan'}
			</button>
		</form>
	</div>
{/if}
