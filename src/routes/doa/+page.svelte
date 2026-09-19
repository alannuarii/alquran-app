<script lang="ts">
	import type { PageData } from './$types';
	import { 
		Search, Play, Pause, Info, Type, 
		BookMarked, Sparkles, Volume2, X, ChevronDown, BookOpen 
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	// State
	let searchQuery = $state('');
	let selectedCategory = $state('Semua');
	let fontSize = $state(28);
	let activeTafsir = $state<number | null>(null);
	let currentlyPlayingId = $state<number | null>(null);

	// Quick filter categories
	const categoryFilters = [
		{ id: 'Semua', label: 'Semua Doa' },
		{ id: 'Shalat', label: 'Sholat & Dzikir', match: ['shalat', 'sholat', 'adzan', 'dzikir'] },
		{ id: 'Pagi Petang', label: 'Pagi & Petang', match: ['pagi', 'petang'] },
		{ id: 'Tidur', label: 'Tidur', match: ['tidur'] },
		{ id: 'Makan', label: 'Makan & Minum', match: ['makan', 'puasa', 'ramadhan'] },
		{ id: 'Rumah', label: 'Rumah & Keluarga', match: ['rumah', 'orang tua', 'istri', 'anak', 'pernikahan', 'wudhu', 'kamar mandi', 'berpakaian'] },
		{ id: 'Perjalanan', label: 'Perjalanan / Safar', match: ['perjalanan'] },
		{ id: 'Perlindungan', label: 'Perlindungan & Taubat', match: ['berlindung', 'istighfar', 'taubat', 'setan', 'syirik'] },
		{ id: 'Kebaikan', label: 'Kebaikan & Hajat', match: ['kebaikan', 'ilmu', 'harta', 'hutang', 'hati', 'akhlak', 'surga'] },
		{ id: 'Sakit', label: 'Sakit & Jenazah', match: ['sakit', 'jenazah', 'wafat', 'sedih', 'sulit'] },
	];

	// Extract unique raw groups from API
	let allRawGroups = $derived.by(() => {
		const groups = new Set<string>();
		(data.doas || []).forEach((d: any) => {
			if (d.grup) groups.add(d.grup);
		});
		return Array.from(groups).sort();
	});

	// Filtered Doas
	let filteredDoas = $derived.by(() => {
		let list = data.doas || [];

		// Filter by Category
		if (selectedCategory !== 'Semua') {
			const filterObj = categoryFilters.find(c => c.id === selectedCategory);
			if (filterObj && filterObj.match) {
				const keywords = filterObj.match;
				list = list.filter((d: any) => {
					const g = (d.grup || '').toLowerCase();
					return keywords.some(k => g.includes(k));
				});
			} else {
				// Exact match with raw group
				list = list.filter((d: any) => d.grup === selectedCategory);
			}
		}

		// Filter by Search Query
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter((d: any) => 
				(d.nama && d.nama.toLowerCase().includes(q)) ||
				(d.idn && d.idn.toLowerCase().includes(q)) ||
				(d.tr && d.tr.toLowerCase().includes(q)) ||
				(d.ar && d.ar.includes(q)) ||
				(d.grup && d.grup.toLowerCase().includes(q))
			);
		}

		return list;
	});

	// Pagination (10 doa per page)
	const ITEMS_PER_PAGE = 10;
	let currentPage = $state(1);

	let totalPages = $derived(Math.max(1, Math.ceil(filteredDoas.length / ITEMS_PER_PAGE)));

	let paginatedDoas = $derived.by(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredDoas.slice(start, start + ITEMS_PER_PAGE);
	});

	// Reset ke halaman 1 saat filter kategori atau query pencarian berubah
	$effect(() => {
		selectedCategory;
		searchQuery;
		currentPage = 1;
	});

	function goToPage(p: number) {
		if (p < 1 || p > totalPages) return;
		currentPage = p;
		if (browser) {
			const toolbarEl = document.getElementById('doa-toolbar');
			if (toolbarEl) {
				toolbarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} else {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}
	}

	// Toggle Tafsir
	function toggleTafsir(id: number) {
		activeTafsir = activeTafsir === id ? null : id;
	}



	// Audio Recitation via Web Speech API (Arabic Native TTS)
	function playAudio(doa: any) {
		if (!browser) return;
		if (!('speechSynthesis' in window)) {
			alert('Browser Anda tidak mendukung pemutaran suara otomatis.');
			return;
		}

		const synth = window.speechSynthesis;

		if (currentlyPlayingId === doa.id) {
			synth.cancel();
			currentlyPlayingId = null;
			return;
		}

		synth.cancel(); // Stop current playing

		const utterance = new SpeechSynthesisUtterance(doa.ar);
		utterance.lang = 'ar-SA';
		utterance.rate = 0.82; // Pelafalan tenang dan jelas

		// Cari suara Arab terbaik jika didukung peramban
		const voices = synth.getVoices();
		const arabicVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('SA') || v.lang.includes('EG'));
		if (arabicVoice) {
			utterance.voice = arabicVoice;
		}

		utterance.onstart = () => {
			currentlyPlayingId = doa.id;
		};

		utterance.onend = () => {
			if (currentlyPlayingId === doa.id) {
				currentlyPlayingId = null;
			}
		};

		utterance.onerror = (e) => {
			console.error('Error saat memutar audio:', e);
			currentlyPlayingId = null;
		};

		currentlyPlayingId = doa.id;
		synth.speak(utterance);
	}

	function stopAudio() {
		if (browser && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
			currentlyPlayingId = null;
		}
	}

	onDestroy(() => {
		stopAudio();
	});
</script>

<svelte:head>
	<title>Kumpulan Doa Harian & Pilihan - Al-Qur'an Indonesia</title>
	<meta name="description" content="Koleksi lengkap doa harian dan pilihan bersumber dari Al-Qur'an dan As-Sunnah lengkap dengan teks Arab, terjemahan, audio pelafalan, dan riwayat hadits." />
</svelte:head>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-20">
	<!-- Hero Banner Card -->
	<div class="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-6 md:p-8 shadow-lg text-center relative overflow-hidden">
		<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 20% 80%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px); background-size: 30px 30px;"></div>
		<div class="relative z-10 space-y-3">
			<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-semibold backdrop-blur-sm">
				<BookMarked size={14} />
				<span>Hisnul Muslim & As-Sunnah</span>
			</div>
			<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Kumpulan Doa Harian & Pilihan</h1>
			<p class="font-uthmani text-2xl md:text-3xl leading-relaxed opacity-95 text-primary-foreground" dir="rtl">
				وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ
			</p>
			<p class="text-xs md:text-sm text-primary-foreground/80 max-w-xl mx-auto">
				"Dan Tuhanmu berfirman: Berdoalah kepada-Ku, niscaya akan Aku perkenankan bagimu." (QS. Ghafir: 60)
			</p>
			<div class="flex items-center justify-center gap-4 text-xs font-semibold border-t border-primary-foreground/20 pt-3 mt-4">
				<span>{data.doas?.length || 227} Doa Tersedia</span>
				<span>&bull;</span>
				<span>Teks Arab & Terjemahan</span>
				<span>&bull;</span>
				<span>Riwayat Hadits & Tafsir</span>
			</div>
		</div>
	</div>

	<!-- Search & Category Filters -->
	<div class="space-y-4">
		<!-- Search Bar -->
		<div class="relative">
			<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
				<Search size={18} />
			</div>
			<input 
				type="text" 
				bind:value={searchQuery}
				placeholder="Cari doa (contoh: sebelum tidur, makan, rezeki, perlindungan, dll.)..." 
				class="block w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm transition-all"
			/>
			{#if searchQuery}
				<button 
					onclick={() => searchQuery = ''}
					class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
					aria-label="Hapus pencarian"
				>
					<X size={16} />
				</button>
			{/if}
		</div>

		<!-- Category Quick Pills -->
		<div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-medium no-scrollbar">
			{#each categoryFilters as cat}
				<button
					onclick={() => selectedCategory = cat.id}
					class="px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border {selectedCategory === cat.id ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/80'}"
				>
					{#if cat.id === 'Semua'}
						<Sparkles size={13} />
					{/if}
					<span>{cat.label}</span>
				</button>
			{/each}
		</div>

		<!-- Specific Category Dropdown Selector (Optional deep filter) -->
		<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60">
			<span class="font-medium shrink-0">Sub-Kategori Khusus:</span>
			<select 
				bind:value={selectedCategory}
				class="bg-card text-foreground border border-border rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none max-w-[260px] md:max-w-xs truncate cursor-pointer"
			>
				<option value="Semua">Tampilkan Semua Kategori</option>
				{#each allRawGroups as grp}
					<option value={grp}>{grp}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Sticky Toolbar (Font Slider & Counter) -->
	<div id="doa-toolbar" class="sticky top-0 bg-background/95 backdrop-blur z-20 py-3 border-b border-border flex items-center justify-between gap-4">
		<div class="flex items-center gap-2 text-xs text-muted-foreground font-medium">
			<span class="font-bold text-foreground">{filteredDoas.length}</span> doa ditemukan
			{#if totalPages > 1}
				<span>&bull; Hal. <strong class="text-primary">{currentPage}</strong>/{totalPages}</span>
			{/if}
			{#if selectedCategory !== 'Semua'}
				<span class="hidden sm:inline">&bull; Kategori: <strong class="text-primary">{selectedCategory}</strong></span>
			{/if}
		</div>
		
		<div class="flex items-center gap-3">
			<Type size={16} class="text-muted-foreground shrink-0" />
			<input 
				type="range" 
				min="22" 
				max="50" 
				bind:value={fontSize} 
				class="w-24 sm:w-28 accent-primary cursor-pointer"
				title="Atur Ukuran Teks Arab"
			/>
			<span class="text-xs text-muted-foreground w-8 text-right font-mono">{fontSize}px</span>
		</div>
	</div>

	<!-- Doa Cards List -->
	<div class="space-y-8">
		{#each paginatedDoas as doa, idx (doa.id)}
			<div 
				id="doa-{doa.id}"
				class="transition-all duration-300 rounded-2xl p-3 sm:p-4 {currentlyPlayingId === doa.id ? 'bg-primary/5 border border-primary/40 shadow-md ring-2 ring-primary/20' : 'hover:bg-muted/30'}"
			>
				<!-- Action Bar (Top Header per Doa) -->
				<div class="flex items-center justify-between mb-4 bg-muted/50 dark:bg-muted/40 rounded-xl px-3 sm:px-4 py-2.5 gap-2">
					<!-- Left: Number badge & Category tag -->
					<div class="flex items-center gap-2.5 min-w-0">
						<div class="flex items-center justify-center w-8 h-8 rounded-full {currentlyPlayingId === doa.id ? 'bg-primary text-primary-foreground font-black animate-pulse' : 'bg-primary/10 text-primary font-bold'} text-xs shrink-0">
							{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
						</div>
						<div class="min-w-0">
							<h2 class="text-sm font-bold text-foreground truncate">{doa.nama}</h2>
							{#if doa.grup}
								<span class="text-[11px] text-muted-foreground font-medium truncate block">{doa.grup}</span>
							{/if}
						</div>
					</div>

					<!-- Right: Action Buttons -->
					<div class="flex items-center gap-1 shrink-0">
						<!-- Play / Stop Audio Button -->
						<button
							onclick={() => playAudio(doa)}
							class="p-2 rounded-full {currentlyPlayingId === doa.id ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-primary/10 text-primary'} transition-all"
							title={currentlyPlayingId === doa.id ? 'Hentikan Audio' : 'Dengarkan Pelafalan Arab'}
							aria-label="Putar Audio Doa"
						>
							{#if currentlyPlayingId === doa.id}
								<Pause size={17} />
							{:else}
								<Play size={17} />
							{/if}
						</button>



						<!-- Tafsir / Riwayat Button -->
						<button
							onclick={() => toggleTafsir(doa.id)}
							class="p-2 rounded-full {activeTafsir === doa.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted text-muted-foreground'} transition-colors"
							title="Tafsir & Riwayat Hadits"
							aria-label="Tafsir & Riwayat Hadits"
						>
							<Info size={17} />
						</button>
					</div>
				</div>

				<!-- Playing Wave Banner (if active) -->
				{#if currentlyPlayingId === doa.id}
					<div transition:slide={{ duration: 150 }} class="flex items-center justify-between bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 mb-3 text-xs font-semibold">
						<div class="flex items-center gap-2">
							<Volume2 size={15} class="animate-bounce" />
							<span>Sedang Memutar Pelafalan Doa...</span>
						</div>
						<button onclick={stopAudio} class="text-xs hover:underline">Hentikan</button>
					</div>
				{/if}

				<!-- Arabic Text (Styled with font-uthmani, loose line-height, adjustable font size) -->
				<p
					class="font-uthmani text-right leading-loose text-foreground mb-4 px-2"
					style="font-size: {fontSize}px; line-height: {fontSize < 32 ? '2.4' : '2.8'};"
					dir="rtl"
				>
					{doa.ar}
				</p>

				<!-- Latin Transliteration (if available) -->
				{#if doa.tr}
					<p class="text-xs sm:text-sm text-primary/80 dark:text-emerald-400/90 font-medium italic leading-relaxed mb-2 px-2">
						{doa.tr}
					</p>
				{/if}

				<!-- Terjemahan / Arti -->
				<p class="text-muted-foreground leading-relaxed text-sm sm:text-base px-2">
					{doa.idn}
				</p>

				<!-- Tafsir & Riwayat Hadits (Expandable Section) -->
				{#if activeTafsir === doa.id}
					<div transition:slide={{ duration: 200 }} class="bg-muted/50 dark:bg-muted/30 border border-border rounded-xl p-4 mt-4 text-xs sm:text-sm space-y-2">
						<div class="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-wider">
							<BookOpen size={14} />
							<span>Tafsir, Riwayat Hadits & Faedah</span>
						</div>
						{#if doa.tentang}
							<div class="text-foreground leading-relaxed whitespace-pre-line">
								{doa.tentang}
							</div>
						{:else}
							<p class="text-muted-foreground italic">
								Keterangan dan riwayat khusus untuk doa ini belum tersedia.
							</p>
						{/if}
						{#if doa.tag && doa.tag.length > 0}
							<div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
								<span class="text-[11px] text-muted-foreground">Tag:</span>
								{#each doa.tag as tg}
									<span class="px-2 py-0.5 rounded-md bg-background border border-border text-[11px] text-muted-foreground">
										#{tg}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Divider -->
				<div class="h-px bg-border/40 mt-6"></div>
			</div>
		{:else}
			<div class="py-16 text-center space-y-3 bg-card border border-border/60 rounded-2xl p-6">
				<div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
					<Search size={24} />
				</div>
				<h3 class="text-base font-bold text-foreground">Doa Tidak Ditemukan</h3>
				<p class="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
					Tidak ada doa yang sesuai dengan kata kunci atau kategori yang dipilih. Cobalah kata kunci lain seperti "tidur", "makan", atau pilih "Semua Doa".
				</p>
				<button 
					onclick={() => { searchQuery = ''; selectedCategory = 'Semua'; }}
					class="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm"
				>
					Reset Pencarian
				</button>
			</div>
		{/each}
	</div>

	<!-- Pagination Controls (Mengikuti model dan desain Al-Qur'an) -->
	{#if totalPages > 1}
		<div class="flex items-center justify-center gap-3 pt-6 pb-4">
			<!-- Prev Button -->
			{#if currentPage > 1}
				<button 
					onclick={() => goToPage(currentPage - 1)} 
					class="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors cursor-pointer"
					title="Halaman Sebelumnya"
				>
					&larr; Prev
				</button>
			{:else}
				<button disabled class="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold opacity-50 cursor-not-allowed">
					&larr; Prev
				</button>
			{/if}
			
			<span class="text-sm font-medium text-muted-foreground px-4">
				Hal. {currentPage} / {totalPages}
			</span>

			<!-- Next Button -->
			{#if currentPage < totalPages}
				<button 
					onclick={() => goToPage(currentPage + 1)} 
					class="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors cursor-pointer"
					title="Halaman Selanjutnya"
				>
					Next &rarr;
				</button>
			{:else}
				<button disabled class="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold opacity-50 cursor-not-allowed">
					Next &rarr;
				</button>
			{/if}
		</div>
	{/if}
</div>
